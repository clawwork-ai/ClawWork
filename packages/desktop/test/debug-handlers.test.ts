import { beforeEach, describe, expect, it, vi } from 'vitest';

const onMap = new Map<string, (...args: unknown[]) => unknown>();
const handleMap = new Map<string, (...args: unknown[]) => unknown>();
const infoMock = vi.fn();
const warnMock = vi.fn();
const rateLimiterCheckMock = vi.fn();

vi.mock('electron', () => ({
  app: { getPath: () => '/mock-userData' },
  ipcMain: {
    on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      onMap.set(channel, handler);
    }),
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handleMap.set(channel, handler);
    }),
  },
}));

vi.mock('../src/main/debug/export.js', () => ({
  exportDebugBundle: vi.fn(() => ({ bundlePath: '/tmp/debug-bundle', events: [] })),
}));

vi.mock('../src/main/debug/index.js', () => ({
  getDebugLogger: () => ({
    info: infoMock,
    warn: warnMock,
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
    getRecentEvents: vi.fn(() => []),
    currentFilePath: vi.fn(() => ''),
  }),
}));

vi.mock('../src/main/ipc/debug-rate-limiter.js', () => ({
  createRateLimiter: () => ({
    check: (...args: unknown[]) => rateLimiterCheckMock(...args),
    reset: vi.fn(),
    size: vi.fn(() => 0),
  }),
}));

vi.mock('../src/main/ws/index.js', () => ({
  getAllGatewayClients: vi.fn(() => new Map()),
}));

vi.mock('../src/main/workspace/config.js', () => ({
  readConfig: vi.fn(() => null),
}));

describe('registerDebugHandlers', () => {
  beforeEach(async () => {
    onMap.clear();
    handleMap.clear();
    vi.resetModules();
    vi.clearAllMocks();
    rateLimiterCheckMock.mockReset();
    rateLimiterCheckMock.mockReturnValue({ allowed: true });

    const mod = await import('../src/main/ipc/debug-handlers.js');
    mod.registerDebugHandlers();
  });

  it('ignores missing payloads without crashing the main process', () => {
    const handler = onMap.get('debug:renderer-event');
    expect(handler).toBeTypeOf('function');

    expect(() => handler?.({}, undefined)).not.toThrow();
    expect(infoMock).not.toHaveBeenCalled();
    expect(warnMock).not.toHaveBeenCalled();
  });

  it('ignores circular payloads without crashing the main process', () => {
    const handler = onMap.get('debug:renderer-event');
    expect(handler).toBeTypeOf('function');

    const payload: Record<string, unknown> = { event: 'renderer.loop' };
    payload.self = payload;

    expect(() => handler?.({}, payload)).not.toThrow();
    expect(infoMock).not.toHaveBeenCalled();
    expect(warnMock).not.toHaveBeenCalled();
  });

  it('drops throttled payloads before attempting serialization', () => {
    const handler = onMap.get('debug:renderer-event');
    expect(handler).toBeTypeOf('function');

    rateLimiterCheckMock.mockReturnValueOnce({ allowed: false });

    const payload = {
      event: 'renderer.loop',
      toJSON() {
        throw new Error('should not stringify throttled payload');
      },
    };

    expect(() => handler?.({}, payload)).not.toThrow();
    expect(infoMock).not.toHaveBeenCalled();
    expect(warnMock).not.toHaveBeenCalled();
  });

  it('falls back to an unknown event name for malformed payloads', () => {
    const handler = onMap.get('debug:renderer-event');
    expect(handler).toBeTypeOf('function');

    handler?.({}, { event: 42, traceId: 'trace-1', feature: 'debug', data: { ok: true } });

    expect(infoMock).toHaveBeenCalledWith({
      domain: 'renderer',
      event: 'unknown',
      traceId: 'trace-1',
      feature: 'debug',
      data: { ok: true },
    });
  });
});
