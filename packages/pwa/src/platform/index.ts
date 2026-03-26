import type { PlatformPorts } from '@clawwork/core';
import { createBrowserPersistence } from './persistence-adapter.js';
import { createBrowserGatewayTransport } from './gateway-adapter.js';
import type { BrowserGatewayTransportResult } from './gateway-adapter.js';
import { createBrowserSettings } from './settings-adapter.js';
import { createBrowserNotifications } from './notifications-adapter.js';
import { getAllClients, getClient } from '../gateway/client.js';
import { getIdentity, getScopeId } from '../persistence/db.js';

let _ports: PlatformPorts | null = null;
let _gwResult: BrowserGatewayTransportResult | null = null;

async function resolveDeviceId(): Promise<string> {
  const scopeId = await getScopeId();
  if (scopeId) return scopeId;
  const identity = await getIdentity();
  if (!identity) throw new Error('Device identity not found');
  return identity.id;
}

function ensurePorts(): PlatformPorts {
  if (!_ports) {
    _gwResult = createBrowserGatewayTransport(getAllClients, getClient, resolveDeviceId);
    _ports = {
      persistence: createBrowserPersistence(),
      gateway: _gwResult.transport,
      settings: createBrowserSettings(),
      notifications: createBrowserNotifications(),
    };
  }
  return _ports;
}

export const ports = new Proxy({} as PlatformPorts, {
  get(_target, prop, receiver) {
    return Reflect.get(ensurePorts(), prop, receiver);
  },
});

export function getGatewayBroadcasters() {
  ensurePorts();
  return {
    broadcastEvent: _gwResult!.broadcastEvent,
    broadcastStatus: _gwResult!.broadcastStatus,
  };
}
