import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY_MS } from '@clawwork/shared';

const websocketMock = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;
  type Socket = {
    readyState: number;
    on: ReturnType<typeof vi.fn>;
    removeAllListeners: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    emit: (event: string, ...args: unknown[]) => void;
  };

  const instances: Socket[] = [];
  const constructor = vi.fn().mockImplementation(() => {
    const handlers = new Map<string, Handler>();
    const socket: Socket = {
      readyState: 0,
      on: vi.fn((event: string, handler: Handler) => {
        handlers.set(event, handler);
        return socket;
      }),
      removeAllListeners: vi.fn(() => handlers.clear()),
      close: vi.fn(),
      send: vi.fn(),
      emit: (event: string, ...args: unknown[]) => handlers.get(event)?.(...args),
    };
    instances.push(socket);
    return socket;
  });
  Object.assign(constructor, { OPEN: 1, CONNECTING: 0 });

  return { constructor, instances };
});

vi.mock('ws', () => ({
  default: websocketMock.constructor,
}));

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '0.0.0-test'),
  },
}));

vi.mock('../src/main/ws/window-utils.js', () => ({
  sendToWindow: vi.fn(),
}));

vi.mock('../src/main/window-manager.js', () => ({
  getMainWindow: vi.fn(() => null),
}));

vi.mock('../src/main/ws/device-identity.js', () => ({
  loadOrCreateDeviceIdentity: vi.fn(() => ({ deviceId: 'device', publicKeyPem: 'public', privateKeyPem: 'private' })),
  buildDeviceConnectPayload: vi.fn(() => ({})),
  saveDeviceToken: vi.fn(),
  loadDeviceToken: vi.fn(() => null),
}));

vi.mock('../src/main/debug/index.js', () => ({
  getDebugLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock('../src/main/ws/tls-trust.js', () => ({
  ensureGatewayWindowsSystemTrust: vi.fn(),
}));

describe('GatewayClient connection lifecycle', () => {
  const clients: Array<{ destroy: () => void }> = [];

  function pendingRequestCount(client: object): number {
    return (client as unknown as { pendingRequests: Map<string, unknown> }).pendingRequests.size;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    websocketMock.constructor.mockClear();
    websocketMock.instances.length = 0;
  });

  afterEach(() => {
    for (const client of clients) client.destroy();
    clients.length = 0;
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('calculates capped exponential reconnect delays', async () => {
    const { calculateReconnectDelay } = await import('../src/main/ws/gateway-client.js');

    expect(calculateReconnectDelay(1)).toBe(RECONNECT_DELAY_MS);
    expect(calculateReconnectDelay(2)).toBe(RECONNECT_DELAY_MS * 2);
    expect(calculateReconnectDelay(3)).toBe(RECONNECT_DELAY_MS * 4);
    expect(calculateReconnectDelay(6)).toBe(RECONNECT_DELAY_MS * 32);
    expect(calculateReconnectDelay(7)).toBe(RECONNECT_DELAY_MS * 32);
    expect(calculateReconnectDelay(MAX_RECONNECT_ATTEMPTS)).toBe(RECONNECT_DELAY_MS * 32);
  });

  it('rejects requests that exceed the 15-second timeout', async () => {
    const { GatewayClient } = await import('../src/main/ws/gateway-client.js');
    const client = new GatewayClient({
      id: 'gw-1',
      name: 'Gateway',
      url: 'ws://127.0.0.1:18789',
      auth: { token: 'token' },
    });
    clients.push(client);
    client.connect();

    const socket = websocketMock.instances[0];
    if (!socket) throw new Error('expected a websocket instance');
    socket.readyState = 1;

    let settled = false;
    const request = client.sendReq('slow.request', {});
    void request.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    vi.advanceTimersByTime(14_999);
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(pendingRequestCount(client)).toBe(1);

    vi.advanceTimersByTime(1);
    await expect(request).rejects.toMatchObject({
      message: 'request timeout: slow.request',
      code: 'TIMEOUT',
    });
    expect(pendingRequestCount(client)).toBe(0);
  });

  it('rejects pending requests immediately when the websocket closes', async () => {
    const { GatewayClient } = await import('../src/main/ws/gateway-client.js');
    const client = new GatewayClient({
      id: 'gw-1',
      name: 'Gateway',
      url: 'ws://127.0.0.1:18789',
      auth: { token: 'token' },
    });
    clients.push(client);
    client.connect();

    const socket = websocketMock.instances[0];
    if (!socket) throw new Error('expected a websocket instance');
    socket.readyState = 1;

    const first = client.sendReq('first', {});
    const second = client.sendReq('second', {});
    const settled = Promise.allSettled([first, second]);

    expect(pendingRequestCount(client)).toBe(2);

    socket.emit('close', 1006, Buffer.from('network failure'));
    const results = await settled;

    expect(results).toEqual([
      {
        status: 'rejected',
        reason: expect.objectContaining({ message: 'connection closed', code: 'GATEWAY_CONNECTION_CLOSED' }),
      },
      {
        status: 'rejected',
        reason: expect.objectContaining({ message: 'connection closed', code: 'GATEWAY_CONNECTION_CLOSED' }),
      },
    ]);
    expect(pendingRequestCount(client)).toBe(0);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(15_000);
    expect(pendingRequestCount(client)).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
