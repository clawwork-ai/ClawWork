import { BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  mainWindow = null;
  return BrowserWindow.getAllWindows()[0] ?? null;
}

export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win;
}
