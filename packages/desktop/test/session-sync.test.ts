import { beforeEach, describe, expect, it, vi } from 'vitest';

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function loadModules() {
  vi.resetModules();
  const [sessionSync, taskStore, messageStore] = await Promise.all([
    import('../src/renderer/lib/session-sync'),
    import('../src/renderer/stores/taskStore'),
    import('../src/renderer/stores/messageStore'),
  ]);
  return { sessionSync, taskStore, messageStore };
}

describe('session sync startup flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const windowWithClawwork = (globalThis.window ??= {} as typeof globalThis.window) as Window & {
      clawwork: {
        syncSessions: ReturnType<typeof vi.fn>;
        persistTask: ReturnType<typeof vi.fn>;
        persistTaskUpdate: ReturnType<typeof vi.fn>;
        loadMessages: ReturnType<typeof vi.fn>;
        loadTasks: ReturnType<typeof vi.fn>;
        persistMessage: ReturnType<typeof vi.fn>;
        getDeviceId: ReturnType<typeof vi.fn>;
      };
    };
    windowWithClawwork.clawwork = {
      syncSessions: vi.fn(),
      persistTask: vi.fn().mockResolvedValue({ ok: true }),
      persistTaskUpdate: vi.fn().mockResolvedValue({ ok: true }),
      loadMessages: vi.fn().mockResolvedValue({ ok: true, rows: [] }),
      loadTasks: vi.fn().mockResolvedValue({ ok: true, rows: [] }),
      persistMessage: vi.fn().mockResolvedValue({ ok: true }),
      getDeviceId: vi.fn().mockResolvedValue('device-1'),
    };
  });

  it('filters gateway-injected model values from discovered session metadata', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      streamingByTask: {},
      streamingThinkingByTask: {},
      processingTasks: new Set(),
      highlightedMessageId: null,
    });

    window.clawwork.syncSessions.mockResolvedValue({
      ok: true,
      discovered: [
        {
          gatewayId: 'gw-1',
          taskId: 'task-1',
          sessionKey: 'agent:main:clawwork:task:task-1',
          title: 'Task 1',
          updatedAt: '2026-03-16T00:00:00.000Z',
          agentId: 'main',
          model: 'gateway-injected',
          modelProvider: 'openclaw',
          thinkingLevel: 'medium',
          inputTokens: 1,
          outputTokens: 2,
          contextTokens: 3,
          messages: [],
        },
      ],
    });

    await sessionSync.syncFromGateway();

    const task = taskStore.useTaskStore.getState().tasks[0];
    expect(task).toBeTruthy();
    expect(task.model).toBeUndefined();
    expect(task.modelProvider).toBe('openclaw');
    expect(window.clawwork.persistTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        model: undefined,
        modelProvider: 'openclaw',
      }),
    );
  });

  it('waits for local hydration before syncing gateway history for an existing task', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      streamingByTask: {},
      streamingThinkingByTask: {},
      processingTasks: new Set(),
      highlightedMessageId: null,
    });

    const taskRow = {
      id: 'task-1',
      sessionKey: 'agent:main:clawwork:task:task-1',
      sessionId: 'session-1',
      title: 'Task 1',
      status: 'active',
      model: null,
      modelProvider: null,
      thinkingLevel: null,
      inputTokens: null,
      outputTokens: null,
      contextTokens: null,
      createdAt: '2026-03-16T00:00:00.000Z',
      updatedAt: '2026-03-16T00:00:00.000Z',
      tags: [],
      artifactDir: 'tasks/task-1',
      gatewayId: 'gw-1',
    };
    const existingRow = {
      id: 'local-msg-1',
      taskId: 'task-1',
      role: 'assistant',
      content: 'same reply',
      timestamp: '2026-03-16T00:00:01.000Z',
      imageAttachments: undefined,
    };
    const loadMessagesDeferred = createDeferred<{ ok: true; rows: (typeof existingRow)[] }>();

    window.clawwork.loadTasks.mockResolvedValue({ ok: true, rows: [taskRow] });
    window.clawwork.loadMessages.mockReturnValue(loadMessagesDeferred.promise);
    window.clawwork.syncSessions.mockResolvedValue({
      ok: true,
      discovered: [
        {
          gatewayId: 'gw-1',
          taskId: 'task-1',
          sessionKey: 'agent:main:clawwork:task:task-1',
          title: 'Task 1',
          updatedAt: '2026-03-16T00:00:02.000Z',
          agentId: 'main',
          model: 'model-1',
          modelProvider: 'openclaw',
          thinkingLevel: 'medium',
          inputTokens: 1,
          outputTokens: 2,
          contextTokens: 3,
          messages: [
            {
              role: 'assistant',
              content: 'same reply',
              timestamp: '2026-03-16T00:00:01.000Z',
            },
          ],
        },
      ],
    });

    const hydratePromise = sessionSync.hydrateFromLocal();
    await Promise.resolve();

    const syncPromise = sessionSync.syncFromGateway();
    await Promise.resolve();

    loadMessagesDeferred.resolve({ ok: true, rows: [existingRow] });

    await Promise.all([hydratePromise, syncPromise]);

    expect(window.clawwork.persistMessage).not.toHaveBeenCalled();
    expect(messageStore.useMessageStore.getState().messagesByTask['task-1']).toEqual([
      expect.objectContaining({
        id: 'local-msg-1',
        content: 'same reply',
        timestamp: '2026-03-16T00:00:01.000Z',
      }),
    ]);
  });

  it('deduplicates messages with different timestamps but same role+content', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      streamingByTask: {},
      streamingThinkingByTask: {},
      processingTasks: new Set(),
      highlightedMessageId: null,
    });

    const taskRow = {
      id: 'task-dup',
      sessionKey: 'agent:main:clawwork:task:task-dup',
      sessionId: 'session-dup',
      title: 'Dup test',
      status: 'active',
      model: null,
      modelProvider: null,
      thinkingLevel: null,
      inputTokens: null,
      outputTokens: null,
      contextTokens: null,
      createdAt: '2026-03-16T00:00:00.000Z',
      updatedAt: '2026-03-16T00:00:00.000Z',
      tags: [],
      artifactDir: 'tasks/task-dup',
      gatewayId: 'gw-1',
    };
    window.clawwork.loadTasks.mockResolvedValue({ ok: true, rows: [taskRow] });
    window.clawwork.loadMessages.mockResolvedValue({
      ok: true,
      rows: [
        { id: 'u1', taskId: 'task-dup', role: 'user', content: 'Hello', timestamp: '2026-03-16T10:00:00.123Z' },
        {
          id: 'a1',
          taskId: 'task-dup',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: '2026-03-16T10:00:01.234Z',
        },
      ],
    });
    window.clawwork.syncSessions.mockResolvedValue({
      ok: true,
      discovered: [
        {
          gatewayId: 'gw-1',
          taskId: 'task-dup',
          sessionKey: 'agent:main:clawwork:task:task-dup',
          title: 'Dup test',
          updatedAt: '2026-03-16T10:00:02.000Z',
          agentId: 'main',
          messages: [
            { role: 'user', content: 'Hello', timestamp: '2026-03-16T10:00:00.456Z' },
            { role: 'assistant', content: 'Hi there!', timestamp: '2026-03-16T10:00:01.789Z' },
          ],
        },
      ],
    });

    await sessionSync.syncFromGateway();

    const msgs = messageStore.useMessageStore.getState().messagesByTask['task-dup'];
    expect(msgs).toHaveLength(2);
    expect(msgs[0].content).toBe('Hello');
    expect(msgs[1].content).toBe('Hi there!');
    expect(window.clawwork.persistMessage).not.toHaveBeenCalled();
  });

  it('allows genuine duplicate content messages (user sends same text twice)', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      streamingByTask: {},
      streamingThinkingByTask: {},
      processingTasks: new Set(),
      highlightedMessageId: null,
    });

    const taskRow = {
      id: 'task-legit',
      sessionKey: 'agent:main:clawwork:task:task-legit',
      sessionId: 'session-legit',
      title: 'Legit dup',
      status: 'active',
      model: null,
      modelProvider: null,
      thinkingLevel: null,
      inputTokens: null,
      outputTokens: null,
      contextTokens: null,
      createdAt: '2026-03-16T00:00:00.000Z',
      updatedAt: '2026-03-16T00:00:00.000Z',
      tags: [],
      artifactDir: 'tasks/task-legit',
      gatewayId: 'gw-1',
    };
    window.clawwork.loadTasks.mockResolvedValue({ ok: true, rows: [taskRow] });
    window.clawwork.loadMessages.mockResolvedValue({
      ok: true,
      rows: [{ id: 'u1', taskId: 'task-legit', role: 'user', content: 'Hello', timestamp: '2026-03-16T10:00:00.000Z' }],
    });
    window.clawwork.syncSessions.mockResolvedValue({
      ok: true,
      discovered: [
        {
          gatewayId: 'gw-1',
          taskId: 'task-legit',
          sessionKey: 'agent:main:clawwork:task:task-legit',
          title: 'Legit dup',
          updatedAt: '2026-03-16T10:00:03.000Z',
          agentId: 'main',
          messages: [
            { role: 'user', content: 'Hello', timestamp: '2026-03-16T10:00:00.500Z' },
            { role: 'assistant', content: 'Hi!', timestamp: '2026-03-16T10:00:01.000Z' },
            { role: 'user', content: 'Hello', timestamp: '2026-03-16T10:00:02.000Z' },
            { role: 'assistant', content: 'Hi again!', timestamp: '2026-03-16T10:00:03.000Z' },
          ],
        },
      ],
    });

    await sessionSync.syncFromGateway();

    const msgs = messageStore.useMessageStore.getState().messagesByTask['task-legit'];
    expect(msgs).toHaveLength(4);
    expect(msgs.map((m: { content: string }) => m.content)).toEqual(['Hello', 'Hi!', 'Hello', 'Hi again!']);
  });

  it('reuses resolved hydration state across later gateway sync calls', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      streamingByTask: {},
      streamingThinkingByTask: {},
      processingTasks: new Set(),
      highlightedMessageId: null,
    });

    window.clawwork.loadTasks.mockResolvedValue({
      ok: true,
      rows: [
        {
          id: 'task-1',
          sessionKey: 'agent:main:clawwork:task:task-1',
          sessionId: 'session-1',
          title: 'Task 1',
          status: 'active',
          model: null,
          modelProvider: null,
          thinkingLevel: null,
          inputTokens: null,
          outputTokens: null,
          contextTokens: null,
          createdAt: '2026-03-16T00:00:00.000Z',
          updatedAt: '2026-03-16T00:00:00.000Z',
          tags: [],
          artifactDir: 'tasks/task-1',
          gatewayId: 'gw-1',
        },
      ],
    });
    window.clawwork.loadMessages.mockResolvedValue({ ok: true, rows: [] });
    window.clawwork.syncSessions.mockResolvedValue({ ok: true, discovered: [] });

    await sessionSync.syncFromGateway();
    await sessionSync.syncFromGateway();

    expect(window.clawwork.loadTasks).toHaveBeenCalledTimes(1);
    expect(window.clawwork.loadMessages).toHaveBeenCalledTimes(1);
    expect(window.clawwork.syncSessions).toHaveBeenCalledTimes(2);
  });
});
