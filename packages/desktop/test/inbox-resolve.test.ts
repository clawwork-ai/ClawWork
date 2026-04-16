import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  realpathSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  open: vi.fn(),
  realpath: vi.fn(),
}));

import { realpathSync } from 'fs';
import { open, realpath } from 'fs/promises';
import { readInboxFile, resolveInboxPath } from '../src/main/inbox/resolve.js';

const mockOpen = vi.mocked(open);
const mockRealpath = vi.mocked(realpath);
const mockRealpathSync = vi.mocked(realpathSync);

describe('inbox path access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
