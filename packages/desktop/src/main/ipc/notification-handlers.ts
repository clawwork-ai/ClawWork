import { ipcMain } from 'electron';
import { sendDesktopNotification } from '../notifications.js';

export function registerNotificationHandlers(): void {
  ipcMain.handle('notification:send', (_event, params: { title: string; body: string; taskId?: string }) => {
    sendDesktopNotification(params);
    return { ok: true };
  });
}
