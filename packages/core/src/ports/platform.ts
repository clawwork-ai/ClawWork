import type { PersistencePort } from './persistence.js';
import type { GatewayTransportPort } from './gateway-transport.js';
import type { SettingsPort } from './settings.js';
import type { NotificationsPort } from './notifications.js';

export interface PlatformPorts {
  persistence: PersistencePort;
  gateway: GatewayTransportPort;
  settings: SettingsPort;
  notifications: NotificationsPort;
}

export type { PersistencePort, GatewayTransportPort, SettingsPort, NotificationsPort };
