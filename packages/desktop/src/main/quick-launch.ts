import { BrowserWindow, globalShortcut, screen } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { readConfig, updateConfig } from './workspace/config.js';
import type { QuickLaunchConfig } from './workspace/config.js';
import { getDebugLogger } from './debug/index.js';
import { getMainWindow } from './window-manager.js';

let quickLaunchWindow: BrowserWindow | null = null;
let registeredShortcut: string | null = null;

const DEFAULT_SHORTCUT = 'Alt+Space';
const WINDOW_WIDTH = 680;
const WINDOW_HEIGHT = 72;

function getConfig(): QuickLaunchConfig {
  const config = readConfig();
  return config?.quickLaunch ?? { enabled: false, shortcut: DEFAULT_SHORTCUT };
}

function createQuickLaunchWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/quick-launch.html`);
  } else {
    win.loadFile(join(__dirname, '../renderer/quick-launch.html'));
  }

  win.on('blur', () => {
    hideQuickLaunch();
  });

  return win;
}

function ensureWindow(): BrowserWindow {
  if (!quickLaunchWindow || quickLaunchWindow.isDestroyed()) {
    quickLaunchWindow = createQuickLaunchWindow();
  }
  return quickLaunchWindow;
}

function showQuickLaunch(): void {
  const win = ensureWindow();

  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x: sx, y: sy } = display.workArea;
  const { width: sw, height: sh } = display.workAreaSize;

  win.setPosition(Math.round(sx + (sw - WINDOW_WIDTH) / 2), Math.round(sy + sh * 0.75));

  win.show();
  win.focus();
}

export function hideQuickLaunch(): void {
  if (quickLaunchWindow && !quickLaunchWindow.isDestroyed()) {
    quickLaunchWindow.hide();
  }
}

export function handleQuickLaunchSubmit(message: string): void {
  hideQuickLaunch();
  const win = getMainWindow();
  if (win) {
    win.webContents.send('quick-launch:submit', message);
    win.show();
    win.focus();
  }
}

function registerShortcutKey(shortcut: string): boolean {
  try {
    if (registeredShortcut) {
      globalShortcut.unregister(registeredShortcut);
      registeredShortcut = null;
    }

    const success = globalShortcut.register(shortcut, () => {
      if (quickLaunchWindow?.isVisible()) {
        hideQuickLaunch();
      } else {
        showQuickLaunch();
      }
    });

    if (success) {
      registeredShortcut = shortcut;
      getDebugLogger().info({
        domain: 'quick-launch',
        event: 'shortcut.registered',
        data: { shortcut },
      });
    } else {
      getDebugLogger().warn({
        domain: 'quick-launch',
        event: 'shortcut.register-failed',
        data: { shortcut },
      });
    }

    return success;
  } catch {
    return false;
  }
}

function unregisterShortcutKey(): void {
  if (registeredShortcut) {
    globalShortcut.unregister(registeredShortcut);
    registeredShortcut = null;
  }
}

export function initQuickLaunch(): void {
  const config = getConfig();
  if (config.enabled) {
    registerShortcutKey(config.shortcut);
  }
}

export function updateQuickLaunchConfig(enabled: boolean, shortcut?: string): boolean {
  const current = getConfig();
  const newShortcut = shortcut ?? current.shortcut;

  if (enabled) {
    const success = registerShortcutKey(newShortcut);
    if (success) {
      updateConfig({ quickLaunch: { enabled: true, shortcut: newShortcut } });
    }
    return success;
  }

  unregisterShortcutKey();
  updateConfig({ quickLaunch: { enabled: false, shortcut: newShortcut } });
  return true;
}

export function destroyQuickLaunch(): void {
  unregisterShortcutKey();
  if (quickLaunchWindow && !quickLaunchWindow.isDestroyed()) {
    quickLaunchWindow.destroy();
    quickLaunchWindow = null;
  }
}
