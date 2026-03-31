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
        chatHistory: ReturnType<typeof vi.fn>;
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
      chatHistory: vi.fn(),
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
      activeTurnBySession: {},
      processingBySession: new Set(),
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
      activeTurnBySession: {},
      processingBySession: new Set(),
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

  it('deduplicates assistant messages by matching Gateway timestamp', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      activeTurnBySession: {},
      processingBySession: new Set(),
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
            { role: 'assistant', content: 'Hi there!', timestamp: '2026-03-16T10:00:01.234Z' },
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

  it('syncs only new assistant messages for existing tasks (single-writer)', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      activeTurnBySession: {},
      processingBySession: new Set(),
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
    expect(msgs).toHaveLength(3);
    expect(msgs.map((m: { content: string }) => m.content)).toEqual(['Hello', 'Hi!', 'Hi again!']);
  });

  it('collapses consecutive assistant history into one visible assistant turn during startup sync', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      activeTurnBySession: {},
      processingBySession: new Set(),
      highlightedMessageId: null,
    });

    const taskRow = {
      id: 'task-collapse',
      sessionKey: 'agent:main:clawwork:task:task-collapse',
      sessionId: 'session-collapse',
      title: 'Collapse test',
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
      artifactDir: 'tasks/task-collapse',
      gatewayId: 'gw-1',
    };

    window.clawwork.loadTasks.mockResolvedValue({ ok: true, rows: [taskRow] });
    window.clawwork.loadMessages.mockResolvedValue({
      ok: true,
      rows: [
        {
          id: 'u1',
          taskId: 'task-collapse',
          role: 'user',
          content: '再看看今天的记忆有什么',
          timestamp: '2026-03-16T10:00:00.000Z',
        },
      ],
    });
    window.clawwork.syncSessions.mockResolvedValue({
      ok: true,
      discovered: [
        {
          gatewayId: 'gw-1',
          taskId: 'task-collapse',
          sessionKey: 'agent:main:clawwork:task:task-collapse',
          title: 'Collapse test',
          updatedAt: '2026-03-16T10:00:03.000Z',
          agentId: 'main',
          messages: [
            { role: 'user', content: '再看看今天的记忆有什么', timestamp: '2026-03-16T10:00:00.000Z' },
            {
              role: 'assistant',
              content: '今天还没记录。让我看看之前有啥：',
              timestamp: '2026-03-16T10:00:01.000Z',
              toolCalls: [],
            },
            {
              role: 'assistant',
              content: '',
              timestamp: '2026-03-16T10:00:02.000Z',
              toolCalls: [
                {
                  id: 'read-1',
                  name: 'read',
                  status: 'error',
                  result: 'from memory/2026-03-23.md',
                  startedAt: '2026-03-16T10:00:02.000Z',
                  completedAt: '2026-03-16T10:00:02.100Z',
                },
              ],
            },
            {
              role: 'assistant',
              content: '记忆文件还没创建，今天是头一次聊。有啥需要我干的？',
              timestamp: '2026-03-16T10:00:03.000Z',
              toolCalls: [],
            },
            { role: 'assistant', content: 'NO_REPLY', timestamp: '2026-03-16T10:00:03.500Z', toolCalls: [] },
          ],
        },
      ],
    });

    await sessionSync.syncFromGateway();

    const msgs = messageStore.useMessageStore.getState().messagesByTask['task-collapse'];
    expect(msgs).toHaveLength(2);
    expect(msgs[1]).toEqual(
      expect.objectContaining({
        role: 'assistant',
        content: '今天还没记录。让我看看之前有啥：\n\n记忆文件还没创建，今天是头一次聊。有啥需要我干的？',
      }),
    );
    expect(msgs[1].toolCalls).toHaveLength(1);
  });

  it('promotes one collapsed assistant turn during runtime sync instead of appending multiple assistant bubbles', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({
      tasks: [
        {
          id: 'task-runtime',
          sessionKey: 'agent:main:clawwork:task:task-runtime',
          sessionId: 'session-runtime',
          title: 'Runtime test',
          status: 'active',
          createdAt: '2026-03-16T00:00:00.000Z',
          updatedAt: '2026-03-16T00:00:00.000Z',
          tags: [],
          artifactDir: 'tasks/task-runtime',
          gatewayId: 'gw-1',
        },
      ],
      activeTaskId: 'task-runtime',
      hydrated: true,
    });
    messageStore.useMessageStore.setState({
      messagesByTask: {
        'task-runtime': [
          {
            id: 'u1',
            taskId: 'task-runtime',
            role: 'user',
            content: '今天他的天气怎么样? 获取当前电脑的 IP',
            artifacts: [],
            toolCalls: [],
            timestamp: '2026-03-16T10:00:00.000Z',
          },
        ],
      },
      activeTurnBySession: {
        'agent:main:clawwork:task:task-runtime': {
          id: 'turn-1',
          streamingText: '',
          streamingThinking: '',
          toolCalls: [
            {
              id: 'exec-1',
              name: 'exec',
              status: 'done',
              result: 'fetch url',
              startedAt: '2026-03-16T10:00:01.000Z',
              completedAt: '2026-03-16T10:00:01.100Z',
            },
            {
              id: 'read-1',
              name: 'read',
              status: 'error',
              result: 'from memory/2026-03-23.md',
              startedAt: '2026-03-16T10:00:01.200Z',
              completedAt: '2026-03-16T10:00:01.300Z',
            },
          ],
          finalized: true,
          content: '天气（上海）： 15°C',
          runId: 'run-1',
          timestamp: '2026-03-16T10:00:03.000Z',
        },
      },
      processingBySession: new Set(),
      highlightedMessageId: null,
    });

    window.clawwork.chatHistory.mockResolvedValue({
      ok: true,
      result: {
        messages: [
          {
            role: 'user',
            timestamp: Date.parse('2026-03-16T10:00:00.000Z'),
            content: [{ type: 'text', text: '今天他的天气怎么样? 获取当前电脑的 IP' }],
          },
          {
            role: 'assistant',
            timestamp: Date.parse('2026-03-16T10:00:01.000Z'),
            content: [{ type: 'text', text: '今天他的天气怎么样? 我先看下天气和 IP。' }],
          },
          {
            role: 'assistant',
            timestamp: Date.parse('2026-03-16T10:00:02.000Z'),
            content: [{ type: 'toolCall', id: 'exec-1', name: 'exec', arguments: '{}' }],
          },
          {
            role: 'toolResult',
            timestamp: Date.parse('2026-03-16T10:00:02.100Z'),
            content: [{ type: 'toolResult', id: 'exec-1', result: 'fetch url' }],
          },
          {
            role: 'assistant',
            timestamp: Date.parse('2026-03-16T10:00:03.000Z'),
            content: [{ type: 'text', text: '天气（上海）： 15°C' }],
          },
          {
            role: 'assistant',
            timestamp: Date.parse('2026-03-16T10:00:03.100Z'),
            content: [{ type: 'text', text: 'NO_REPLY' }],
          },
        ],
      },
    });

    await sessionSync.syncSessionMessages('task-runtime');

    const state = messageStore.useMessageStore.getState();
    const msgs = state.messagesByTask['task-runtime'];
    expect(state.activeTurnBySession['agent:main:clawwork:task:task-runtime']).toBeUndefined();
    expect(msgs).toHaveLength(2);
    expect(msgs[1]).toEqual(
      expect.objectContaining({
        role: 'assistant',
        content: '今天他的天气怎么样? 我先看下天气和 IP。\n\n天气（上海）： 15°C',
      }),
    );
    expect(msgs[1].toolCalls).toHaveLength(2);
    expect(msgs[1].toolCalls).toEqual([
      expect.objectContaining({ id: 'exec-1', status: 'done', result: 'fetch url' }),
      expect.objectContaining({ id: 'read-1', status: 'error', result: 'from memory/2026-03-23.md' }),
    ]);
    expect(window.clawwork.persistMessage).toHaveBeenCalledTimes(1);
  });

  it('prefers terminal tool status from active turn over stale running canonical tool calls during promote', async () => {
    const { messageStore } = await loadModules();

    messageStore.useMessageStore.setState({
      messagesByTask: { 'task-promote': [] },
      activeTurnBySession: {
        'agent:main:clawwork:task:task-promote': {
          id: 'turn-promote',
          streamingText: '',
          streamingThinking: '',
          toolCalls: [
            {
              id: 'exec-1',
              name: 'exec',
              status: 'done',
              result: 'uname -a',
              startedAt: '2026-03-16T10:00:00.000Z',
              completedAt: '2026-03-16T10:00:01.000Z',
            },
          ],
          finalized: true,
          content: 'CPU info',
          timestamp: '2026-03-16T10:00:01.500Z',
        },
      },
      processingBySession: new Set(),
      highlightedMessageId: null,
    });

    messageStore.useMessageStore.getState().promoteActiveTurn('agent:main:clawwork:task:task-promote', 'task-promote', {
      id: 'canonical-1',
      taskId: 'task-promote',
      role: 'assistant',
      content: 'CPU info',
      artifacts: [],
      toolCalls: [
        {
          id: 'exec-1',
          name: 'exec',
          status: 'running',
          startedAt: '2026-03-16T10:00:00.000Z',
        },
      ],
      timestamp: '2026-03-16T10:00:01.500Z',
    });

    const saved = messageStore.useMessageStore.getState().messagesByTask['task-promote'];
    expect(saved).toHaveLength(1);
    expect(saved[0].toolCalls).toEqual([
      expect.objectContaining({
        id: 'exec-1',
        status: 'done',
        result: 'uname -a',
        completedAt: '2026-03-16T10:00:01.000Z',
      }),
    ]);
  });

  it('persists merged terminal tool status during runtime sync instead of stale canonical running state', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({
      tasks: [
        {
          id: 'task-sync-persist',
          sessionKey: 'agent:main:clawwork:task:task-sync-persist',
          sessionId: 'session-sync-persist',
          title: 'Sync persist',
          status: 'active',
          createdAt: '2026-03-16T00:00:00.000Z',
          updatedAt: '2026-03-16T00:00:00.000Z',
          tags: [],
          artifactDir: 'tasks/task-sync-persist',
          gatewayId: 'gw-1',
        },
      ],
      activeTaskId: 'task-sync-persist',
      hydrated: true,
    });
    messageStore.useMessageStore.setState({
      messagesByTask: {
        'task-sync-persist': [
          {
            id: 'u1',
            taskId: 'task-sync-persist',
            role: 'user',
            content: '查 CPU',
            artifacts: [],
            toolCalls: [],
            timestamp: '2026-03-16T10:00:00.000Z',
          },
        ],
      },
      activeTurnBySession: {
        'agent:main:clawwork:task:task-sync-persist': {
          id: 'turn-sync-persist',
          streamingText: '',
          streamingThinking: '',
          toolCalls: [
            {
              id: 'exec-1',
              name: 'exec',
              status: 'done',
              result: 'uname -a',
              startedAt: '2026-03-16T10:00:00.500Z',
              completedAt: '2026-03-16T10:00:01.000Z',
            },
          ],
          finalized: true,
          content: 'CPU info',
          runId: 'run-sync-persist',
          timestamp: '2026-03-16T10:00:01.000Z',
        },
      },
      processingBySession: new Set(),
      highlightedMessageId: null,
    });

    window.clawwork.chatHistory.mockResolvedValue({
      ok: true,
      result: {
        messages: [
          {
            role: 'user',
            timestamp: Date.parse('2026-03-16T10:00:00.000Z'),
            content: [{ type: 'text', text: '查 CPU' }],
          },
          {
            role: 'assistant',
            timestamp: Date.parse('2026-03-16T10:00:01.000Z'),
            content: [
              { type: 'text', text: 'CPU info' },
              { type: 'toolCall', id: 'exec-1', name: 'exec', arguments: '{}' },
            ],
          },
        ],
      },
    });

    await sessionSync.syncSessionMessages('task-sync-persist');

    expect(window.clawwork.persistMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-sync-persist',
        role: 'assistant',
        toolCalls: [expect.objectContaining({ id: 'exec-1', status: 'done', result: 'uname -a' })],
      }),
    );
  });

  it('reuses resolved hydration state across later gateway sync calls', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      activeTurnBySession: {},
      processingBySession: new Set(),
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

  it('hydrates persisted tool calls from local storage', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      activeTurnBySession: {},
      processingBySession: new Set(),
      highlightedMessageId: null,
    });

    window.clawwork.loadTasks.mockResolvedValue({
      ok: true,
      rows: [
        {
          id: 'task-tools',
          sessionKey: 'agent:main:clawwork:task:task-tools',
          sessionId: 'session-tools',
          title: 'Task tools',
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
          artifactDir: 'tasks/task-tools',
          gatewayId: 'gw-1',
        },
      ],
    });
    window.clawwork.loadMessages.mockResolvedValue({
      ok: true,
      rows: [
        {
          id: 'a-tool',
          taskId: 'task-tools',
          role: 'assistant',
          content: 'CPU info',
          timestamp: '2026-03-16T10:00:01.000Z',
          toolCalls: [
            {
              id: 'exec-1',
              name: 'exec',
              status: 'done',
              result: 'uname -a',
              startedAt: '2026-03-16T10:00:00.000Z',
              completedAt: '2026-03-16T10:00:01.000Z',
            },
          ],
        },
      ],
    });

    await sessionSync.hydrateFromLocal();

    const msgs = messageStore.useMessageStore.getState().messagesByTask['task-tools'];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].toolCalls).toEqual([
      expect.objectContaining({ id: 'exec-1', name: 'exec', status: 'done', result: 'uname -a' }),
    ]);
  });

  it('persists tool calls when syncing assistant messages', async () => {
    const { sessionSync, taskStore, messageStore } = await loadModules();

    taskStore.useTaskStore.setState({ tasks: [], activeTaskId: null, hydrated: false });
    messageStore.useMessageStore.setState({
      messagesByTask: {},
      activeTurnBySession: {},
      processingBySession: new Set(),
      highlightedMessageId: null,
    });

    window.clawwork.syncSessions.mockResolvedValue({
      ok: true,
      discovered: [
        {
          gatewayId: 'gw-1',
          taskId: 'task-persist-tools',
          sessionKey: 'agent:main:clawwork:task:task-persist-tools',
          title: 'Persist tools',
          updatedAt: '2026-03-16T10:00:03.000Z',
          agentId: 'main',
          model: 'model-1',
          modelProvider: 'openclaw',
          thinkingLevel: 'medium',
          inputTokens: 1,
          outputTokens: 2,
          contextTokens: 3,
          messages: [
            { role: 'user', content: '读 CPU', timestamp: '2026-03-16T10:00:00.000Z', toolCalls: [] },
            {
              role: 'assistant',
              content: 'CPU info',
              timestamp: '2026-03-16T10:00:01.000Z',
              toolCalls: [
                {
                  id: 'exec-1',
                  name: 'exec',
                  status: 'done',
                  result: 'uname -a',
                  startedAt: '2026-03-16T10:00:00.500Z',
                  completedAt: '2026-03-16T10:00:01.000Z',
                },
              ],
            },
          ],
        },
      ],
    });

    await sessionSync.syncFromGateway();

    expect(window.clawwork.persistMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-persist-tools',
        role: 'assistant',
        toolCalls: [expect.objectContaining({ id: 'exec-1', name: 'exec', status: 'done' })],
      }),
    );
  });
});
