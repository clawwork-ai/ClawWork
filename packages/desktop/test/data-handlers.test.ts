import { beforeEach, describe, expect, it, vi } from 'vitest';

const handleMap = new Map<string, (...args: unknown[]) => unknown>();
const getWorkspacePathMock = vi.fn(() => null);
const autoExtractArtifactsMock = vi.fn();
const runMock = vi.fn();
const valuesMock = vi.fn(() => ({ run: runMock }));
const insertMock = vi.fn(() => ({ values: valuesMock }));
const getDbMock = vi.fn(() => ({ insert: insertMock }));

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handleMap.set(channel, handler);
    }),
  },
}));

vi.mock('../src/main/workspace/config.js', () => ({
  getWorkspacePath: getWorkspacePathMock,
}));

vi.mock('../src/main/artifact/auto-extract.js', () => ({
  autoExtractArtifacts: autoExtractArtifactsMock,
}));

vi.mock('../src/main/db/index.js', () => ({
  getDb: getDbMock,
  isDbReady: vi.fn(() => true),
}));

describe('registerDataHandlers', () => {
  beforeEach(() => {
    vi.resetModules();
    handleMap.clear();
    getWorkspacePathMock.mockReturnValue(null);
    autoExtractArtifactsMock.mockReset();
    runMock.mockReset();
    valuesMock.mockClear();
    insertMock.mockClear();
    getDbMock.mockClear();
  });

  it('deduplicates repeated message inserts for the same logical message', async () => {
    const { registerDataHandlers } = await import('../src/main/ipc/data-handlers.js');

    registerDataHandlers();

    const createMessage = handleMap.get('data:create-message');
    expect(createMessage).toBeTypeOf('function');

    runMock
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error(
          'UNIQUE constraint failed: messages.task_id, messages.role, messages.content, messages.timestamp',
        );
      });

    const payload = {
      id: 'msg-1',
      taskId: 'task-1',
      role: 'assistant',
      content: 'same reply',
      timestamp: '2026-03-16T00:00:01.000Z',
    };

    expect(createMessage?.({}, payload)).toEqual({ ok: true });
    expect(createMessage?.({}, { ...payload, id: 'msg-2' })).toEqual({ ok: true });

    expect(runMock).toHaveBeenCalledTimes(2);
    expect(autoExtractArtifactsMock).not.toHaveBeenCalled();
  });
});
