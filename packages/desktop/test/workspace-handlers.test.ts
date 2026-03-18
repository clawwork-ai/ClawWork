import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const handleMap = new Map<string, (...args: unknown[]) => unknown>();

const isWorkspaceConfiguredMock = vi.fn(() => false);
const getWorkspacePathMock = vi.fn(() => '/tmp/old-workspace');
const writeConfigMock = vi.fn();
const updateConfigMock = vi.fn();
const getDefaultWorkspacePathMock = vi.fn(() => '/tmp/default-workspace');

const initWorkspaceMock = vi.fn();
const migrateWorkspaceMock = vi.fn();

const initDatabaseMock = vi.fn();
const reinitDatabaseMock = vi.fn();
const closeDatabaseMock = vi.fn();

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handleMap.set(channel, handler);
    }),
  },
}));

vi.mock('../src/main/workspace/config.js', () => ({
  getWorkspacePath: getWorkspacePathMock,
  writeConfig: writeConfigMock,
  updateConfig: updateConfigMock,
  isWorkspaceConfigured: isWorkspaceConfiguredMock,
  getDefaultWorkspacePath: getDefaultWorkspacePathMock,
}));

vi.mock('../src/main/workspace/init.js', () => ({
  initWorkspace: initWorkspaceMock,
  migrateWorkspace: migrateWorkspaceMock,
}));

vi.mock('../src/main/db/index.js', () => ({
  initDatabase: initDatabaseMock,
  reinitDatabase: reinitDatabaseMock,
  closeDatabase: closeDatabaseMock,
}));

function createDeferred(): {
  promise: Promise<void>;
  resolve: () => void;
} {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('registerWorkspaceHandlers', () => {
  beforeEach(() => {
    handleMap.clear();
    vi.clearAllMocks();
    getWorkspacePathMock.mockReturnValue('/tmp/old-workspace');
    isWorkspaceConfiguredMock.mockReturnValue(false);
    getDefaultWorkspacePathMock.mockReturnValue('/tmp/default-workspace');
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('waits for workspace migration before reopening the database', async () => {
    const deferred = createDeferred();
    migrateWorkspaceMock.mockReturnValue(deferred.promise);

    const { registerWorkspaceHandlers } = await import('../src/main/ipc/workspace-handlers.js');

    registerWorkspaceHandlers();

    const handler = handleMap.get('workspace:change');
    expect(handler).toBeTypeOf('function');

    const pending = handler?.({}, '/tmp/new-workspace') as Promise<{ ok: boolean; error?: string }>;

    await Promise.resolve();

    expect(closeDatabaseMock).toHaveBeenCalledTimes(1);
    expect(migrateWorkspaceMock).toHaveBeenCalledWith('/tmp/old-workspace', '/tmp/new-workspace');
    expect(reinitDatabaseMock).not.toHaveBeenCalled();
    expect(updateConfigMock).not.toHaveBeenCalled();

    deferred.resolve();

    await expect(pending).resolves.toEqual({ ok: true });
    expect(reinitDatabaseMock).toHaveBeenCalledWith('/tmp/new-workspace');
    expect(updateConfigMock).toHaveBeenCalledWith({ workspacePath: '/tmp/new-workspace' });
  });

  it('includes rollback failure details when migration recovery also fails', async () => {
    migrateWorkspaceMock.mockRejectedValue(new Error('copy failed'));
    reinitDatabaseMock.mockImplementation((workspacePath: string) => {
      if (workspacePath === '/tmp/old-workspace') {
        throw new Error('restore failed');
      }
    });

    const { registerWorkspaceHandlers } = await import('../src/main/ipc/workspace-handlers.js');

    registerWorkspaceHandlers();

    const handler = handleMap.get('workspace:change');
    expect(handler).toBeTypeOf('function');

    await expect(handler?.({}, '/tmp/new-workspace')).resolves.toEqual({
      ok: false,
      error: 'copy failed; rollback failed: restore failed',
    });

    expect(closeDatabaseMock).toHaveBeenCalledTimes(1);
    expect(reinitDatabaseMock).toHaveBeenCalledWith('/tmp/old-workspace');
  });
});
