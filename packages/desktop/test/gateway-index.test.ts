import { beforeEach, describe, expect, it, vi } from 'vitest';

const clearPairingCodeMock = vi.fn();
const connectMock = vi.fn();
const setMainWindowMock = vi.fn();
const destroyMock = vi.fn();

vi.mock('../src/main/workspace/config.js', () => ({
  readConfig: vi.fn(() => null),
  buildGatewayAuth: vi.fn((gateway) => gateway.auth ?? {}),
  clearGatewayPairingCode: clearPairingCodeMock,
}));

vi.mock('../src/main/ws/gateway-client.js', () => ({
  GatewayClient: vi.fn().mockImplementation((_config, opts) => ({
    setMainWindow: setMainWindowMock,
    connect: connectMock,
    destroy: destroyMock,
    reconnect: vi.fn(),
    options: opts,
  })),
}));

describe('gateway index', () => {
  beforeEach(() => {
    vi.resetModules();
    clearPairingCodeMock.mockReset();
    connectMock.mockReset();
    setMainWindowMock.mockReset();
    destroyMock.mockReset();
  });

  it('clears pairing code through workspace config callback', async () => {
    const { addGateway } = await import('../src/main/ws/index.js');

    addGateway(
      {
        id: 'gw-1',
        name: 'Gateway',
        url: 'wss://gateway.example.com/ws',
        auth: { token: 'shared-token' },
      },
      {} as never,
    );

    const { GatewayClient } = await import('../src/main/ws/gateway-client.js');
    const instance = vi.mocked(GatewayClient).mock.calls[0]?.[1];

    expect(instance?.onPairingSuccess).toBeTypeOf('function');
    instance?.onPairingSuccess?.('gw-1');
    expect(clearPairingCodeMock).toHaveBeenCalledWith('gw-1');
  });
});
