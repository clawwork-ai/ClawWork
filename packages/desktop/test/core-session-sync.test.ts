import { describe, expect, it, vi } from 'vitest';
import { createSessionSync } from '@clawwork/core';
import type { Message } from '@clawwork/shared';

function createHarness(params: {
  tasks: Array<{ id: string; gatewayId: string; sessionKey: string }>;
  loadMessagesRows: Record<
    string,
    Array<{ id: string; taskId: string; role: string; content: string; timestamp: string }>
  >;
  discovered: Array<{
    gatewayId: string;
    taskId: string;
    sessionKey: string;
    title: string;
    updatedAt: string;
    agentId: string;
    model?: string;
    modelProvider?: string;
    thinkingLevel?: string;
    inputTokens?: number;
    outputTokens?: number;
    contextTokens?: number;
    messages: { role: string; content: string; timestamp: string; toolCalls?: Message['toolCalls'] }[];
  }>;
}) {
  const persisted: Array<{
    id: string;
    taskId: string;
    role: string;
    content: string;
    timestamp: string;
    sessionKey?: string;
    agentId?: string;
    runId?: string;
    attachments?: unknown[];
    toolCalls?: unknown[];
  }> = [];

  const taskStore = {
    tasks: [...params.tasks],
    hydrate: vi.fn(async () => {}),
    adoptTasks: vi.fn((discovered: typeof params.discovered) => {
      for (const task of discovered) {
        if (taskStore.tasks.some((existing) => existing.id === task.taskId)) continue;
        taskStore.tasks.push({
          id: task.taskId,
          gatewayId: task.gatewayId,
          sessionKey: task.sessionKey,
        });
      }
    }),
    updateTaskMetadata: vi.fn(() => {}),
  };

  const messageStore = {
    messagesByTask: {} as Record<string, Message[]>,
    activeTurnBySession: {},
    bulkLoad: vi.fn((taskId: string, messages: Message[]) => {
      messageStore.messagesByTask[taskId] = messages;
    }),
    promoteActiveTurn: vi.fn(),
    clearActiveTurn: vi.fn(),
    setState: vi.fn(
      (
        updater: (state: {
          messagesByTask: Record<string, Message[]>;
        }) => Partial<{ messagesByTask: Record<string, Message[]> }>,
      ) => {
        const patch = updater({ messagesByTask: messageStore.messagesByTask });
        if (patch.messagesByTask) messageStore.messagesByTask = patch.messagesByTask;
      },
    ),
  };

  const sessionSync = createSessionSync({
    persistence: {
      loadMessages: vi.fn(async (taskId: string) => ({ ok: true, rows: params.loadMessagesRows[taskId] ?? [] })),
      persistMessage: vi.fn(async (message) => {
        persisted.push(message);
        return { ok: true };
      }),
    },
    gateway: {
      chatHistory: vi.fn(async () => ({ ok: true, result: { messages: [] } })),
      syncSessions: vi.fn(async () => ({ ok: true, discovered: params.discovered })),
    },
    getTaskStore: () => taskStore,
    getMessageStore: () => messageStore,
  });

  return { sessionSync, taskStore, messageStore, persisted };
}

describe('core session sync startup flow', () => {
  it('persists only new assistant messages when local history already exists', async () => {
    const harness = createHarness({
      tasks: [
        {
          id: 'task-existing',
          gatewayId: 'gw-1',
          sessionKey: 'agent:main:clawwork:task:task-existing',
        },
      ],
      loadMessagesRows: {
        'task-existing': [
          {
            id: 'u1',
            taskId: 'task-existing',
            role: 'user',
            content: 'Hello',
            timestamp: '2026-03-16T10:00:00.000Z',
          },
        ],
      },
      discovered: [
        {
          gatewayId: 'gw-1',
          taskId: 'task-existing',
          sessionKey: 'agent:main:clawwork:task:task-existing',
          title: 'Existing task',
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

    await harness.sessionSync.syncFromGateway();

    expect(harness.messageStore.messagesByTask['task-existing'].map((message) => message.content)).toEqual([
      'Hello',
      'Hi!',
      'Hi again!',
    ]);
    expect(harness.persisted.map((message) => ({ role: message.role, content: message.content }))).toEqual([
      { role: 'assistant', content: 'Hi!' },
      { role: 'assistant', content: 'Hi again!' },
    ]);
  });

  it('loads and persists the full discovered history when no local messages exist', async () => {
    const harness = createHarness({
      tasks: [],
      loadMessagesRows: {},
      discovered: [
        {
          gatewayId: 'gw-1',
          taskId: 'task-fresh',
          sessionKey: 'agent:main:clawwork:task:task-fresh',
          title: 'Fresh task',
          updatedAt: '2026-03-16T10:00:01.000Z',
          agentId: 'main',
          messages: [
            { role: 'user', content: 'Draft me a note', timestamp: '2026-03-16T10:00:00.000Z' },
            {
              role: 'assistant',
              content: 'Sure',
              timestamp: '2026-03-16T10:00:01.000Z',
              toolCalls: [
                {
                  id: 'exec-1',
                  name: 'exec',
                  status: 'done',
                  startedAt: '2026-03-16T10:00:00.500Z',
                  completedAt: '2026-03-16T10:00:01.000Z',
                  result: 'ok',
                },
              ],
            },
          ],
        },
      ],
    });

    await harness.sessionSync.syncFromGateway();

    expect(
      harness.messageStore.messagesByTask['task-fresh'].map((message) => ({
        role: message.role,
        content: message.content,
        sessionKey: message.sessionKey,
      })),
    ).toEqual([
      { role: 'user', content: 'Draft me a note', sessionKey: undefined },
      { role: 'assistant', content: 'Sure', sessionKey: 'agent:main:clawwork:task:task-fresh' },
    ]);
    expect(
      harness.persisted.map((message) => ({
        role: message.role,
        content: message.content,
        sessionKey: message.sessionKey,
      })),
    ).toEqual([
      { role: 'user', content: 'Draft me a note', sessionKey: undefined },
      {
        role: 'assistant',
        content: 'Sure',
        sessionKey: 'agent:main:clawwork:task:task-fresh',
      },
    ]);
    expect(harness.persisted[1]).toEqual(
      expect.objectContaining({
        role: 'assistant',
        agentId: 'main',
        toolCalls: [expect.objectContaining({ id: 'exec-1', name: 'exec', status: 'done', result: 'ok' })],
      }),
    );
  });
});
