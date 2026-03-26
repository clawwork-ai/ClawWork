import type { NotificationsPort } from '@clawwork/core';

async function ensurePermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function createBrowserNotifications(): NotificationsPort {
  return {
    async sendNotification({ title, body }) {
      const allowed = await ensurePermission();
      if (!allowed) return { ok: false, error: 'notifications not permitted' };
      try {
        new Notification(title, { body, icon: '/icons/icon-192.png' });
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'notification failed' };
      }
    },
  };
}
