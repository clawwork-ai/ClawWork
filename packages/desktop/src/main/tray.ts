import { Tray, Menu, nativeImage, app } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { getDebugLogger } from './debug/index.js';
import { readConfig, updateConfig } from './workspace/config.js';
import { getMainWindow } from './window-manager.js';

export type TrayStatus = 'idle' | 'running' | 'unread' | 'disconnected';

export interface TrayTaskInfo {
  taskId: string;
  title: string;
  snippet: string;
  duration: string;
}

interface TrayState {
  status: TrayStatus;
  tasks: TrayTaskInfo[];
}

let tray: Tray | null = null;
let animationTimer: ReturnType<typeof setInterval> | null = null;
let animationFrame = 0;

const SPINNER_FRAMES = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];

function getIconPath(): string {
  if (is.dev) {
    return join(__dirname, '../../build/icon.png');
  }
  return join(process.resourcesPath, 'icon.png');
}

function loadIcon(): Electron.NativeImage {
  try {
    const img = nativeImage.createFromPath(getIconPath());
    if (!img.isEmpty()) {
      const resized = img.resize({ width: 16, height: 16 });
      resized.setTemplateImage(true);
      return resized;
    }
  } catch {}
  return nativeImage.createEmpty();
}

function stopAnimation(): void {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
  animationFrame = 0;
}

function startAnimation(): void {
  stopAnimation();
  animationTimer = setInterval(() => {
    if (!tray) return;
    animationFrame = (animationFrame + 1) % SPINNER_FRAMES.length;
    tray.setTitle(SPINNER_FRAMES[animationFrame]);
  }, 120);
}

function focusMainWindow(): void {
  const win = getMainWindow();
  if (!win) return;
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();
  win.focus();
}

function navigateToTask(taskId: string): void {
  focusMainWindow();
  const win = getMainWindow();
  if (win) win.webContents.send('tray:navigate-task', taskId);
}

function openSettings(): void {
  focusMainWindow();
  const win = getMainWindow();
  if (win) win.webContents.send('tray:open-settings');
}

function buildMenu(state: TrayState): Menu {
  const items: Electron.MenuItemConstructorOptions[] = [];

  if (state.tasks.length === 0) {
    items.push({ label: 'No active tasks', enabled: false });
  } else {
    for (const task of state.tasks) {
      const label = (task.title || 'Untitled').slice(0, 40);
      items.push({
        label,
        sublabel: (task.snippet || task.duration).slice(0, 60),
        click: () => navigateToTask(task.taskId),
      });
    }
  }

  items.push({ type: 'separator' });
  items.push({ label: 'Open ClawWork', click: focusMainWindow });
  items.push({ label: 'Settings', click: openSettings });
  items.push({ type: 'separator' });
  items.push({ label: 'Quit', click: () => app.quit() });

  return Menu.buildFromTemplate(items);
}

function createTray(): void {
  if (tray) return;
  const icon = loadIcon();
  tray = new Tray(icon);
  tray.setToolTip('ClawWork');
  tray.setContextMenu(buildMenu({ status: 'idle', tasks: [] }));
  getDebugLogger().info({ domain: 'tray', event: 'tray.init' });
}

export function initTray(): void {
  const config = readConfig();
  if (config?.trayEnabled !== false) {
    createTray();
  }
}

export function isTrayEnabled(): boolean {
  return tray !== null;
}

export function setTrayEnabled(enabled: boolean): void {
  updateConfig({ trayEnabled: enabled });
  if (enabled) {
    createTray();
  } else {
    destroyTray();
  }
}

export function updateTrayStatus(state: TrayState): void {
  if (!tray) return;

  stopAnimation();

  switch (state.status) {
    case 'running':
      tray.setToolTip(`ClawWork — ${state.tasks.length} task(s) running`);
      startAnimation();
      break;
    case 'unread':
      tray.setTitle('●');
      tray.setToolTip('ClawWork — new results');
      break;
    case 'disconnected':
      tray.setTitle('⚠');
      tray.setToolTip('ClawWork — disconnected');
      break;
    default:
      tray.setTitle('');
      tray.setToolTip('ClawWork');
  }

  tray.setContextMenu(buildMenu(state));
}

export function destroyTray(): void {
  stopAnimation();
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
