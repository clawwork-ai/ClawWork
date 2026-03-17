import { app, shell, BrowserWindow, Menu, ipcMain, globalShortcut, dialog } from 'electron';
import { join } from 'path';
import { writeFileSync } from 'fs';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { nativeTheme } from 'electron';
import { initAllGateways, destroyAllGateways, rebindAllWindows } from './ws/index.js';
import { initDebugLogger, getDebugLogger } from './debug/index.js';
import { registerWsHandlers } from './ipc/ws-handlers.js';
import { registerArtifactHandlers } from './ipc/artifact-handlers.js';
import { registerWorkspaceHandlers } from './ipc/workspace-handlers.js';
import { registerSettingsHandlers } from './ipc/settings-handlers.js';
import { registerSearchHandlers } from './ipc/search-handlers.js';
import { registerDataHandlers } from './ipc/data-handlers.js';
import { registerUpdateHandlers } from './ipc/update-handlers.js';
import { registerDebugHandlers } from './ipc/debug-handlers.js';
import { configureVoicePermissionHandlers, registerVoiceHandlers } from './ipc/voice-handlers.js';
import { registerTrayHandlers } from './ipc/tray-handlers.js';
import { registerQuickLaunchHandlers } from './ipc/quick-launch-handlers.js';
import { registerContextHandlers } from './ipc/context-handlers.js';
import { initTray, destroyTray, updateTrayWindow } from './tray.js';
import { initQuickLaunch, destroyQuickLaunch, updateQuickLaunchMainWindow } from './quick-launch.js';
import { getWorkspacePath, readConfig } from './workspace/config.js';
import { initDatabase, closeDatabase } from './db/index.js';

let isQuitting = false;

// Prevent EPIPE crashes when stdout/stderr pipe is broken (common in dev mode)
process.stdout?.on?.('error', () => {});
process.stderr?.on?.('error', () => {});

const SCREENSHOT_PATH = '/tmp/clawwork-screenshot.png';

async function captureScreenshot(win: BrowserWindow): Promise<string> {
  const image = await win.webContents.capturePage();
  writeFileSync(SCREENSHOT_PATH, image.toPNG());
  getDebugLogger().info({
    domain: 'app',
    event: 'app.screenshot.saved',
    data: { path: SCREENSHOT_PATH },
  });
  return SCREENSHOT_PATH;
}

function setupDevScreenshot(win: BrowserWindow): void {
  if (!is.dev) return;

  // Capture initial screenshot after page loads
  win.webContents.on('did-finish-load', () => {
    setTimeout(() => captureScreenshot(win), 1500);
  });

  // Global shortcut: Cmd+Shift+S to capture
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    captureScreenshot(win);
  });

  // IPC handler so renderer or scripts can trigger it
  ipcMain.handle('dev:screenshot', () => captureScreenshot(win));
}

function createWindow(): BrowserWindow {
  getDebugLogger().info({ domain: 'app', event: 'app.window.create' });
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null);
  }
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: (() => {
      const t = readConfig()?.theme;
      const dark = t === 'light' ? false : t === 'dark' ? true : nativeTheme.shouldUseDarkColors;
      return dark ? '#1C1C1C' : '#FAFAFA';
    })(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

app.whenReady().then(() => {
  initDebugLogger(app.getPath('logs'));
  getDebugLogger().info({ domain: 'app', event: 'app.start', data: { userData: app.getPath('userData') } });
  electronApp.setAppUserModelId('com.clawwork.app');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  registerWsHandlers();
  registerArtifactHandlers();
  registerWorkspaceHandlers();
  registerSettingsHandlers();
  registerSearchHandlers();
  registerDataHandlers();
  registerUpdateHandlers();
  registerDebugHandlers();
  registerVoiceHandlers();
  configureVoicePermissionHandlers();
  registerTrayHandlers();
  registerQuickLaunchHandlers();
  registerContextHandlers();

  const wsPath = getWorkspacePath();
  if (wsPath) {
    getDebugLogger().info({ domain: 'workspace', event: 'workspace.detected', data: { workspacePath: wsPath } });
    try {
      getDebugLogger().info({ domain: 'db', event: 'db.init.start', data: { workspacePath: wsPath } });
      initDatabase(wsPath);
      getDebugLogger().info({ domain: 'db', event: 'db.init.ok', data: { workspacePath: wsPath } });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      getDebugLogger().error({
        domain: 'db',
        event: 'db.init.failed',
        data: { workspacePath: wsPath },
        error: { name: err.name, message: err.message, stack: err.stack },
      });
      dialog.showErrorBox('Database Error', err.message);
      app.quit();
      return;
    }
  }

  const mainWindow = createWindow();
  initAllGateways(mainWindow);
  setupDevScreenshot(mainWindow);
  initTray(mainWindow);
  initQuickLaunch(mainWindow);

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  app.on('activate', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    } else if (BrowserWindow.getAllWindows().length === 0) {
      const win = createWindow();
      rebindAllWindows(win);
      updateTrayWindow(win);
      updateQuickLaunchMainWindow(win);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  getDebugLogger().info({ domain: 'app', event: 'app.before-quit' });
  globalShortcut.unregisterAll();
  destroyAllGateways();
  destroyTray();
  destroyQuickLaunch();
  closeDatabase();
});
