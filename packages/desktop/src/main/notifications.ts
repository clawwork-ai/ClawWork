import { Notification, BrowserWindow } from 'electron';

export function sendDesktopNotification(params: { title: string; body: string; taskId?: string }): void {
  if (!Notification.isSupported()) return;

  const n = new Notification({ title: params.title, body: params.body, silent: false });

  if (params.taskId) {
    n.on('click', () => {
      const win = BrowserWindow.getAllWindows()[0];
      if (!win || win.isDestroyed()) return;
      if (win.isMinimized()) win.restore();
      if (!win.isVisible()) win.show();
      win.focus();
      win.webContents.send('notification:navigate-task', params.taskId);
    });
  }

  n.show();
}
