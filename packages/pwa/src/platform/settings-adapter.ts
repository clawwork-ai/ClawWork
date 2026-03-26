import type { SettingsPort, AppSettings } from '@clawwork/core';
import { reportDebugEvent } from '../lib/debug.js';

const STORAGE_KEY = 'clawwork:settings';

const DEFAULTS: AppSettings = {
  workspacePath: '/pwa',
  theme: 'dark',
  density: 'comfortable',
  language: 'en',
  sendShortcut: 'enter',
  leftNavShortcut: 'Comma',
  rightPanelShortcut: 'Period',
  devMode: false,
};

function readFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch (err) {
    reportDebugEvent({
      level: 'warn',
      domain: 'renderer',
      event: 'settings.storage.read.failed',
      error: { message: err instanceof Error ? err.message : 'settings read failed' },
    });
  }
  return { ...DEFAULTS };
}

function writeToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    reportDebugEvent({
      level: 'warn',
      domain: 'renderer',
      event: 'settings.storage.write.failed',
      error: { message: err instanceof Error ? err.message : 'settings write failed' },
    });
  }
}

export function createBrowserSettings(): SettingsPort {
  return {
    async getSettings() {
      return readFromStorage();
    },

    async updateSettings(partial) {
      const current = readFromStorage();
      const merged: AppSettings = { ...current, ...partial };
      writeToStorage(merged);
      return { ok: true, config: merged };
    },
  };
}
