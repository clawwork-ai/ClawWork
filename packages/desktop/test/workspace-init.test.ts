import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { resolve as winResolve, sep as winSep } from 'node:path/win32';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs/promises', () => ({
  cp: vi.fn().mockResolvedValue(undefined),
}));

import { cp } from 'fs/promises';
import { migrateWorkspace, isNestedOrEqualWorkspacePath } from '../src/main/workspace/init.js';

const cpMock = vi.mocked(cp);

describe('migrateWorkspace', () => {
  let oldDir: string;

  beforeEach(() => {
    cpMock.mockClear();
    oldDir = mkdtempSync(join(tmpdir(), 'clawwork-ws-old-'));
  });

  afterEach(() => {
    rmSync(oldDir, { recursive: true, force: true });
  });

  it('rejects when new path is inside the current workspace', async () => {
    const nested = join(oldDir, 'sub');
    await expect(migrateWorkspace(oldDir, nested)).rejects.toThrow(
      'New workspace path must not be inside or equal to the current workspace',
    );
    expect(cpMock).not.toHaveBeenCalled();
  });

  it('rejects when new path equals the current workspace', async () => {
    await expect(migrateWorkspace(oldDir, oldDir)).rejects.toThrow(
      'New workspace path must not be inside or equal to the current workspace',
    );
    expect(cpMock).not.toHaveBeenCalled();
  });

  it('allows migration to a sibling directory', async () => {
    const newDir = mkdtempSync(join(tmpdir(), 'clawwork-ws-new-'));
    try {
      await migrateWorkspace(oldDir, newDir);
      expect(cpMock).toHaveBeenCalledWith(resolve(oldDir), resolve(newDir), {
        recursive: true,
        errorOnExist: false,
        force: true,
      });
    } finally {
      rmSync(newDir, { recursive: true, force: true });
    }
  });

  it('detects nested Windows paths when using the platform separator', () => {
    const resolvedOld = winResolve('C:\\workspace');
    const resolvedNew = winResolve('C:\\workspace\\sub');

    expect(resolvedNew.startsWith(resolvedOld + '/')).toBe(false);
    expect(resolvedNew.startsWith(resolvedOld + winSep)).toBe(true);
  });
});

describe('isNestedOrEqualWorkspacePath', () => {
  it('is case-sensitive on linux', () => {
    const resolvedOld = winResolve('C:\\Workspace');
    const resolvedNew = winResolve('C:\\workspace\\sub');
    expect(isNestedOrEqualWorkspacePath(resolvedOld, resolvedNew)).toBe(false);
  });

  it('is case-insensitive on win32', () => {
    const resolvedOld = winResolve('C:\\Workspace');
    const resolvedNew = winResolve('C:\\workspace\\sub');

    const win32Spy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    expect(isNestedOrEqualWorkspacePath(resolvedOld, resolvedNew)).toBe(true);
    win32Spy.mockRestore();
  });

  it('is case-insensitive on darwin', () => {
    const resolvedOld = resolve('/Users/Test/Workspace');
    const resolvedNew = resolve('/users/test/workspace/sub');

    const darwinSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    expect(isNestedOrEqualWorkspacePath(resolvedOld, resolvedNew)).toBe(true);
    darwinSpy.mockRestore();
  });
});
