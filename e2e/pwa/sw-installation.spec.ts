import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd().endsWith('/packages/pwa') ? resolve(process.cwd(), '..', '..') : process.cwd();
const manifestPath = resolve(rootDir, 'packages/pwa/dist/manifest.webmanifest');
const indexHtmlPath = resolve(rootDir, 'packages/pwa/dist/index.html');
const swPath = resolve(rootDir, 'packages/pwa/dist/sw.js');

test('pwa build output includes service worker and install assets', async () => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    icons?: Array<{ src: string; sizes: string; purpose?: string }>;
  };
  const html = readFileSync(indexHtmlPath, 'utf8');
  const sw = readFileSync(swPath, 'utf8');

  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: 'icons/icon-192.png', sizes: '192x192' }),
      expect.objectContaining({ src: 'icons/icon-512.png', sizes: '512x512' }),
      expect.objectContaining({ src: 'icons/icon-512.png', sizes: '512x512', purpose: 'maskable' }),
    ]),
  );
  expect(html).toContain('/icons/icon-192.png');
  expect(sw).toContain('precacheAndRoute');
  expect(sw).toContain('cleanupOutdatedCaches');
});
