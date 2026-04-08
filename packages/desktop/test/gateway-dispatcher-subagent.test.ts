import { describe, expect, it, vi } from 'vitest';
import { createGatewayDispatcher } from '@clawwork/core';
import type { GatewayDispatcherDeps } from '@clawwork/core';
import type { GatewayEvent } from '@clawwork/core/ports/gateway-transport';

type EventListener = (data: GatewayEvent) => void;

function createHarness(
  overrides?: Partial<{
    tasks: GatewayDispatcherDeps extends { getTaskStore: () => infer T } ? ReturnType<() => T>['tasks'] : never;
    lookupTaskIdBySubagentKey: (key: string) => string | undefined;
  }>,
) {
  let listener: EventListener | null = null;

  const tasks = overrides?.tasks ?? [];
  const systemMessages: Array<{ taskId: string; content: string }> = [];
  const toasts: Array<{ type: string; title: string }> = [];
  const performerCandidates: Array<{ taskId: string; sessionKey: string; gatewayId: string }> = [];
  const subagentCandidates: Array<{ sessionKey: string; gatewayId: string }> = [];

  const messageStore = {
    messagesByTask: {} as Record<string, unknown[]>,
    activeTurnBySession: {} as Record<string, unknown>,
    addMessage: vi.fn((_taskId: string, _role: string, content: string) => {
      systemMessages.push({ taskId: _taskId, content });
      return { id: 'msg-1', taskId: _taskId, role: _role, content, artifacts: [], toolCalls: [], timestamp: '' };
    }),
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
      tasks,
      updateTaskTitle: vi.fn(),
    }),
    getMessageStore: () => messageStore,
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
    onPerformerCandidate: vi.fn((taskId, sessionKey, gatewayId) => {
      performerCandidates.push({ taskId, sessionKey, gatewayId });
    }),
    lookupTaskIdBySubagentKey: overrides?.lookupTaskIdBySubagentKey ?? (() => undefined),
    onSubagentCandidate: vi.fn((sessionKey, gatewayId) => {
      subagentCandidates.push({ sessionKey, gatewayId });
    }),
    onToast: vi.fn((type, title) => {
      toasts.push({ type, title });
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

  return { emit, deps, systemMessages, toasts, performerCandidates, subagentCandidates, messageStore };
}

describe('sessions.changed subagent routing', () => {
  it('registers performer when sessions.changed arrives with spawnedBy pointing to a task session', () => {
    const h = createHarness({
      tasks: [
        {
          id: 'task-1',
          title: 'Ensemble task',
          gatewayId: 'gw-1',
          sessionKey: 'agent:conductor:clawwork:task:task-1',
          ensemble: true,
        },
      ],
    });

    h.emit('sessions.changed', {
      sessionKey: 'agent:coder:subagent:aaaa0000-bbbb-cccc-dddd-eeee00001111',
      spawnedBy: 'agent:conductor:clawwork:task:task-1',
      phase: 'start',
    });

    expect(h.performerCandidates).toEqual([
      { taskId: 'task-1', sessionKey: 'agent:coder:subagent:aaaa0000-bbbb-cccc-dddd-eeee00001111', gatewayId: 'gw-1' },
    ]);
  });

  it('resolves nested subagent via lookupTaskIdBySubagentKey when spawnedBy is a parent subagent key', () => {
    const subagentMap: Record<string, string> = {
      'agent:coder:subagent:a0a0a0a0-1111-2222-3333-444444444444': 'task-1',
    };
    const h = createHarness({
      tasks: [
        {
          id: 'task-1',
          title: 'Ensemble task',
          gatewayId: 'gw-1',
          sessionKey: 'agent:conductor:clawwork:task:task-1',
          ensemble: true,
        },
      ],
      lookupTaskIdBySubagentKey: (key) => subagentMap[key],
    });

    h.emit('sessions.changed', {
      sessionKey: 'agent:writer:subagent:b0b0b0b0-5555-6666-7777-888888888888',
      spawnedBy: 'agent:coder:subagent:a0a0a0a0-1111-2222-3333-444444444444',
      phase: 'start',
    });

    expect(h.performerCandidates).toEqual([
      { taskId: 'task-1', sessionKey: 'agent:writer:subagent:b0b0b0b0-5555-6666-7777-888888888888', gatewayId: 'gw-1' },
    ]);
  });

  it('ignores sessions.changed for non-subagent session keys', () => {
    const h = createHarness({
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          gatewayId: 'gw-1',
          sessionKey: 'agent:main:clawwork:task:task-1',
          ensemble: true,
        },
      ],
    });

    h.emit('sessions.changed', {
      sessionKey: 'agent:main:clawwork:task:task-1',
      spawnedBy: 'agent:main:clawwork:task:task-1',
      phase: 'start',
    });

    expect(h.performerCandidates).toEqual([]);
  });

  it('ignores sessions.changed for delete events', () => {
    const h = createHarness({
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          gatewayId: 'gw-1',
          sessionKey: 'agent:conductor:clawwork:task:task-1',
          ensemble: true,
        },
      ],
    });

    h.emit('sessions.changed', {
      sessionKey: 'agent:coder:subagent:aaaa0000-bbbb-cccc-dddd-eeee00001111',
      spawnedBy: 'agent:conductor:clawwork:task:task-1',
      reason: 'delete',
    });

    expect(h.performerCandidates).toEqual([]);
  });

  it('ignores sessions.changed when spawnedBy is missing', () => {
    const h = createHarness({
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          gatewayId: 'gw-1',
          sessionKey: 'agent:conductor:clawwork:task:task-1',
          ensemble: true,
        },
      ],
    });

    h.emit('sessions.changed', {
      sessionKey: 'agent:coder:subagent:aaaa0000-bbbb-cccc-dddd-eeee00001111',
      phase: 'start',
    });

    expect(h.performerCandidates).toEqual([]);
  });

  it('ignores sessions.changed for non-ensemble tasks', () => {
    const h = createHarness({
      tasks: [
        {
          id: 'task-1',
          title: 'Single agent task',
          gatewayId: 'gw-1',
          sessionKey: 'agent:main:clawwork:task:task-1',
        },
      ],
    });

    h.emit('sessions.changed', {
      sessionKey: 'agent:coder:subagent:aaaa0000-bbbb-cccc-dddd-eeee00001111',
      spawnedBy: 'agent:main:clawwork:task:task-1',
      phase: 'start',
    });

    expect(h.performerCandidates).toEqual([]);
  });
});

describe('subagent terminated error suppression', () => {
  it('suppresses "terminated" error for subagent sessions', () => {
    const subagentMap: Record<string, string> = {
      'agent:coder:subagent:aaaa0000-bbbb-cccc-dddd-eeee00001111': 'task-1',
    };
    const h = createHarness({
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          gatewayId: 'gw-1',
          sessionKey: 'agent:conductor:clawwork:task:task-1',
          ensemble: true,
        },
      ],
      lookupTaskIdBySubagentKey: (key) => subagentMap[key],
    });

    h.emit('chat', {
      sessionKey: 'agent:coder:subagent:aaaa0000-bbbb-cccc-dddd-eeee00001111',
      state: 'error',
      errorMessage: 'terminated',
    });

    expect(h.systemMessages).toEqual([]);
    expect(h.toasts).toEqual([]);
  });

  it('displays non-terminated errors for subagent sessions', () => {
    const subagentMap: Record<string, string> = {
      'agent:coder:subagent:aaaa0000-bbbb-cccc-dddd-eeee00001111': 'task-1',
    };
    const h = createHarness({
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          gatewayId: 'gw-1',
          sessionKey: 'agent:conductor:clawwork:task:task-1',
          ensemble: true,
        },
      ],
      lookupTaskIdBySubagentKey: (key) => subagentMap[key],
    });

    h.emit('chat', {
      sessionKey: 'agent:coder:subagent:aaaa0000-bbbb-cccc-dddd-eeee00001111',
      state: 'error',
      errorMessage: 'rate limit exceeded',
    });

    expect(h.systemMessages.length).toBe(1);
    expect(h.toasts.length).toBe(1);
  });

  it('displays "terminated" error for non-subagent sessions', () => {
    const h = createHarness({
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          gatewayId: 'gw-1',
          sessionKey: 'agent:main:clawwork:task:task-1',
        },
      ],
    });

    h.emit('chat', {
      sessionKey: 'agent:main:clawwork:task:task-1',
      state: 'error',
      errorMessage: 'terminated',
    });

    expect(h.systemMessages.length).toBe(1);
    expect(h.toasts.length).toBe(1);
  });
});
