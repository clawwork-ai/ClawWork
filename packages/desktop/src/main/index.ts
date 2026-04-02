import { app, shell, BrowserWindow, Menu, ipcMain, globalShortcut, dialog, protocol } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { nativeTheme } from 'electron';
import { initAllGateways, destroyAllGateways } from './ws/index.js';
import { getMainWindow, setMainWindow } from './window-manager.js';
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
import { registerNotificationHandlers } from './ipc/notification-handlers.js';
import { registerAvatarHandlers, registerAvatarProtocol } from './ipc/avatar-handlers.js';
import { unwatchAll } from './context/file-watcher.js';
import { isInstallingUpdate } from './auto-updater.js';
import { initTray, destroyTray } from './tray.js';
import { initQuickLaunch, destroyQuickLaunch } from './quick-launch.js';
import { getWorkspacePath, readConfig, updateConfig } from './workspace/config.js';
import { initDatabase, closeDatabase } from './db/index.js';

protocol.registerSchemesAsPrivileged([
  { scheme: 'clawwork-avatar', privileges: { secure: true, supportFetchAPI: true } },
]);

let isQuitting = false;

process.stdout?.on?.('error', () => {});
process.stderr?.on?.('error', () => {});

function buildAppMenu(devMode = false): Menu {
  const isMac = process.platform === 'darwin';
  const viewSubmenu: Electron.MenuItemConstructorOptions[] = [
    { role: 'resetZoom' as const },
    { role: 'zoomIn' as const },
    { role: 'zoomOut' as const },
    { type: 'separator' as const },
    { role: 'togglefullscreen' as const },
  ];
  if (devMode || is.dev) {
    viewSubmenu.push({ type: 'separator' as const }, { role: 'reload' as const }, { role: 'toggleDevTools' as const });
  }
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const, accelerator: 'Command+H' },
              { role: 'hideOthers' as const, accelerator: 'Command+Alt+H' },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const, accelerator: 'Command+Q' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' as const, accelerator: 'Command+W' } : { role: 'quit' as const }],
    },
    { role: 'editMenu' as const },
    {
      label: 'View',
      submenu: viewSubmenu,
    },
    ...(isMac
      ? [
          {
            label: 'Window',
            submenu: [
              { role: 'minimize' as const, accelerator: 'Command+M' },
              { role: 'zoom' as const },
              { type: 'separator' as const },
              { role: 'front' as const },
            ],
          },
        ]
      : []),
  ];
  return Menu.buildFromTemplate(template);
}

function createWindow(): BrowserWindow {
  getDebugLogger().info({ domain: 'app', event: 'app.window.create' });
  const devMode = readConfig()?.devMode === true;
  Menu.setApplicationMenu(buildAppMenu(devMode));

  const win = new BrowserWindow({
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

  win.on('close', (e) => {
    if (!isQuitting && !isInstallingUpdate()) {
      e.preventDefault();
      win.hide();
    }
  });

  win.on('ready-to-show', () => {
    const savedZoom = readConfig()?.zoomLevel;
    if (savedZoom) {
      win.webContents.setZoomLevel(savedZoom);
    }
    win.show();
  });

  win.webContents.on('before-input-event', (_event, input) => {
    if (!(input.meta || input.control) || input.type !== 'keyDown') return;
    if (input.key === '-' || input.key === '_') {
      const level = win.webContents.getZoomLevel() - 0.5;
      win.webContents.setZoomLevel(level);
      updateConfig({ zoomLevel: level });
    }
  });

  win.on('blur', () => {
    if (win.isDestroyed()) return;
    const level = win.webContents.getZoomLevel();
    const saved = readConfig()?.zoomLevel ?? 0;
    if (level !== saved) {
      updateConfig({ zoomLevel: level });
    }
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  setMainWindow(win);
  return win;
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
  registerNotificationHandlers();
  registerAvatarHandlers();
  registerAvatarProtocol();

  ipcMain.handle('app:rebuild-menu', () => {
    const dm = readConfig()?.devMode === true;
    Menu.setApplicationMenu(buildAppMenu(dm));
  });

  ipcMain.on('ui:set-window-button-visibility', (_event, visible: boolean) => {
    if (process.platform === 'darwin') {
      const win = getMainWindow();
      if (win) win.setWindowButtonVisibility(visible);
    }
  });

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

  createWindow();
  initAllGateways();
  initTray();
  initQuickLaunch();

  app.on('activate', () => {
    const win = getMainWindow();
    if (win) {
      win.show();
      win.focus();
    } else {
      createWindow();
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
  getDebugLogger().info({ domain: 'app', event: 'app.before-quit', data: { installingUpdate: isInstallingUpdate() } });
  globalShortcut.unregisterAll();
  unwatchAll();
  destroyAllGateways();
  destroyTray();
  destroyQuickLaunch();
  closeDatabase();
});
