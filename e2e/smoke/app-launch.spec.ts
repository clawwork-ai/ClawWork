import { test, expect } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { launchApp } from '../helpers/electron-app';

let app: ElectronApplication;
let page: Page;
let cleanup: () => void;

test.beforeAll(async () => {
  ({ app, page, cleanup } = await launchApp());
});

test.afterAll(async () => {
  if (app) await app.close().catch(() => {});
  cleanup?.();
});

test.describe('Layer 1: Smoke Tests', () => {
  test('S1: app launches without crash', async () => {
    expect(app.process().exitCode).toBeNull();
  });

  test('S2: main window is created and visible', async () => {
    const windows = app.windows();
    expect(windows.length).toBeGreaterThanOrEqual(1);

    await expect(async () => {
      const visible = await app.evaluate(({ BrowserWindow }) => {
        const wins = BrowserWindow.getAllWindows();
        return wins.some((w) => w.isVisible());
      });
      expect(visible).toBe(true);
    }).toPass({ timeout: 10_000 });
  });

  test('S3: renderer loads without uncaught errors', async () => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const bodyLength = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLength).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test('S4: preload API is exposed', async () => {
    const apiType = await page.evaluate(() => typeof window.clawwork);
    expect(apiType).toBe('object');

    const methods = await page.evaluate(() => Object.keys(window.clawwork as object));
    expect(methods).toContain('sendMessage');
    expect(methods).toContain('gatewayStatus');
    expect(methods).toContain('listGateways');
    expect(methods).toContain('loadTasks');
    expect(methods).toContain('onGatewayEvent');
    expect(methods).toContain('onGatewayStatus');
  });

  test('S5: app process is healthy', async () => {
    expect(app.process().pid).toBeGreaterThan(0);
    expect(app.process().exitCode).toBeNull();
  });
});
