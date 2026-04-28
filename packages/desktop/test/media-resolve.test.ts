import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  realpathSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  open: vi.fn(),
  realpath: vi.fn(),
  stat: vi.fn(),
}));

import { realpathSync } from 'fs';
import { open, realpath, stat } from 'fs/promises';
import { readOpenClawMediaFile } from '../src/main/media/resolve.js';

const mockOpen = vi.mocked(open);
const mockRealpath = vi.mocked(realpath);
const mockStat = vi.mocked(stat);
const mockRealpathSync = vi.mocked(realpathSync);
const previousStateDir = process.env.OPENCLAW_STATE_DIR;

describe('OpenClaw media file access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENCLAW_STATE_DIR = '/state';
  });

  afterEach(() => {
    if (previousStateDir === undefined) {
      delete process.env.OPENCLAW_STATE_DIR;
    } else {
      process.env.OPENCLAW_STATE_DIR = previousStateDir;
    }
  });

  it('reads opened image fds inside the OpenClaw media root', async () => {
    const readFile = vi.fn().mockResolvedValue('aW1hZ2U=');
    const close = vi.fn().mockResolvedValue(undefined);
    const openedStat = { dev: 1, ino: 2, isFile: () => true, size: 1024 };
    mockOpen.mockResolvedValue({
      fd: 42,
      stat: vi.fn().mockResolvedValue(openedStat),
      readFile,
      close,
    } as unknown as Awaited<ReturnType<typeof open>>);
    mockRealpath.mockImplementation(async (path) => {
      if (path === '/state/media') return '/state/media';
      throw new Error(`unexpected path ${path}`);
    });
    mockRealpathSync.mockReturnValue('/state/media/tool-image-generation/out.png');
    mockStat.mockResolvedValue(openedStat as Awaited<ReturnType<typeof stat>>);

    await expect(readOpenClawMediaFile('/state/media/tool-image-generation/out.png')).resolves.toBe('aW1hZ2U=');
    expect(readFile).toHaveBeenCalledWith({ encoding: 'base64' });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('rejects opened fds outside the OpenClaw media root', async () => {
    const readFile = vi.fn().mockResolvedValue('c2VjcmV0');
    const close = vi.fn().mockResolvedValue(undefined);
    const openedStat = { dev: 1, ino: 2, isFile: () => true, size: 1024 };
    mockOpen.mockResolvedValue({
      fd: 42,
      stat: vi.fn().mockResolvedValue(openedStat),
      readFile,
      close,
    } as unknown as Awaited<ReturnType<typeof open>>);
    mockRealpath.mockImplementation(async (path) => {
      if (path === '/state/media') return '/state/media';
      throw new Error(`unexpected path ${path}`);
    });
    mockRealpathSync.mockReturnValue('/private/etc/passwd');
    mockStat.mockResolvedValue(openedStat as Awaited<ReturnType<typeof stat>>);

    await expect(readOpenClawMediaFile('/state/media/tool-image-generation/out.png')).resolves.toBeNull();
    expect(readFile).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('rejects non-image extensions before reading', async () => {
    const readFile = vi.fn().mockResolvedValue('c2VjcmV0');
    const close = vi.fn().mockResolvedValue(undefined);
    mockOpen.mockResolvedValue({
      fd: 42,
      stat: vi.fn().mockResolvedValue({ isFile: () => true, size: 1024 }),
      readFile,
      close,
    } as unknown as Awaited<ReturnType<typeof open>>);
    mockRealpath.mockResolvedValue('/state/media');
    mockRealpathSync.mockReturnValue('/state/media/secret.txt');

    await expect(readOpenClawMediaFile('/state/media/secret.txt')).resolves.toBeNull();
    expect(mockOpen).not.toHaveBeenCalled();
    expect(readFile).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('rejects paths outside the media root before opening them', async () => {
    await expect(readOpenClawMediaFile('/private/tmp/out.png')).resolves.toBeNull();
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it('falls back to the requested real path when macOS keeps dev fd aliases unresolved', async () => {
    const readFile = vi.fn().mockResolvedValue('aW1hZ2U=');
    const close = vi.fn().mockResolvedValue(undefined);
    const openedStat = { dev: 1, ino: 2, isFile: () => true, size: 1024 };
    mockOpen.mockResolvedValue({
      fd: 42,
      stat: vi.fn().mockResolvedValue(openedStat),
      readFile,
      close,
    } as unknown as Awaited<ReturnType<typeof open>>);
    mockRealpath.mockImplementation(async (path) => {
      if (path === '/state/media') return '/state/media';
      if (path === '/state/media/tool-image-generation/out.png') return '/state/media/tool-image-generation/out.png';
      throw new Error(`unexpected path ${path}`);
    });
    mockRealpathSync.mockReturnValue('/dev/fd/42');
    mockStat.mockResolvedValue(openedStat as Awaited<ReturnType<typeof stat>>);

    await expect(readOpenClawMediaFile('/state/media/tool-image-generation/out.png')).resolves.toBe('aW1hZ2U=');
    expect(readFile).toHaveBeenCalledWith({ encoding: 'base64' });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('rejects paths that change between open and realpath fallback', async () => {
    const readFile = vi.fn().mockResolvedValue('c2VjcmV0');
    const close = vi.fn().mockResolvedValue(undefined);
    const openedStat = { dev: 1, ino: 2, isFile: () => true, size: 1024 };
    mockOpen.mockResolvedValue({
      fd: 42,
      stat: vi.fn().mockResolvedValue(openedStat),
      readFile,
      close,
    } as unknown as Awaited<ReturnType<typeof open>>);
    mockRealpath.mockImplementation(async (path) => {
      if (path === '/state/media') return '/state/media';
      if (path === '/state/media/tool-image-generation/out.png') return '/state/media/tool-image-generation/out.png';
      throw new Error(`unexpected path ${path}`);
    });
    mockRealpathSync.mockReturnValue('/dev/fd/42');
    mockStat.mockResolvedValue({ dev: 1, ino: 3, isFile: () => true, size: 1024 } as Awaited<ReturnType<typeof stat>>);

    await expect(readOpenClawMediaFile('/state/media/tool-image-generation/out.png')).resolves.toBeNull();
    expect(readFile).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
