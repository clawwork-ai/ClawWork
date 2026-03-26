import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/persistence/db', () => ({
  listTasks: vi.fn(),
  listMessages: vi.fn(),
  saveTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTaskAndMessages: vi.fn(),
  saveMessage: vi.fn(),
}));

import { createBrowserPersistence } from '../src/platform/persistence-adapter';
import {
  listTasks,
  listMessages,
  saveTask,
  updateTask,
  deleteTaskAndMessages,
  saveMessage,
} from '../src/persistence/db';

const mockedListTasks = vi.mocked(listTasks);
const mockedListMessages = vi.mocked(listMessages);
const mockedSaveTask = vi.mocked(saveTask);
const mockedUpdateTask = vi.mocked(updateTask);
const mockedDeleteTaskAndMessages = vi.mocked(deleteTaskAndMessages);
const mockedSaveMessage = vi.mocked(saveMessage);

function makeTask(overrides: Partial<ReturnType<typeof fullTask>> = {}) {
  return { ...fullTask(), ...overrides };
}

function fullTask() {
  return {
    id: 'task-1',
    sessionKey: 'agent:main:clawwork:task:task-1',
    sessionId: 'sess-1',
    title: 'Test task',
    status: 'active',
    createdAt: '2026-03-26T00:00:00.000Z',
    updatedAt: '2026-03-26T01:00:00.000Z',
    tags: ['tag1'],
    artifactDir: '/artifacts/task-1',
    gatewayId: 'gw-1',
    model: 'claude-opus-4-20250514',
    modelProvider: 'anthropic',
    thinkingLevel: 'high',
    inputTokens: 100,
    outputTokens: 200,
    contextTokens: 300,
  };
}

function fullMessage() {
  return {
    id: 'msg-1',
    taskId: 'task-1',
    role: 'assistant',
    content: 'Hello',
    timestamp: '2026-03-26T00:00:00.000Z',
    imageAttachments: [{ url: 'https://example.com/img.png' }],
    toolCalls: [{ id: 'tc-1', name: 'read_file', status: 'done' }],
  };
}

describe('createBrowserPersistence', () => {
  let persistence: ReturnType<typeof createBrowserPersistence>;

  beforeEach(() => {
    vi.clearAllMocks();
    persistence = createBrowserPersistence();
  });

  describe('loadTasks', () => {
    it('returns ok with all PersistedTask fields including optional ones', async () => {
      const task = makeTask();
      mockedListTasks.mockResolvedValue([task]);

      const result = await persistence.loadTasks();

      expect(result).toEqual({ ok: true, rows: [task] });
      expect(mockedListTasks).toHaveBeenCalledOnce();
    });

    it('returns ok with empty array when no tasks', async () => {
      mockedListTasks.mockResolvedValue([]);
      const result = await persistence.loadTasks();
      expect(result).toEqual({ ok: true, rows: [] });
    });

    it('returns ok false on error', async () => {
      mockedListTasks.mockRejectedValue(new Error('IndexedDB unavailable'));
      const result = await persistence.loadTasks();
      expect(result).toEqual({ ok: false, error: 'IndexedDB unavailable' });
    });

    it('returns generic error for non-Error throws', async () => {
      mockedListTasks.mockRejectedValue('kaboom');
      const result = await persistence.loadTasks();
      expect(result).toEqual({ ok: false, error: 'loadTasks failed' });
    });
  });

  describe('loadMessages', () => {
    it('returns messages filtered by taskId', async () => {
      const msg = fullMessage();
      mockedListMessages.mockResolvedValue([msg]);

      const result = await persistence.loadMessages('task-1');

      expect(result).toEqual({ ok: true, rows: [msg] });
      expect(mockedListMessages).toHaveBeenCalledWith('task-1');
    });

    it('returns ok false on error', async () => {
      mockedListMessages.mockRejectedValue(new Error('read error'));
      const result = await persistence.loadMessages('task-1');
      expect(result).toEqual({ ok: false, error: 'read error' });
    });
  });

  describe('persistTask', () => {
    it('calls saveTask with all fields including model/tokens', async () => {
      const task = makeTask();
      mockedSaveTask.mockResolvedValue(undefined);

      const result = await persistence.persistTask(task);

      expect(result).toEqual({ ok: true });
      expect(mockedSaveTask).toHaveBeenCalledWith(task);
    });

    it('returns ok false on error', async () => {
      mockedSaveTask.mockRejectedValue(new Error('write error'));
      const result = await persistence.persistTask(makeTask());
      expect(result).toEqual({ ok: false, error: 'write error' });
    });
  });

  describe('persistTaskUpdate', () => {
    it('calls updateTask with id and partial updates', async () => {
      mockedUpdateTask.mockResolvedValue(undefined);

      const result = await persistence.persistTaskUpdate({
        id: 'task-1',
        title: 'Updated title',
        status: 'done',
        updatedAt: '2026-03-26T02:00:00.000Z',
      });

      expect(result).toEqual({ ok: true });
      expect(mockedUpdateTask).toHaveBeenCalledWith('task-1', {
        title: 'Updated title',
        status: 'done',
        updatedAt: '2026-03-26T02:00:00.000Z',
      });
    });

    it('returns ok false on error', async () => {
      mockedUpdateTask.mockRejectedValue(new Error('update error'));
      const result = await persistence.persistTaskUpdate({
        id: 'task-1',
        updatedAt: '2026-03-26T02:00:00.000Z',
      });
      expect(result).toEqual({ ok: false, error: 'update error' });
    });
  });

  describe('persistMessage', () => {
    it('calls saveMessage with all fields including imageAttachments and toolCalls', async () => {
      const msg = fullMessage();
      mockedSaveMessage.mockResolvedValue(undefined);

      const result = await persistence.persistMessage(msg);

      expect(result).toEqual({ ok: true });
      expect(mockedSaveMessage).toHaveBeenCalledWith(msg);
    });

    it('returns ok false on error', async () => {
      mockedSaveMessage.mockRejectedValue(new Error('persist error'));
      const result = await persistence.persistMessage(fullMessage());
      expect(result).toEqual({ ok: false, error: 'persist error' });
    });
  });

  describe('deleteTask', () => {
    it('calls deleteTaskAndMessages for cascade delete', async () => {
      mockedDeleteTaskAndMessages.mockResolvedValue(undefined);

      const result = await persistence.deleteTask('task-1');

      expect(result).toEqual({ ok: true });
      expect(mockedDeleteTaskAndMessages).toHaveBeenCalledWith('task-1');
    });

    it('returns ok false on error', async () => {
      mockedDeleteTaskAndMessages.mockRejectedValue(new Error('delete error'));
      const result = await persistence.deleteTask('task-1');
      expect(result).toEqual({ ok: false, error: 'delete error' });
    });
  });
});
