import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never', outputFolder: '../playwright-report' }]],
  projects: [
    {
      name: 'smoke',
      testMatch: 'smoke/**/*.spec.ts',
    },
    {
      name: 'gateway',
      testMatch: 'gateway/**/*.spec.ts',
    },
    {
      name: 'pwa',
      testMatch: 'pwa/**/*.spec.ts',
    },
  ],
});
