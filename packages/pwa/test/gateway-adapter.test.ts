import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BrowserGatewayClient } from '../src/gateway/client';
import { createBrowserGatewayTransport } from '../src/platform/gateway-adapter';

vi.mock('../src/persistence/db', () => ({
  listGateways: vi.fn(),
}));

import { listGateways as listGatewayConfigs } from '../src/persistence/db';

const mockedListGatewayConfigs = vi.mocked(listGatewayConfigs);

function makeMockClient(
  overrides: Partial<{
    id: string;
    name: string;
    isConnected: boolean;
    lastError: string | undefined;
    serverVersion: string | undefined;
  }> = {},
) {
  return {
    id: overrides.id ?? 'gw-1',
    name: overrides.name ?? 'Test Gateway',
    isConnected: overrides.isConnected ?? true,
    lastError: overrides.lastError,
    serverVersion: overrides.serverVersion ?? '1.0.0',
    sendChatMessage: vi.fn().mockResolvedValue({ ok: true }),
    getChatHistory: vi.fn().mockResolvedValue({ messages: [] }),
    abortChat: vi.fn().mockResolvedValue(undefined),
    patchSession: vi.fn().mockResolvedValue({ ok: true }),
    listSessions: vi.fn().mockResolvedValue({ sessions: [] }),
    listModels: vi.fn().mockResolvedValue({ models: [] }),
    listAgents: vi.fn().mockResolvedValue({ agents: [] }),
    getToolsCatalog: vi.fn().mockResolvedValue({ tools: [] }),
    connect: vi.fn(),
    destroy: vi.fn(),
  } as unknown as BrowserGatewayClient & {
    sendChatMessage: ReturnType<typeof vi.fn>;
    getChatHistory: ReturnType<typeof vi.fn>;
    abortChat: ReturnType<typeof vi.fn>;
    patchSession: ReturnType<typeof vi.fn>;
    listModels: ReturnType<typeof vi.fn>;
    listAgents: ReturnType<typeof vi.fn>;
    getToolsCatalog: ReturnType<typeof vi.fn>;
  };
}

describe('createBrowserGatewayTransport', () => {
  let mockClient: ReturnType<typeof makeMockClient>;
  let getClients: () => BrowserGatewayClient[];
  let getClient: (id: string) => BrowserGatewayClient | undefined;
  let getDeviceId: () => Promise<string>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = makeMockClient();
    getClients = () => [mockClient as unknown as BrowserGatewayClient];
    getClient = (id: string) => (id === 'gw-1' ? (mockClient as unknown as BrowserGatewayClient) : undefined);
    getDeviceId = () => Promise.resolve('device-123');
  });

  describe('sendMessage', () => {
    it('delegates to client.sendChatMessage', async () => {
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.sendMessage('gw-1', 'session-key', 'hello');

      expect(result).toEqual({ ok: true });
      expect(mockClient.sendChatMessage).toHaveBeenCalledWith('session-key', 'hello', undefined);
    });

    it('passes attachments through', async () => {
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);
      const attachments = [{ mimeType: 'image/png', fileName: 'test.png', content: 'base64data' }];

      await transport.sendMessage('gw-1', 'session-key', 'hello', attachments);

      expect(mockClient.sendChatMessage).toHaveBeenCalledWith('session-key', 'hello', attachments);
    });

    it('returns error when gateway not found', async () => {
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.sendMessage('gw-unknown', 'session-key', 'hello');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('not connected');
    });

    it('returns error when client throws', async () => {
      mockClient.sendChatMessage.mockRejectedValue(new Error('send failed'));
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.sendMessage('gw-1', 'session-key', 'hello');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('send failed');
    });

    it('returns error when client is disconnected', async () => {
      mockClient = makeMockClient({ isConnected: false });
      getClient = (id: string) => (id === 'gw-1' ? (mockClient as unknown as BrowserGatewayClient) : undefined);
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.sendMessage('gw-1', 'session-key', 'hello');

      expect(result.ok).toBe(false);
      expect(result.errorCode).toBe('GATEWAY_NOT_CONNECTED');
    });
  });

  describe('chatHistory', () => {
    it('delegates to client.getChatHistory', async () => {
      const historyData = { messages: [{ role: 'user', content: 'hi' }] };
      mockClient.getChatHistory.mockResolvedValue(historyData);
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.chatHistory('gw-1', 'session-key', 50);

      expect(result).toEqual({ ok: true, result: historyData });
      expect(mockClient.getChatHistory).toHaveBeenCalledWith('session-key', 50);
    });

    it('returns error when gateway not connected', async () => {
      mockClient = makeMockClient({ isConnected: false });
      getClient = (id: string) => (id === 'gw-1' ? (mockClient as unknown as BrowserGatewayClient) : undefined);
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.chatHistory('gw-1', 'session-key');

      expect(result.ok).toBe(false);
    });
  });

  describe('abortChat', () => {
    it('delegates to client.abortChat', async () => {
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.abortChat('gw-1', 'session-key');

      expect(result).toEqual({ ok: true });
      expect(mockClient.abortChat).toHaveBeenCalledWith('session-key');
    });

    it('returns error when gateway not connected', async () => {
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.abortChat('gw-nonexistent', 'session-key');

      expect(result.ok).toBe(false);
    });
  });

  describe('patchSession', () => {
    it('delegates to client.patchSession with merged params', async () => {
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);
      const patch = { model: 'claude-opus-4-20250514' };

      const result = await transport.patchSession('gw-1', 'session-key', patch);

      expect(result).toEqual({ ok: true });
      expect(mockClient.patchSession).toHaveBeenCalledWith({
        sessionKey: 'session-key',
        model: 'claude-opus-4-20250514',
      });
    });
  });

  describe('onGatewayEvent', () => {
    it('adds listener that receives broadcast events', () => {
      const { transport, broadcastEvent } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);
      const received: unknown[] = [];
      transport.onGatewayEvent((data) => received.push(data));

      const event = { event: 'chat', payload: { text: 'hi' }, gatewayId: 'gw-1' };
      broadcastEvent(event);

      expect(received).toEqual([event]);
    });

    it('returns unsubscribe function that removes listener', () => {
      const { transport, broadcastEvent } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);
      const received: unknown[] = [];
      const unsub = transport.onGatewayEvent((data) => received.push(data));

      broadcastEvent({ event: 'chat', payload: {}, gatewayId: 'gw-1' });
      unsub();
      broadcastEvent({ event: 'chat', payload: {}, gatewayId: 'gw-1' });

      expect(received).toHaveLength(1);
    });

    it('handles listener errors without breaking broadcast', () => {
      const { transport, broadcastEvent } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);
      const received: unknown[] = [];
      transport.onGatewayEvent(() => {
        throw new Error('listener error');
      });
      transport.onGatewayEvent((data) => received.push(data));

      broadcastEvent({ event: 'chat', payload: {}, gatewayId: 'gw-1' });

      expect(received).toHaveLength(1);
    });
  });

  describe('onGatewayStatus', () => {
    it('adds listener that receives broadcast status events', () => {
      const { transport, broadcastStatus } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);
      const received: unknown[] = [];
      transport.onGatewayStatus((status) => received.push(status));

      const status = { gatewayId: 'gw-1', connected: true };
      broadcastStatus(status);

      expect(received).toEqual([status]);
    });

    it('returns unsubscribe function that removes listener', () => {
      const { transport, broadcastStatus } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);
      const received: unknown[] = [];
      const unsub = transport.onGatewayStatus((status) => received.push(status));

      broadcastStatus({ gatewayId: 'gw-1', connected: true });
      unsub();
      broadcastStatus({ gatewayId: 'gw-1', connected: false });

      expect(received).toHaveLength(1);
    });
  });

  describe('gatewayStatus', () => {
    it('returns status map for all clients', async () => {
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.gatewayStatus();

      expect(result).toEqual({
        'gw-1': {
          connected: true,
          name: 'Test Gateway',
          error: undefined,
          serverVersion: '1.0.0',
        },
      });
    });
  });

  describe('listGateways', () => {
    it('returns merged config and client connection status', async () => {
      mockedListGatewayConfigs.mockResolvedValue([
        {
          id: 'gw-1',
          name: 'Test Gateway',
          url: 'wss://localhost:18789',
          token: 'tok-1',
          password: 'pw-1',
          pairingCode: 'pair-1',
          authMode: 'password',
        },
      ]);
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.listGateways();

      expect(result).toEqual([
        {
          id: 'gw-1',
          name: 'Test Gateway',
          url: 'wss://localhost:18789',
          token: 'tok-1',
          password: 'pw-1',
          pairingCode: 'pair-1',
          authMode: 'password',
          isDefault: undefined,
          connected: true,
        },
      ]);
    });

    it('shows disconnected when no matching client', async () => {
      mockedListGatewayConfigs.mockResolvedValue([{ id: 'gw-orphan', name: 'Orphan', url: 'wss://orphan:18789' }]);
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.listGateways();

      expect(result[0].connected).toBe(false);
    });
  });

  describe('listModels', () => {
    it('delegates to client.listModels', async () => {
      const models = { models: [{ id: 'm1' }] };
      mockClient.listModels.mockResolvedValue(models);
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.listModels('gw-1');

      expect(result).toEqual({ ok: true, result: models });
    });

    it('returns error when gateway not connected', async () => {
      mockClient = makeMockClient({ isConnected: false });
      getClient = (id: string) => (id === 'gw-1' ? (mockClient as unknown as BrowserGatewayClient) : undefined);
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.listModels('gw-1');

      expect(result.ok).toBe(false);
    });
  });

  describe('syncSessions', () => {
    it('continues past a failed client and returns discovered from others', async () => {
      mockClient.listSessions.mockRejectedValue(new Error('sync failed'));
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.syncSessions();

      expect(result).toEqual({ ok: true, discovered: [] });
    });
  });

  describe('listAgents', () => {
    it('delegates to client.listAgents', async () => {
      const agents = { agents: [{ id: 'a1' }] };
      mockClient.listAgents.mockResolvedValue(agents);
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.listAgents('gw-1');

      expect(result).toEqual({ ok: true, result: agents });
    });
  });

  describe('getToolsCatalog', () => {
    it('delegates to client.getToolsCatalog with agentId', async () => {
      const catalog = { tools: [{ name: 'read_file' }] };
      mockClient.getToolsCatalog.mockResolvedValue(catalog);
      const { transport } = createBrowserGatewayTransport(getClients, getClient, getDeviceId);

      const result = await transport.getToolsCatalog('gw-1', 'agent-1');

      expect(result).toEqual({ ok: true, result: catalog });
      expect(mockClient.getToolsCatalog).toHaveBeenCalledWith('agent-1');
    });
  });
});
