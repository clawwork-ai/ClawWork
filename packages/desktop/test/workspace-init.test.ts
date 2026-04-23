import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdirSync, existsSync } from 'fs';
import { cp } from 'fs/promises';
import { resolve } from 'path';

vi.mock('fs', () => ({
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  cp: vi.fn(),
}));

const mockExistsSync = vi.mocked(existsSync);
const mockCp = vi.mocked(cp);
const mockMkdirSync = vi.mocked(mkdirSync);

describe('migrateWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadMigrateWorkspace() {
    const mod = await import('../src/main/workspace/init.js');
    return mod.migrateWorkspace;
  }

  it('throws when new path is inside old path', async () => {
    mockExistsSync.mockReturnValue(true);
    const migrateWorkspace = await loadMigrateWorkspace();
    const oldPath = resolve('/workspace');
    const newPath = resolve('/workspace', 'sub');

    await expect(migrateWorkspace(oldPath, newPath)).rejects.toThrow(
      'New workspace path must not be inside or equal to the current workspace',
    );
    expect(mockCp).not.toHaveBeenCalled();
  });

  it('throws when new path equals old path', async () => {
    mockExistsSync.mockReturnValue(true);
    const migrateWorkspace = await loadMigrateWorkspace();
    const path = resolve('/workspace');

    await expect(migrateWorkspace(path, path)).rejects.toThrow(
      'New workspace path must not be inside or equal to the current workspace',
    );
    expect(mockCp).not.toHaveBeenCalled();
  });

  it('throws when source workspace does not exist', async () => {
    mockExistsSync.mockReturnValue(false);
    const migrateWorkspace = await loadMigrateWorkspace();

    await expect(migrateWorkspace('/old', '/new')).rejects.toThrow('Source workspace does not exist: /old');
  });

  it('copies workspace when paths are valid', async () => {
    mockExistsSync.mockReturnValue(true);
    mockCp.mockResolvedValue(undefined);
    const migrateWorkspace = await loadMigrateWorkspace();
    const oldPath = resolve('/workspace/old');
    const newPath = resolve('/workspace/new');

    await migrateWorkspace(oldPath, newPath);

    expect(mockCp).toHaveBeenCalledWith(oldPath, newPath, {
      recursive: true,
      errorOnExist: false,
      force: true,
    });
  });
});

describe('initWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadInitWorkspace() {
    const mod = await import('../src/main/workspace/init.js');
    return mod.initWorkspace;
  }

  it('creates directory when it does not exist', async () => {
    mockExistsSync.mockReturnValue(false);
    const initWorkspace = await loadInitWorkspace();

    await initWorkspace('/workspace');

    expect(mockMkdirSync).toHaveBeenCalledWith('/workspace', { recursive: true });
  });

  it('does nothing when directory already exists', async () => {
    mockExistsSync.mockReturnValue(true);
    const initWorkspace = await loadInitWorkspace();

    await initWorkspace('/workspace');

    expect(mockMkdirSync).not.toHaveBeenCalled();
  });
});
