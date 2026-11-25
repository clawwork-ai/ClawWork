import { beforeEach, describe, expect, it, vi } from 'vitest';

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
import { readInboxFile, resolveInboxPath } from '../src/main/inbox/resolve.js';

const mockOpen = vi.mocked(open);
const mockRealpath = vi.mocked(realpath);
const mockRealpathSync = vi.mocked(realpathSync);
const mockStat = vi.mocked(stat);
const openedStat = { dev: 1, ino: 2, isFile: () => true };

describe('inbox path access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStat.mockResolvedValue(openedStat as Awaited<ReturnType<typeof stat>>);
  });

  it('rejects symlink escapes when resolving inbox paths', async () => {
    mockRealpath.mockImplementation(async (path) => {
      if (path === '/workspace') return '/workspace';
      if (path === '/workspace/task-1/inbox') return '/workspace/task-1/inbox';
      if (path === '/workspace/task-1/inbox/file.txt') return '/private/etc/passwd';
      throw new Error(`unexpected path ${path}`);
    });

    await expect(resolveInboxPath('/workspace', 'task-1/inbox/file.txt')).resolves.toBeNull();
  });

  it('reads inbox files only after the opened fd resolves inside the inbox dir', async () => {
    const readFile = vi.fn().mockResolvedValue('aGVsbG8=');
    const close = vi.fn().mockResolvedValue(undefined);
    mockOpen.mockResolvedValue({
      fd: 42,
      stat: vi.fn().mockResolvedValue(openedStat),
      readFile,
      close,
    } as unknown as Awaited<ReturnType<typeof open>>);
    mockRealpath.mockImplementation(async (path) => {
      if (path === '/workspace') return '/workspace';
      if (path === '/workspace/task-1/inbox') return '/workspace/task-1/inbox';
      throw new Error(`unexpected path ${path}`);
    });
    mockRealpathSync.mockReturnValue('/workspace/task-1/inbox/file.txt');

    await expect(readInboxFile('/workspace', 'task-1/inbox/file.txt')).resolves.toBe('aGVsbG8=');
    expect(readFile).toHaveBeenCalledWith({ encoding: 'base64' });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('rejects opened fds that resolve outside the inbox dir', async () => {
    const readFile = vi.fn().mockResolvedValue('aGVsbG8=');
    const close = vi.fn().mockResolvedValue(undefined);
    mockOpen.mockResolvedValue({
      fd: 42,
      stat: vi.fn().mockResolvedValue(openedStat),
      readFile,
      close,
    } as unknown as Awaited<ReturnType<typeof open>>);
    mockRealpath.mockImplementation(async (path) => {
      if (path === '/workspace') return '/workspace';
      if (path === '/workspace/task-1/inbox') return '/workspace/task-1/inbox';
      throw new Error(`unexpected path ${path}`);
    });
    mockRealpathSync.mockReturnValue('/private/etc/passwd');

    await expect(readInboxFile('/workspace', 'task-1/inbox/file.txt')).resolves.toBeNull();
    expect(readFile).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it.each([
    { name: 'reads the matching opened file', ino: 2, expected: 'aGVsbG8=' },
    { name: 'rejects a replaced file', ino: 3, expected: null },
  ])('when fd aliases remain unresolved, $name', async ({ ino, expected }) => {
    const readFile = vi.fn().mockResolvedValue('aGVsbG8=');
    const close = vi.fn().mockResolvedValue(undefined);
    mockOpen.mockResolvedValue({
      fd: 42,
      stat: vi.fn().mockResolvedValue(openedStat),
      readFile,
      close,
    } as unknown as Awaited<ReturnType<typeof open>>);
    mockRealpath.mockImplementation(async (path) => {
      if (path === '/workspace') return '/workspace';
      if (path === '/workspace/task-1/inbox') return '/workspace/task-1/inbox';
      if (path === '/workspace/task-1/inbox/file.txt') return '/workspace/task-1/inbox/file.txt';
      throw new Error(`unexpected path ${path}`);
    });
    mockRealpathSync.mockReturnValue('/dev/fd/42');
    mockStat.mockResolvedValue({ ...openedStat, ino } as Awaited<ReturnType<typeof stat>>);

    await expect(readInboxFile('/workspace', 'task-1/inbox/file.txt')).resolves.toBe(expected);
    expect(readFile).toHaveBeenCalledTimes(expected === null ? 0 : 1);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
