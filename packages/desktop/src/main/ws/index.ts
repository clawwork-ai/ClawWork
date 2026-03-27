import type { GatewayClientConfig } from '@clawwork/shared';
import { GatewayClient } from './gateway-client.js';
import { readConfig, buildGatewayAuth, clearGatewayPairingCode } from '../workspace/config.js';

const gatewayClients = new Map<string, GatewayClient>();

function createGatewayClient(config: GatewayClientConfig, opts?: { noReconnect?: boolean }): GatewayClient {
  return new GatewayClient(config, {
    ...opts,
    onPairingSuccess: (gatewayId) => {
      clearGatewayPairingCode(gatewayId);
    },
  });
}

export function initAllGateways(): void {
  const config = readConfig();
  const gateways = config?.gateways ?? [];
  for (const gw of gateways) {
    const client = createGatewayClient({ id: gw.id, name: gw.name, url: gw.url, auth: buildGatewayAuth(gw) });
    client.connect();
    gatewayClients.set(gw.id, client);
  }
}

export function getGatewayClient(gatewayId: string): GatewayClient | null {
  return gatewayClients.get(gatewayId) ?? null;
}

export function getAllGatewayClients(): Map<string, GatewayClient> {
  return gatewayClients;
}

export function addGateway(config: GatewayClientConfig): GatewayClient {
  const client = createGatewayClient(config);
  client.connect();
  gatewayClients.set(config.id, client);
  return client;
}

export function removeGateway(gatewayId: string): void {
  const client = gatewayClients.get(gatewayId);
  if (client) {
    client.destroy();
    gatewayClients.delete(gatewayId);
  }
}

export function reconnectGateway(gatewayId: string): void {
  const client = gatewayClients.get(gatewayId);
  if (client) {
    client.reconnect();
  }
}

export function destroyAllGateways(): void {
  for (const client of gatewayClients.values()) {
    client.destroy();
  }
  gatewayClients.clear();
}
