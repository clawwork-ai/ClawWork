import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadStore() {
  vi.resetModules();
  const module = await import('../src/renderer/stores/messageStore');
  return module;
}

function setupClawworkMock() {
  const windowWithClawwork = (globalThis.window ??= {} as typeof globalThis.window) as unknown as Window & {
    clawwork: {
      persistMessage: ReturnType<typeof vi.fn>;
    };
  };
  windowWithClawwork.clawwork = {
    persistMessage: vi.fn().mockResolvedValue({ ok: true }),
  } as unknown as typeof windowWithClawwork.clawwork;
}

function resetStoreState(
  useMessageStore: Awaited<ReturnType<typeof loadStore>>['useMessageStore'],
  overrides: Record<string, unknown> = {},
) {
  useMessageStore.setState({
    messagesByTask: {},
    activeTurnBySession: {},
    processingBySession: new Set(),
    highlightedMessageId: null,
    ...overrides,
  });
}

describe('message store tool call persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupClawworkMock();
  });

  it('persists tool status updates for the latest assistant message after promotion', async () => {
    const { useMessageStore } = await loadStore();

    useMessageStore.setState({
      messagesByTask: {
        'task-1': [
          {
            id: 'assistant-1',
            taskId: 'task-1',
            role: 'assistant',
            content: 'Done',
            artifacts: [],
            toolCalls: [
              {
                id: 'exec-1',
                name: 'exec',
                status: 'running',
                startedAt: '2026-03-16T10:00:00.000Z',
              },
            ],
            timestamp: '2026-03-16T10:00:01.000Z',
          },
        ],
      },
      activeTurnBySession: {},
      processingBySession: new Set(),
      highlightedMessageId: null,
    });

    useMessageStore.getState().upsertToolCall('agent:main:clawwork:task:task-1', 'task-1', {
      id: 'exec-1',
      name: 'exec',
      status: 'done',
      result: 'uname -a',
      startedAt: '2026-03-16T10:00:00.000Z',
      completedAt: '2026-03-16T10:00:02.000Z',
    });

    const saved = useMessageStore.getState().messagesByTask['task-1'][0];
    expect(saved.toolCalls).toEqual([expect.objectContaining({ id: 'exec-1', status: 'done', result: 'uname -a' })]);
    expect(window.clawwork.persistMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'assistant-1',
        taskId: 'task-1',
        role: 'assistant',
        toolCalls: [expect.objectContaining({ id: 'exec-1', status: 'done', result: 'uname -a' })],
      }),
    );
  });

  it('finalizes tool-call-only active turns', async () => {
    const { useMessageStore } = await loadStore();
    const sessionKey = 'agent:main:clawwork:task:task-1';

    useMessageStore.setState({
      messagesByTask: {},
      activeTurnBySession: {},
      processingBySession: new Set(),
      highlightedMessageId: null,
    });

    useMessageStore.getState().upsertToolCall(sessionKey, 'task-1', {
      id: 'exec-1',
      name: 'exec',
      status: 'done',
      startedAt: '2026-03-16T10:00:00.000Z',
      completedAt: '2026-03-16T10:00:02.000Z',
    });
    useMessageStore.getState().finalizeStream(sessionKey);

    expect(useMessageStore.getState().activeTurnBySession[sessionKey]).toEqual(
      expect.objectContaining({ finalized: true, toolCalls: [expect.objectContaining({ id: 'exec-1' })] }),
    );
    expect(window.clawwork.persistMessage).not.toHaveBeenCalled();
  });
});

describe('message store streaming lifecycle', () => {
  const sessionKey = 'agent:main:clawwork:task:task-1';
  const taskId = 'task-1';

  beforeEach(() => {
    vi.clearAllMocks();
    setupClawworkMock();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111');
  });

  describe('appendStreamDelta', () => {
    it('creates a new active turn when none exists and appends text', async () => {
      const { useMessageStore } = await loadStore();
      resetStoreState(useMessageStore);

      useMessageStore.getState().appendStreamDelta(sessionKey, 'Hello');

      const turn = useMessageStore.getState().activeTurnBySession[sessionKey];
      expect(turn).toEqual(
        expect.objectContaining({
          id: '11111111-1111-4111-8111-111111111111',
          streamingText: 'Hello',
          finalized: false,
        }),
      );
    });

    it('appends incremental text to an existing active turn', async () => {
      const { useMessageStore } = await loadStore();
      resetStoreState(useMessageStore, {
        activeTurnBySession: {
          [sessionKey]: {
            id: 'turn-existing',
            streamingText: 'Hello',
            streamingThinking: '',
            toolCalls: [],
            finalized: false,
            content: '',
            timestamp: '2026-03-16T10:00:00.000Z',
          },
        },
      });

      useMessageStore.getState().appendStreamDelta(sessionKey, ' world');

      expect(useMessageStore.getState().activeTurnBySession[sessionKey].streamingText).toBe('Hello world');
    });

    it('ignores empty deltas without changing accumulated text', async () => {
      const { useMessageStore } = await loadStore();
      resetStoreState(useMessageStore, {
        activeTurnBySession: {
          [sessionKey]: {
            id: 'turn-existing',
            streamingText: 'Hello',
            streamingThinking: '',
            toolCalls: [],
            finalized: false,
            content: '',
            timestamp: '2026-03-16T10:00:00.000Z',
          },
        },
      });

      useMessageStore.getState().appendStreamDelta(sessionKey, '');

      expect(useMessageStore.getState().activeTurnBySession[sessionKey].streamingText).toBe('Hello');
    });
  });

  describe('finalizeStream', () => {
    it('marks an active turn as finalized with streamed content', async () => {
      const { useMessageStore } = await loadStore();
      resetStoreState(useMessageStore, {
        activeTurnBySession: {
          [sessionKey]: {
            id: 'turn-finalize',
            streamingText: 'Complete reply',
            streamingThinking: 'thoughts',
            toolCalls: [],
            finalized: false,
            content: '',
            timestamp: '2026-03-16T10:00:00.000Z',
          },
        },
      });

      useMessageStore.getState().finalizeStream(sessionKey);

      expect(useMessageStore.getState().activeTurnBySession[sessionKey]).toEqual(
        expect.objectContaining({
          finalized: true,
          content: 'Complete reply',
          thinkingContent: 'thoughts',
          streamingText: '',
          streamingThinking: '',
        }),
      );
    });

    it('applies runId metadata when provided', async () => {
      const { useMessageStore } = await loadStore();
      resetStoreState(useMessageStore, {
        activeTurnBySession: {
          [sessionKey]: {
            id: 'turn-run',
            streamingText: 'Done',
            streamingThinking: '',
            toolCalls: [],
            finalized: false,
            content: '',
            timestamp: '2026-03-16T10:00:00.000Z',
          },
        },
      });

      useMessageStore.getState().finalizeStream(sessionKey, { runId: 'run-42' });

      expect(useMessageStore.getState().activeTurnBySession[sessionKey].runId).toBe('run-42');
    });

    it('is a no-op when no active turn exists', async () => {
      const { useMessageStore } = await loadStore();
      resetStoreState(useMessageStore);

      useMessageStore.getState().finalizeStream(sessionKey);

      expect(useMessageStore.getState().activeTurnBySession).toEqual({});
    });

    it('clears streaming buffers without finalizing when the turn has no content', async () => {
      const { useMessageStore } = await loadStore();
      resetStoreState(useMessageStore, {
        activeTurnBySession: {
          [sessionKey]: {
            id: 'turn-empty',
            streamingText: '',
            streamingThinking: '',
            toolCalls: [],
            finalized: false,
            content: '',
            timestamp: '2026-03-16T10:00:00.000Z',
          },
        },
      });

      useMessageStore.getState().finalizeStream(sessionKey);

      expect(useMessageStore.getState().activeTurnBySession[sessionKey]).toEqual(
        expect.objectContaining({
          finalized: false,
          streamingText: '',
          streamingThinking: '',
        }),
      );
    });
  });

  describe('promoteActiveTurn', () => {
    it('moves a finalized active turn into the message array with merged metadata', async () => {
      const { useMessageStore } = await loadStore();
      resetStoreState(useMessageStore, {
        activeTurnBySession: {
          [sessionKey]: {
            id: 'turn-promote',
            streamingText: '',
            streamingThinking: '',
            toolCalls: [
              {
                id: 'exec-1',
                name: 'exec',
                status: 'done',
                result: 'ok',
                startedAt: '2026-03-16T10:00:00.000Z',
                completedAt: '2026-03-16T10:00:01.000Z',
              },
            ],
            finalized: true,
            content: 'Merged reply',
            thinkingContent: 'Merged thought',
            runId: 'run-promote',
            timestamp: '2026-03-16T10:00:01.000Z',
          },
        },
      });

      useMessageStore.getState().promoteActiveTurn(sessionKey, taskId, {
        id: 'canonical-1',
        taskId,
        role: 'assistant',
        content: 'Merged reply',
        artifacts: [],
        toolCalls: [
          {
            id: 'exec-1',
            name: 'exec',
            status: 'running',
            startedAt: '2026-03-16T10:00:00.000Z',
          },
        ],
        timestamp: '2026-03-16T10:00:01.000Z',
      });

      const messages = useMessageStore.getState().messagesByTask[taskId];
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(
        expect.objectContaining({
          id: 'canonical-1',
          content: 'Merged reply',
          thinkingContent: 'Merged thought',
          runId: 'run-promote',
          toolCalls: [expect.objectContaining({ id: 'exec-1', status: 'done', result: 'ok' })],
        }),
      );
      expect(useMessageStore.getState().activeTurnBySession[sessionKey]).toBeUndefined();
    });

    it('promotes the canonical message safely when no active turn exists', async () => {
      const { useMessageStore } = await loadStore();
      resetStoreState(useMessageStore);

      useMessageStore.getState().promoteActiveTurn(sessionKey, taskId, {
        id: 'canonical-only',
        taskId,
        role: 'assistant',
        content: 'Canonical reply',
        artifacts: [],
        toolCalls: [],
        timestamp: '2026-03-16T10:00:02.000Z',
      });

      const messages = useMessageStore.getState().messagesByTask[taskId];
      expect(messages).toEqual([
        expect.objectContaining({
          id: 'canonical-only',
          content: 'Canonical reply',
        }),
      ]);
      expect(useMessageStore.getState().activeTurnBySession).toEqual({});
    });
  });
});

describe('message store upsertToolCall fallback chain', () => {
  const sessionKey = 'agent:main:clawwork:task:task-1';
  const taskId = 'task-1';

  beforeEach(() => {
    vi.clearAllMocks();
    setupClawworkMock();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('22222222-2222-4222-8222-222222222222');
  });

  it('updates tool calls on an existing active turn without persisting', async () => {
    const { useMessageStore } = await loadStore();
    resetStoreState(useMessageStore, {
      activeTurnBySession: {
        [sessionKey]: {
          id: 'turn-tool',
          streamingText: 'Working',
          streamingThinking: '',
          toolCalls: [
            {
              id: 'exec-1',
              name: 'exec',
              status: 'running',
              startedAt: '2026-03-16T10:00:00.000Z',
            },
          ],
          finalized: false,
          content: '',
          timestamp: '2026-03-16T10:00:00.000Z',
        },
      },
    });

    useMessageStore.getState().upsertToolCall(sessionKey, taskId, {
      id: 'exec-1',
      name: 'exec',
      status: 'done',
      result: 'finished',
      startedAt: '2026-03-16T10:00:00.000Z',
      completedAt: '2026-03-16T10:00:02.000Z',
    });

    expect(useMessageStore.getState().activeTurnBySession[sessionKey].toolCalls).toEqual([
      expect.objectContaining({ id: 'exec-1', status: 'done', result: 'finished' }),
    ]);
    expect(useMessageStore.getState().messagesByTask[taskId]).toBeUndefined();
    expect(window.clawwork.persistMessage).not.toHaveBeenCalled();
  });

  it('falls back to the latest assistant message after the latest user message', async () => {
    const { useMessageStore } = await loadStore();
    resetStoreState(useMessageStore, {
      messagesByTask: {
        [taskId]: [
          {
            id: 'user-1',
            taskId,
            role: 'user',
            content: 'Run command',
            artifacts: [],
            toolCalls: [],
            timestamp: '2026-03-16T10:00:00.000Z',
          },
          {
            id: 'assistant-1',
            taskId,
            role: 'assistant',
            content: 'Running',
            artifacts: [],
            toolCalls: [],
            timestamp: '2026-03-16T10:00:01.000Z',
          },
        ],
      },
    });

    useMessageStore.getState().upsertToolCall(sessionKey, taskId, {
      id: 'exec-1',
      name: 'exec',
      status: 'running',
      startedAt: '2026-03-16T10:00:02.000Z',
    });

    const assistant = useMessageStore.getState().messagesByTask[taskId][1];
    expect(assistant.toolCalls).toEqual([expect.objectContaining({ id: 'exec-1', status: 'running' })]);
    expect(window.clawwork.persistMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'assistant-1',
        toolCalls: [expect.objectContaining({ id: 'exec-1', status: 'running' })],
      }),
    );
  });

  it('creates a new active turn when the latest assistant predates the latest user message', async () => {
    const { useMessageStore } = await loadStore();
    resetStoreState(useMessageStore, {
      messagesByTask: {
        [taskId]: [
          {
            id: 'assistant-old',
            taskId,
            role: 'assistant',
            content: 'Old reply',
            artifacts: [],
            toolCalls: [],
            timestamp: '2026-03-16T10:00:00.000Z',
          },
          {
            id: 'user-1',
            taskId,
            role: 'user',
            content: 'Follow up',
            artifacts: [],
            toolCalls: [],
            timestamp: '2026-03-16T10:00:01.000Z',
          },
        ],
      },
    });

    useMessageStore.getState().upsertToolCall(sessionKey, taskId, {
      id: 'exec-1',
      name: 'exec',
      status: 'running',
      startedAt: '2026-03-16T10:00:02.000Z',
    });

    expect(useMessageStore.getState().activeTurnBySession[sessionKey]).toEqual(
      expect.objectContaining({
        id: '22222222-2222-4222-8222-222222222222',
        toolCalls: [expect.objectContaining({ id: 'exec-1', status: 'running' })],
      }),
    );
    expect(useMessageStore.getState().messagesByTask[taskId]).toHaveLength(2);
    expect(window.clawwork.persistMessage).not.toHaveBeenCalled();
  });
});
