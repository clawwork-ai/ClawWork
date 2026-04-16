import { expect } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { launchApp } from './electron-app';
import { waitForGateway } from './gateway';
import { approvePendingPairing, getDeviceIdFromUserData, getDeviceTokenFromUserData } from './pairing';
import { GATEWAY_ID, CONNECTION_TIMEOUT_MS } from './constants';

export interface PairedApp {
  app: ElectronApplication;
  page: Page;
  cleanup: () => void;
  userDataDir: string;
  workspaceDir: string;
}

export async function waitForGatewayConnected(targetPage: Page): Promise<void> {
  await expect(async () => {
    const status = await targetPage.evaluate(() => window.clawwork.gatewayStatus());
    expect(status[GATEWAY_ID]?.connected).toBe(true);
  }).toPass({ timeout: CONNECTION_TIMEOUT_MS });
}

export async function setupPairedApp(): Promise<PairedApp> {
  await waitForGateway();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-e2e-userdata-'));
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-e2e-ws-'));
  const initial = await launchApp({ gateway: true, userDataDir, workspaceDir });
  const { cleanup } = initial;
  let { app, page } = initial;

  await expect(async () => {
    const status = await page.evaluate(() => window.clawwork.gatewayStatus());
    expect(status[GATEWAY_ID]?.error).toBe('pairing required');
  }).toPass({ timeout: 15_000 });

  const deviceId = getDeviceIdFromUserData(userDataDir);
  approvePendingPairing(deviceId);
  await page.evaluate(([gwId]) => window.clawwork.updateGateway(gwId, {}), [GATEWAY_ID] as const);
  await waitForGatewayConnected(page);

  expect(getDeviceTokenFromUserData(userDataDir, GATEWAY_ID)).toBeTruthy();

  await app.close();
  ({ app, page } = await launchApp({ gateway: true, userDataDir, workspaceDir }));
  await waitForGatewayConnected(page);

  return { app, page, cleanup, userDataDir, workspaceDir };
}
