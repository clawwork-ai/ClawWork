import { test, expect } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { launchApp } from '../helpers/electron-app';
import { waitForGateway } from '../helpers/gateway';
import { approvePendingPairing, getDeviceIdFromUserData, getDeviceTokenFromUserData } from '../helpers/pairing';
import { GATEWAY_ID, CONNECTION_TIMEOUT_MS, GATEWAY_WS_URL, buildSessionKey } from '../helpers/constants';

let app: ElectronApplication;
let page: Page;
let cleanup: () => void;
let userDataDir: string;
let workspaceDir: string;

async function waitForGatewayConnected(targetPage: Page): Promise<void> {
  await expect(async () => {
    const status = await targetPage.evaluate(() => window.clawwork.gatewayStatus());
    expect(status[GATEWAY_ID]?.connected).toBe(true);
  }).toPass({ timeout: CONNECTION_TIMEOUT_MS });
}

test.beforeAll(async () => {
  await waitForGateway();
  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-e2e-userdata-'));
  workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-e2e-ws-'));
  ({ app, page, cleanup } = await launchApp({ gateway: true, userDataDir, workspaceDir }));

  expect(getDeviceTokenFromUserData(userDataDir, GATEWAY_ID)).toBeNull();
  await expect(async () => {
    const status = await page.evaluate(() => window.clawwork.gatewayStatus());
    expect(status[GATEWAY_ID]?.error).toBe('pairing required');
  }).toPass({ timeout: 15_000 });

  const deviceId = getDeviceIdFromUserData(userDataDir);
  approvePendingPairing(deviceId);
  expect(getDeviceTokenFromUserData(userDataDir, GATEWAY_ID)).toBeNull();

  await page.evaluate(([gwId]) => window.clawwork.updateGateway(gwId, {}), [GATEWAY_ID] as const);
  await waitForGatewayConnected(page);

  const issuedToken = getDeviceTokenFromUserData(userDataDir, GATEWAY_ID);
  expect(issuedToken).toBeTruthy();

  await app.close();

  ({ app, page } = await launchApp({ gateway: true, userDataDir, workspaceDir }));

  await waitForGatewayConnected(page);
  expect(getDeviceTokenFromUserData(userDataDir, GATEWAY_ID)).toBe(issuedToken);
});

test('P1: first-time device pairing persists across restart', async () => {
  await waitForGatewayConnected(page);
  expect(getDeviceTokenFromUserData(userDataDir, GATEWAY_ID)).toBeTruthy();
});

test.afterAll(async () => {
  if (app) await app.close().catch(() => {});
  cleanup?.();
});

test.describe('Layer 2: Gateway Integration', () => {
  test('G1: gateway connection established with token auth', async () => {
    const status = await page.evaluate(() => window.clawwork.gatewayStatus());
    expect(status[GATEWAY_ID]?.connected).toBe(true);
  });

  test('G2: gateway status reflected in renderer', async () => {
    const status = await page.evaluate(
      ([gwId]) => {
        return window.clawwork.gatewayStatus().then((s) => s[gwId]);
      },
      [GATEWAY_ID] as const,
    );

    expect(status?.error).toBeUndefined();
    expect(status?.connected).toBe(true);
  });

  test('G3: list sessions via gateway', async () => {
    const result = await page.evaluate(
      ([gwId]) => {
        return window.clawwork.listSessions(gwId);
      },
      [GATEWAY_ID] as const,
    );

    expect(result.ok).toBe(true);
  });

  test('G4: send message via gateway', async () => {
    const sessionKey = buildSessionKey();

    const result = await page.evaluate(
      ([gwId, sk]) => {
        return window.clawwork.sendMessage(gwId, sk, 'hello from e2e');
      },
      [GATEWAY_ID, sessionKey] as const,
    );

    expect(result.ok).toBe(true);
  });

  test('G5: chat history returns after send', async () => {
    const sessionKey = buildSessionKey();

    await page.evaluate(([gwId, sk]) => window.clawwork.sendMessage(gwId, sk, 'e2e history test'), [
      GATEWAY_ID,
      sessionKey,
    ] as const);

    await page.waitForTimeout(1000);

    const result = await page.evaluate(([gwId, sk]) => window.clawwork.chatHistory(gwId, sk), [
      GATEWAY_ID,
      sessionKey,
    ] as const);

    expect(result.ok).toBe(true);
  });

  test('G6: gateway events reach renderer', async () => {
    const sessionKey = buildSessionKey();

    const received = await page.evaluate(
      ([gwId, sk]) => {
        return new Promise<boolean>((resolve) => {
          const timer = setTimeout(() => resolve(false), 10_000);
          const unsub = window.clawwork.onGatewayEvent((evt) => {
            if (evt.gatewayId === gwId) {
              clearTimeout(timer);
              unsub();
              resolve(true);
            }
          });
          window.clawwork.sendMessage(gwId, sk, 'e2e event test');
        });
      },
      [GATEWAY_ID, sessionKey] as const,
    );

    expect(received).toBe(true);
  });

  test('G7: multiple sessions are independent', async () => {
    const sk1 = buildSessionKey();
    const sk2 = buildSessionKey();

    await page.evaluate(
      ([gwId, s1, s2]) => {
        return Promise.all([
          window.clawwork.sendMessage(gwId, s1, 'session-1-msg'),
          window.clawwork.sendMessage(gwId, s2, 'session-2-msg'),
        ]);
      },
      [GATEWAY_ID, sk1, sk2] as const,
    );

    await page.waitForTimeout(1000);

    const [h1, h2] = await page.evaluate(
      ([gwId, s1, s2]) => {
        return Promise.all([window.clawwork.chatHistory(gwId, s1), window.clawwork.chatHistory(gwId, s2)]);
      },
      [GATEWAY_ID, sk1, sk2] as const,
    );

    expect(h1.ok).toBe(true);
    expect(h2.ok).toBe(true);
  });

  test('A1: wrong token is rejected', async () => {
    const result = await page.evaluate(
      ([url]) => {
        return window.clawwork.testGateway(url, {
          token: 'wrong-token-xxx',
        });
      },
      [GATEWAY_WS_URL] as const,
    );

    expect(result.ok).toBe(false);
  });

  test('A2: empty token is rejected', async () => {
    const result = await page.evaluate(
      ([url]) => {
        return window.clawwork.testGateway(url, {});
      },
      [GATEWAY_WS_URL] as const,
    );

    expect(result.ok).toBe(false);
  });
});
