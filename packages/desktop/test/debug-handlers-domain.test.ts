import { describe, it, expect, vi, beforeEach } from 'vitest';

const onMap = new Map<string, (...args: unknown[]) => void>();
const handleMap = new Map<string, (...args: unknown[]) => unknown>();

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/tmp') },
  ipcMain: {
    on: vi.fn((channel: string, handler: (...args: unknown[]) => void) => {
      onMap.set(channel, handler);
    }),
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handleMap.set(channel, handler);
    }),
  },
}));

const infoMock = vi.fn();
vi.mock('../src/main/debug/index.js', () => ({
  getDebugLogger: vi.fn(() => ({ info: infoMock })),
}));

vi.mock('../src/main/ws/index.js', () => ({
  getAllGatewayClients: vi.fn(() => new Map()),
}));

vi.mock('../src/main/workspace/config.js', () => ({
  readConfig: vi.fn(() => null),
}));

vi.mock('../src/main/debug/export.js', () => ({
  exportDebugBundle: vi.fn(() => ({ bundlePath: '/tmp/b.zip', events: [] })),
}));

import { registerDebugHandlers } from '../src/main/ipc/debug-handlers.js';

beforeEach(() => {
  onMap.clear();
  handleMap.clear();
  infoMock.mockClear();
  registerDebugHandlers();
});

describe('debug:renderer-event domain enforcement', () => {
  it('always logs domain as renderer regardless of payload', () => {
    const handler = onMap.get('debug:renderer-event');
    expect(handler).toBeDefined();

    handler!({}, { event: 'test.click', data: { x: 1 } });

    expect(infoMock).toHaveBeenCalledWith(expect.objectContaining({ domain: 'renderer', event: 'test.click' }));
  });

  it('ignores payload.domain even when set to a different value', () => {
    const handler = onMap.get('debug:renderer-event')!;

    handler!({}, { domain: 'db', event: 'spoofed.event' });

    expect(infoMock).toHaveBeenCalledWith(expect.objectContaining({ domain: 'renderer' }));
    expect(infoMock).not.toHaveBeenCalledWith(expect.objectContaining({ domain: 'db' }));
  });
});
