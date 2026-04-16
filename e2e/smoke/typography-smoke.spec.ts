import { test } from '@playwright/test';
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

test('typography classes render in primary window', async () => {
  await page.waitForLoadState('domcontentloaded');

  for (const cls of ['type-label', 'type-body']) {
    await page.waitForSelector(`.${cls}`, { timeout: 10_000 });
  }
});
