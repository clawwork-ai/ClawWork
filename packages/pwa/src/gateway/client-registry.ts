import type { BrowserGatewayClient } from './client.js';

const clients = new Map<string, BrowserGatewayClient>();

export function registerClient(client: BrowserGatewayClient): void {
  clients.set(client.id, client);
}

export function getClient(id: string): BrowserGatewayClient | undefined {
  return clients.get(id);
}

export function getAllClients(): BrowserGatewayClient[] {
  return Array.from(clients.values());
}

export function reconnectAllClients(): void {
  for (const client of clients.values()) {
    if (!client.isConnected) {
      client.reconnect();
    }
  }
}

export function destroyAllClients(): void {
  for (const client of clients.values()) {
    client.destroy();
  }
  clients.clear();
}
