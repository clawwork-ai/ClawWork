import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGatewayDispatcher, type GatewayDispatcherDeps } from '../src/services/gateway-dispatcher.js';
import type { GatewayEvent } from '../src/ports/gateway-transport.js';

type EventListener = (data: GatewayEvent) => void;

const TASK = {
  id: 'task-1',
  title: 'Task',
  gatewayId: 'gw-1',
  sessionKey: 'agent:main:clawwork:task:task-1',
};

const DEDUP_FALLBACK_WINDOW_MS = 2000;

function createHarness() {
  let listener: EventListener | null = null;

  const systemMessages: Array<{ taskId: string; content: string; sessionKey?: string }> = [];
  const toasts: Array<{ type: string; title: string; description?: string }> = [];

  const messageStore = {
    messagesByTask: {} as Record<string, unknown[]>,
    activeTurnBySession: {} as Record<string, unknown>,
    addMessage: vi.fn(
      (taskId: string, _role: string, content: string, _attachments?: unknown, options?: { sessionKey?: string }) => {
        systemMessages.push({ taskId, content, sessionKey: options?.sessionKey });
        return { id: 'msg-1', taskId, role: _role, content, artifacts: [], toolCalls: [], timestamp: '' };
      },
    ),
    upsertToolCall: vi.fn(),
    appendStreamDelta: vi.fn(),
    appendThinkingDelta: vi.fn(),
    finalizeStream: vi.fn(),
    clearActiveTurn: vi.fn(),
    setProcessing: vi.fn(),
  };

  const deps: GatewayDispatcherDeps = {
    gateway: {
      onGatewayEvent: (cb: EventListener) => {
        listener = cb;
        return () => {
          listener = null;
        };
      },
      onGatewayStatus: () => () => {},
      gatewayStatus: async () => ({}),
      listGateways: async () => [],
      listModels: async () => ({ ok: true, result: {} }),
      listAgents: async () => ({ ok: true, result: {} }),
      getToolsCatalog: async () => ({ ok: true, result: {} }),
      getSkillsStatus: async () => ({ ok: true, result: {} }),
      chatHistory: async () => ({ ok: true, result: {} }),
      abortChat: async () => ({ ok: true }),
      patchSession: async () => ({ ok: true }),
      listSessionsBySpawner: async () => ({ ok: true }),
      syncSessions: async () => ({ ok: true }),
      sendMessage: async () => ({ ok: true }),
      createSession: async () => ({ ok: true }),
    } as unknown as GatewayDispatcherDeps['gateway'],
    getSettings: async () => null,
    sendNotification: async () => {},
    getTaskStore: () => ({
      tasks: [TASK],
      updateTaskTitle: vi.fn(),
    }),
    getMessageStore: () => messageStore as unknown as ReturnType<GatewayDispatcherDeps['getMessageStore']>,
    getActiveTaskId: () => null,
    markUnread: vi.fn(),
    setGatewayStatusByGateway: vi.fn(),
    setGatewayVersion: vi.fn(),
    setGatewayReconnectInfo: vi.fn(),
    setDefaultGatewayId: vi.fn(),
    setGatewayInfoMap: vi.fn(),
    setGatewaysLoaded: vi.fn(),
    getGatewayInfoMap: () => ({}),
    setModelCatalogForGateway: vi.fn(),
    setAgentCatalogForGateway: vi.fn(),
    setToolsCatalogForGateway: vi.fn(),
    setSkillsStatusForGateway: vi.fn(),
    setCommandCatalogForGateway: vi.fn(),
    onToast: vi.fn((type: string, title: string, opts?: { description?: string }) => {
      toasts.push({ type, title, description: opts?.description });
    }),
    translate: (key: string) => key,
    isWindowFocused: () => true,
    reportDebugEvent: vi.fn(),
    hydrateFromLocal: async () => {},
    syncFromGateway: async () => {},
    syncSessionMessages: vi.fn(async () => {}),
    retrySyncPending: vi.fn(),
  };

  const dispatcher = createGatewayDispatcher(deps);
  dispatcher.start();

  function emit(event: string, payload: Record<string, unknown>, gatewayId = 'gw-1') {
    listener?.({ event, payload, gatewayId });
  }

  return { emit, deps, systemMessages, toasts, messageStore };
}

function emitChatError(
  h: ReturnType<typeof createHarness>,
  opts: { errorMessage: string; errorCode?: string; runId?: string },
) {
  h.emit('chat', {
    sessionKey: TASK.sessionKey,
    state: 'error',
    errorMessage: opts.errorMessage,
    errorCode: opts.errorCode,
    runId: opts.runId,
  });
}

function emitLifecycleError(h: ReturnType<typeof createHarness>, error: string) {
  h.emit('agent', {
    sessionKey: TASK.sessionKey,
    stream: 'lifecycle',
    data: { phase: 'error', error },
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('isSameFailure — chat error dedup by runId / code + source', () => {
  it('suppresses a repeat error that shares taskId + code + source', () => {
    const h = createHarness();

    emitChatError(h, { errorMessage: 'rate limit exceeded', errorCode: 'rate_limit' });
    expect(h.systemMessages).toHaveLength(1);
    expect(h.toasts).toHaveLength(1);

    emitChatError(h, { errorMessage: 'rate limit exceeded again', errorCode: 'rate_limit' });
    expect(h.systemMessages).toHaveLength(1);
    expect(h.toasts).toHaveLength(1);
  });

  it('displays a follow-up error whose code differs', () => {
    const h = createHarness();

    emitChatError(h, { errorMessage: 'rate limit', errorCode: 'rate_limit' });
    expect(h.systemMessages).toHaveLength(1);

    emitChatError(h, { errorMessage: 'network down', errorCode: 'network_error' });
    expect(h.systemMessages).toHaveLength(2);
    expect(h.toasts).toHaveLength(2);
  });

  it('suppresses a repeat error that shares taskId + runId', () => {
    const h = createHarness();

    emitChatError(h, { errorMessage: 'first failure', runId: 'run-abc' });
    expect(h.systemMessages).toHaveLength(1);

    emitChatError(h, { errorMessage: 'second failure', runId: 'run-abc' });
    expect(h.systemMessages).toHaveLength(1);
    expect(h.toasts).toHaveLength(1);
  });

  it('displays a follow-up error whose runId differs', () => {
    const h = createHarness();

    emitChatError(h, { errorMessage: 'first failure', runId: 'run-abc' });
    expect(h.systemMessages).toHaveLength(1);

    emitChatError(h, { errorMessage: 'second failure', runId: 'run-xyz' });
    expect(h.systemMessages).toHaveLength(2);
    expect(h.toasts).toHaveLength(2);
  });
});

describe('shouldDisplayError — first error for a task, then an identical repeat', () => {
  it('displays the first error for a task, then suppresses an identical repeat', () => {
    vi.useFakeTimers();
    const h = createHarness();

    emitChatError(h, { errorMessage: 'something failed' });
    expect(h.systemMessages).toHaveLength(1);

    emitChatError(h, { errorMessage: 'something failed' });
    expect(h.systemMessages).toHaveLength(1);
    expect(h.toasts).toHaveLength(1);
  });
});

describe('DEDUP_FALLBACK_WINDOW_MS — 2000ms fallback window', () => {
  it('suppresses an identical rawMessage + source repeat inside the window, then re-displays after it elapses', () => {
    vi.useFakeTimers();
    const h = createHarness();

    emitChatError(h, { errorMessage: 'boom' });
    expect(h.systemMessages).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    emitChatError(h, { errorMessage: 'boom' });
    expect(h.systemMessages).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    emitChatError(h, { errorMessage: 'boom' });
    expect(h.systemMessages).toHaveLength(2);
  });
});

describe('agent lifecycle error buffer', () => {
  it('buffers a lifecycle error for the dedup window, then releases it as a system message', async () => {
    vi.useFakeTimers();
    const h = createHarness();

    emitLifecycleError(h, 'provider unavailable');
    expect(h.systemMessages).toHaveLength(0);
    expect(h.toasts).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(DEDUP_FALLBACK_WINDOW_MS - 1);
    expect(h.systemMessages).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(h.systemMessages).toHaveLength(1);
    expect(h.systemMessages[0].taskId).toBe('task-1');
    expect(h.systemMessages[0].sessionKey).toBe(TASK.sessionKey);
    expect(h.systemMessages[0].content).toContain('provider unavailable');
    expect(h.toasts).toHaveLength(1);
    expect(h.messageStore.addMessage).toHaveBeenCalledWith('task-1', 'system', expect.any(String), undefined, {
      sessionKey: TASK.sessionKey,
    });
  });

  it('clears the buffered lifecycle error when a chat error for the same task arrives first', async () => {
    vi.useFakeTimers();
    const h = createHarness();

    emitLifecycleError(h, 'provider unavailable');
    expect(h.systemMessages).toHaveLength(0);

    emitChatError(h, { errorMessage: 'upstream boom' });
    expect(h.systemMessages).toHaveLength(1);
    expect(h.systemMessages[0].content).toContain('upstream boom');

    await vi.advanceTimersByTimeAsync(DEDUP_FALLBACK_WINDOW_MS);
    expect(h.systemMessages).toHaveLength(1);
    expect(h.systemMessages.some((m) => m.content.includes('provider unavailable'))).toBe(false);
    expect(h.toasts).toHaveLength(1);
  });
});
