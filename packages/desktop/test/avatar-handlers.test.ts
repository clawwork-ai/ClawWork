import { beforeEach, describe, expect, it, vi } from 'vitest';

const handleMap = new Map<string, (...args: unknown[]) => unknown>();
let protocolHandler: ((request: { url: string }) => Promise<Response>) | null = null;

const mkdirMock = vi.fn();
const writeFileMock = vi.fn();
const readdirMock = vi.fn<() => Promise<string[]>>(() => Promise.resolve([]));
const unlinkMock = vi.fn();
const netFetchMock = vi.fn(() => new Response('ok'));
const debugInfoMock = vi.fn();

vi.mock('electron', () => ({
  app: { getPath: () => '/mock-userData' },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handleMap.set(channel, handler);
    }),
  },
  net: { fetch: (...args: unknown[]) => netFetchMock(...args) },
  protocol: {
    handle: vi.fn((_scheme: string, handler: (req: { url: string }) => Promise<Response>) => {
      protocolHandler = handler;
    }),
  },
}));

vi.mock('fs/promises', () => ({
  mkdir: (...args: unknown[]) => mkdirMock(...args),
  writeFile: (...args: unknown[]) => writeFileMock(...args),
  readdir: (...args: unknown[]) => readdirMock(...args),
  unlink: (...args: unknown[]) => unlinkMock(...args),
}));

vi.mock('../src/main/debug/index.js', () => ({
  getDebugLogger: () => ({ info: debugInfoMock, error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

const PNG_1x1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('avatar handlers', () => {
  beforeEach(async () => {
    handleMap.clear();
    protocolHandler = null;
    vi.clearAllMocks();
    readdirMock.mockResolvedValue([]);

    const mod = await import('../src/main/ipc/avatar-handlers.js');
    mod.registerAvatarHandlers();
    mod.registerAvatarProtocol();
  });

  describe('avatar:save', () => {
    it('saves a valid PNG data URL to disk', async () => {
      const handler = handleMap.get('avatar:save')!;
      const result = await handler({}, { gatewayId: 'gw1', agentId: 'agent1', dataUrl: PNG_1x1 });

      expect(result).toEqual({ ok: true });
      expect(mkdirMock).toHaveBeenCalledWith(expect.stringContaining('gw1'), { recursive: true });
      expect(writeFileMock).toHaveBeenCalledWith(expect.stringMatching(/agent1\.png$/), expect.any(Buffer));
      expect(debugInfoMock).toHaveBeenCalledWith(expect.objectContaining({ domain: 'avatar', event: 'avatar.saved' }));
    });

    it('removes existing avatar before saving new one', async () => {
      readdirMock.mockResolvedValue(['agent1.jpg']);

      const handler = handleMap.get('avatar:save')!;
      await handler({}, { gatewayId: 'gw1', agentId: 'agent1', dataUrl: PNG_1x1 });

      expect(unlinkMock).toHaveBeenCalledWith(expect.stringMatching(/agent1\.jpg$/));
      expect(writeFileMock).toHaveBeenCalledWith(expect.stringMatching(/agent1\.png$/), expect.any(Buffer));
    });

    it('rejects traversal IDs', async () => {
      const handler = handleMap.get('avatar:save')!;
      const result = await handler({}, { gatewayId: '../etc', agentId: 'a', dataUrl: PNG_1x1 });
      expect(result).toEqual({ ok: false, error: 'invalid id' });
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it('rejects invalid data URL', async () => {
      const handler = handleMap.get('avatar:save')!;
      const result = await handler({}, { gatewayId: 'gw1', agentId: 'a', dataUrl: 'not-a-data-url' });
      expect(result).toEqual({ ok: false, error: 'invalid data URL' });
    });

    it('rejects unsupported MIME type', async () => {
      const handler = handleMap.get('avatar:save')!;
      const result = await handler(
        {},
        {
          gatewayId: 'gw1',
          agentId: 'a',
          dataUrl: 'data:image/bmp;base64,AA==',
        },
      );
      expect(result).toEqual({ ok: false, error: 'unsupported MIME type: image/bmp' });
    });
  });

  describe('avatar:delete', () => {
    it('deletes an existing avatar file', async () => {
      readdirMock.mockResolvedValue(['agent1.png']);
      const handler = handleMap.get('avatar:delete')!;
      const result = await handler({}, { gatewayId: 'gw1', agentId: 'agent1' });
      expect(result).toEqual({ ok: true });
      expect(unlinkMock).toHaveBeenCalledWith(expect.stringMatching(/agent1\.png$/));
    });

    it('succeeds even when no avatar exists', async () => {
      const handler = handleMap.get('avatar:delete')!;
      const result = await handler({}, { gatewayId: 'gw1', agentId: 'agent1' });
      expect(result).toEqual({ ok: true });
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('rejects traversal IDs', async () => {
      const handler = handleMap.get('avatar:delete')!;
      const result = await handler({}, { gatewayId: 'gw1', agentId: '../../passwd' });
      expect(result).toEqual({ ok: false, error: 'invalid id' });
    });
  });

  describe('avatar:list-local', () => {
    it('returns agent IDs with valid image extensions', async () => {
      readdirMock.mockResolvedValue(['agent1.png', 'agent2.jpg', 'readme.txt']);
      const handler = handleMap.get('avatar:list-local')!;
      const result = (await handler({}, { gatewayId: 'gw1' })) as { ok: boolean; result: string[] };
      expect(result.ok).toBe(true);
      expect(result.result).toEqual(['agent1', 'agent2']);
    });

    it('returns empty array when directory does not exist', async () => {
      readdirMock.mockRejectedValue(new Error('ENOENT'));
      const handler = handleMap.get('avatar:list-local')!;
      const result = await handler({}, { gatewayId: 'gw1' });
      expect(result).toEqual({ ok: true, result: [] });
    });

    it('returns empty array for invalid gateway ID', async () => {
      const handler = handleMap.get('avatar:list-local')!;
      const result = await handler({}, { gatewayId: '../bad' });
      expect(result).toEqual({ ok: true, result: [] });
    });
  });

  describe('clawwork-avatar protocol', () => {
    it('serves an existing avatar via net.fetch', async () => {
      readdirMock.mockResolvedValue(['agent1.png']);
      const resp = await protocolHandler!({ url: 'clawwork-avatar://gw1/agent1' });
      expect(netFetchMock).toHaveBeenCalledWith(expect.stringContaining('agent1.png'));
      expect(resp).toBeTruthy();
    });

    it('returns 404 when no avatar file exists', async () => {
      const resp = await protocolHandler!({ url: 'clawwork-avatar://gw1/missing' });
      expect(resp.status).toBe(404);
    });

    it('returns 400 for invalid IDs', async () => {
      const resp = await protocolHandler!({ url: 'clawwork-avatar://..%2F..%2Fetc/passwd' });
      expect(resp.status).toBe(400);
    });
  });
});
