import { test, expect } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';
import { launchApp } from '../helpers/electron-app';

let app: ElectronApplication;
let page: Page;
let cleanup: () => void;

test.beforeAll(async () => {
  ({ app, page, cleanup } = await launchApp({
    quickLaunchEnabled: true,
    quickLaunchShortcut: 'CommandOrControl+Shift+L',
  }));
});

test.afterAll(async () => {
  if (app) await app.close().catch(() => {});
  cleanup?.();
});

test('typography contract is visible in primary and quick launch surfaces', async () => {
  await page.waitForLoadState('domcontentloaded');

  for (const cls of ['type-section-title', 'type-label', 'type-body']) {
    const hasClass = await page.evaluate((c) => Boolean(document.querySelector(`.${c}`)), cls);
    expect(hasClass).toBe(true);
  }

  const shortcut = process.platform === 'darwin' ? 'Meta+Shift+L' : 'Control+Shift+L';
  await page.keyboard.press(shortcut);

  await expect(async () => {
    const windows = app.windows();
    expect(windows.length).toBeGreaterThanOrEqual(2);
    const quickLaunchPage = windows.find((w) => w.url().includes('quick-launch'));
    expect(quickLaunchPage).toBeDefined();
    const hasQuickLaunchTypography = await quickLaunchPage!.evaluate(() => ({
      body: document.querySelector('#input')?.classList.contains('type-body') ?? false,
      mono: Array.from(document.querySelectorAll('kbd')).every((node) => node.classList.contains('type-mono-data')),
    }));
    expect(hasQuickLaunchTypography.body).toBe(true);
    expect(hasQuickLaunchTypography.mono).toBe(true);
  }).toPass({ timeout: 10_000 });
});
