import { beforeEach, describe, expect, it, vi } from 'vitest';

const handleMap = new Map<string, (...args: unknown[]) => unknown>();
const getWorkspacePathMock = vi.fn(() => null);
const autoExtractArtifactsMock = vi.fn();
const runMock = vi.fn();
const conflictRunMock = vi.fn();
const onConflictDoUpdateMock = vi.fn(() => ({ run: conflictRunMock }));
const valuesMock = vi.fn(() => ({ onConflictDoUpdate: onConflictDoUpdateMock, run: runMock }));
const insertMock = vi.fn(() => ({ values: valuesMock }));
const selectGetMock = vi.fn(() => ({ sk: 'agent:main:clawwork:task:task-1' }));
const selectWhereMock = vi.fn(() => ({ get: selectGetMock }));
const selectFromMock = vi.fn(() => ({ where: selectWhereMock }));
const selectMock = vi.fn(() => ({ from: selectFromMock }));
const getDbMock = vi.fn(() => ({ insert: insertMock, select: selectMock }));

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
    conflictRunMock.mockReset();
    onConflictDoUpdateMock.mockClear();
    valuesMock.mockClear();
    insertMock.mockClear();
    getDbMock.mockClear();
  });

  it('deduplicates repeated message inserts for the same logical message', async () => {
    const { registerDataHandlers } = await import('../src/main/ipc/data-handlers.js');

    registerDataHandlers();

    const createMessage = handleMap.get('data:create-message');
    expect(createMessage).toBeTypeOf('function');

    conflictRunMock.mockImplementation(() => undefined);

    const payload = {
      id: 'msg-1',
      taskId: 'task-1',
      role: 'assistant',
      content: 'same reply',
      timestamp: '2026-03-16T00:00:01.000Z',
    };

    expect(createMessage?.({}, payload)).toEqual({ ok: true });
    expect(createMessage?.({}, { ...payload, id: 'msg-2' })).toEqual({ ok: true });

    expect(conflictRunMock).toHaveBeenCalledTimes(2);
    expect(autoExtractArtifactsMock).not.toHaveBeenCalled();
  });

  it('updates toolCalls when persisting the same logical message again', async () => {
    const { registerDataHandlers } = await import('../src/main/ipc/data-handlers.js');

    registerDataHandlers();

    const createMessage = handleMap.get('data:create-message');
    expect(createMessage).toBeTypeOf('function');

    const payload = {
      id: 'msg-tool-1',
      taskId: 'task-1',
      role: 'assistant',
      content: 'CPU info',
      timestamp: '2026-03-16T00:00:01.000Z',
      toolCalls: [{ id: 'exec-1', name: 'exec', status: 'running' }],
    };

    expect(createMessage?.({}, payload)).toEqual({ ok: true });
    expect(
      createMessage?.(
        {},
        {
          ...payload,
          id: 'msg-tool-2',
          toolCalls: [{ id: 'exec-1', name: 'exec', status: 'done', result: 'uname -a' }],
        },
      ),
    ).toEqual({ ok: true });

    expect(onConflictDoUpdateMock).toHaveBeenCalledTimes(2);
    expect(onConflictDoUpdateMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.anything(),
        set: expect.objectContaining({
          toolCalls: JSON.stringify([{ id: 'exec-1', name: 'exec', status: 'done', result: 'uname -a' }]),
        }),
      }),
    );
  });
});
