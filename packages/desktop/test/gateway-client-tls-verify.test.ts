import { beforeEach, describe, expect, it, vi } from 'vitest';

const websocketConstructor = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    readyState: 0,
    close: vi.fn(),
  })),
);

vi.mock('ws', () => ({
  default: websocketConstructor,
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

describe('GatewayClient TLS verification option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables websocket certificate verification for https gateway aliases when requested', async () => {
    const { GatewayClient } = await import('../src/main/ws/gateway-client.js');

    const client = new GatewayClient({
      id: 'gw-1',
      name: 'Gateway',
      url: 'https://gateway.example.com',
      auth: { token: 'token' },
      tlsVerify: false,
    });

    client.connect();

    expect(websocketConstructor).toHaveBeenCalledWith(
      'https://gateway.example.com',
      expect.objectContaining({ handshakeTimeout: 10000, rejectUnauthorized: false }),
    );
  });

  it('keeps https gateway aliases as https media origins', async () => {
    const { GatewayClient } = await import('../src/main/ws/gateway-client.js');

    const client = new GatewayClient({
      id: 'gw-1',
      name: 'Gateway',
      url: 'https://gateway.example.com',
      auth: { token: 'token' },
      tlsVerify: false,
    });

    expect(client.httpBase).toBe('https://gateway.example.com');
  });

  it('keeps default websocket certificate verification enabled', async () => {
    const { GatewayClient } = await import('../src/main/ws/gateway-client.js');

    const client = new GatewayClient({
      id: 'gw-1',
      name: 'Gateway',
      url: 'wss://gateway.example.com',
      auth: { token: 'token' },
    });

    client.connect();

    expect(websocketConstructor).toHaveBeenCalledWith(
      'wss://gateway.example.com',
      expect.not.objectContaining({ rejectUnauthorized: false }),
    );
  });

  it('does not apply TLS verification options to plaintext ws gateways', async () => {
    const { GatewayClient } = await import('../src/main/ws/gateway-client.js');

    const client = new GatewayClient({
      id: 'gw-1',
      name: 'Gateway',
      url: 'ws://127.0.0.1:18789',
      auth: { token: 'token' },
      tlsVerify: false,
    });

    client.connect();

    expect(websocketConstructor).toHaveBeenCalledWith(
      'ws://127.0.0.1:18789',
      expect.not.objectContaining({ rejectUnauthorized: false }),
    );
  });

  it('handles uppercase wss schemes when disabling certificate verification', async () => {
    const { GatewayClient } = await import('../src/main/ws/gateway-client.js');

    const client = new GatewayClient({
      id: 'gw-1',
      name: 'Gateway',
      url: 'WSS://gateway.example.com',
      auth: { token: 'token' },
      tlsVerify: false,
    });

    client.connect();

    expect(websocketConstructor).toHaveBeenCalledWith(
      'WSS://gateway.example.com',
      expect.objectContaining({ handshakeTimeout: 10000, rejectUnauthorized: false }),
    );
  });
});
