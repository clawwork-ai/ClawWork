import type { IpcResult } from '@clawwork/shared';

export interface NotificationsPort {
  sendNotification: (params: { title: string; body: string; taskId?: string }) => Promise<IpcResult>;
}
