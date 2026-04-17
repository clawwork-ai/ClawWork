import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const handleMap = new Map<string, (...args: unknown[]) => unknown>();
let connected = false;
const connectMock = vi.fn(() => {
  connected = true;
});
const destroyMock = vi.fn();

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handleMap.set(channel, handler);
    }),
  },
}));

vi.mock('../src/main/workspace/config.js', () => ({
  readConfig: vi.fn(() => null),
  updateConfig: vi.fn(),
  writeConfig: vi.fn(),
  buildGatewayAuth: vi.fn(),
}));

vi.mock('../src/main/ws/index.js', () => ({
  getGatewayClient: vi.fn(() => null),
  getAllGatewayClients: vi.fn(() => new Map()),
  addGateway: vi.fn(),
  removeGateway: vi.fn(),
}));

vi.mock('../src/main/ws/gateway-client.js', () => ({
  GatewayClient: vi.fn().mockImplementation(() => ({
    connect: connectMock,
    destroy: destroyMock,
    get isConnected() {
      return connected;
    },
  })),
}));

describe('registerSettingsHandlers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    handleMap.clear();
    connected = false;
    connectMock.mockReset();
    connectMock.mockImplementation(() => {
      connected = true;
    });
    destroyMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a connection attempt when testing a gateway', async () => {
    const { registerSettingsHandlers } = await import('../src/main/ipc/settings-handlers.js');

    registerSettingsHandlers();

    const handler = handleMap.get('settings:test-gateway');
    expect(handler).toBeTypeOf('function');

    const pending = handler?.({}, 'wss://gateway.example.com', { token: 'secret' }) as Promise<{ ok: boolean }>;

    await vi.advanceTimersByTimeAsync(300);

    expect(connectMock).toHaveBeenCalledTimes(1);
    await expect(pending).resolves.toEqual({ ok: true });
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  it('returns timeout when the connection never becomes ready', async () => {
    connectMock.mockImplementationOnce(() => {});

    const { registerSettingsHandlers } = await import('../src/main/ipc/settings-handlers.js');

    registerSettingsHandlers();

    const handler = handleMap.get('settings:test-gateway');
    expect(handler).toBeTypeOf('function');

    const pending = handler?.({}, 'wss://gateway.example.com', { token: 'secret' }) as Promise<{
      ok: boolean;
      error: string;
    }>;

    await vi.advanceTimersByTimeAsync(10_000);

    await expect(pending).resolves.toEqual({ ok: false, error: 'timeout' });
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  it('rejects pairing code test requests without opening a websocket', async () => {
    const { registerSettingsHandlers } = await import('../src/main/ipc/settings-handlers.js');

    registerSettingsHandlers();

    const handler = handleMap.get('settings:test-gateway');
    expect(handler).toBeTypeOf('function');

    await expect(
      handler?.({}, 'wss://gateway.example.com', { pairingCode: 'pairing-code' }) as Promise<{
        ok: boolean;
        error: string;
      }>,
    ).resolves.toEqual({ ok: false, error: 'pairing-code test is not supported' });
    expect(connectMock).not.toHaveBeenCalled();
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('settings:add-gateway returns error when no config exists', async () => {
    const { registerSettingsHandlers } = await import('../src/main/ipc/settings-handlers.js');
    const configModule = await import('../src/main/workspace/config.js');

    registerSettingsHandlers();

    const handler = handleMap.get('settings:add-gateway');
    expect(handler).toBeTypeOf('function');

    const result = (await handler?.(
      {},
      { id: 'gw1', name: 'gw', url: 'wss://gw.example.com', auth: { token: 'tok' } },
    )) as {
      ok: boolean;
      error: string;
    };
    expect(result).toEqual({ ok: false, error: 'no config' });
    expect(configModule.writeConfig).not.toHaveBeenCalled();
  });
});
