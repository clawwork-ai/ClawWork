import type { Message, MessageRole, ToolCall, IpcResult } from '@clawwork/shared';
import type { RawHistoryMessage } from '../protocol/types.js';
import type { ActiveTurn, MessageState } from '../stores/message-store.js';
import { mergeCanonicalMessageWithActiveTurn } from '../stores/message-store.js';
import { sanitizeModel, normalizeAssistantTurns, collapseDiscoveredMessages } from '../protocol/normalize-history.js';

export interface SessionSyncDeps {
  persistence: {
    loadMessages: (taskId: string) => Promise<{
      ok: boolean;
      rows?: {
        id: string;
        taskId: string;
        role: string;
        content: string;
        timestamp: string;
        imageAttachments?: unknown[];
        toolCalls?: unknown[];
      }[];
    }>;
    persistMessage: (msg: {
      id: string;
      taskId: string;
      role: string;
      content: string;
      timestamp: string;
      imageAttachments?: unknown[];
      toolCalls?: unknown[];
    }) => Promise<IpcResult>;
  };
  gateway: {
    chatHistory: (gatewayId: string, sessionKey: string, limit?: number) => Promise<IpcResult>;
    syncSessions: () => Promise<{
      ok: boolean;
      discovered?: {
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
        messages: { role: string; content: string; timestamp: string; toolCalls?: ToolCall[] }[];
      }[];
    }>;
  };
  getTaskStore: () => {
    tasks: { id: string; gatewayId: string; sessionKey: string }[];
    hydrate: () => Promise<void>;
    adoptTasks: (
      discovered: {
        taskId: string;
        sessionKey: string;
        title: string;
        updatedAt: string;
        gatewayId: string;
        agentId?: string;
        model?: string;
        modelProvider?: string;
        thinkingLevel?: string;
        inputTokens?: number;
        outputTokens?: number;
        contextTokens?: number;
      }[],
    ) => void;
    updateTaskMetadata: (
      id: string,
      meta: {
        model?: string;
        modelProvider?: string;
        thinkingLevel?: string;
        inputTokens?: number;
        outputTokens?: number;
        contextTokens?: number;
      },
    ) => void;
  };
  getMessageStore: () => Pick<
    MessageState,
    'messagesByTask' | 'activeTurnByTask' | 'bulkLoad' | 'promoteActiveTurn' | 'clearActiveTurn'
  > & {
    setState: (
      updater: (state: {
        messagesByTask: Record<string, Message[]>;
      }) => Partial<{ messagesByTask: Record<string, Message[]> }>,
    ) => void;
  };
}

const RETRY_DELAYS = [2000, 4000, 8000];

export function createSessionSync(deps: SessionSyncDeps) {
  let hydrationPromise: Promise<void> | null = null;
  const syncChains = new Map<string, Promise<void>>();

  async function hydrateFromLocal(): Promise<void> {
    if (!hydrationPromise) {
      hydrationPromise = (async () => {
        const taskStore = deps.getTaskStore();
        const messageStore = deps.getMessageStore();
        await taskStore.hydrate();
        const tasks = deps.getTaskStore().tasks;
        for (const t of tasks) {
          try {
            const res = await deps.persistence.loadMessages(t.id);
            if (res.ok && res.rows && res.rows.length > 0) {
              const msgs: Message[] = res.rows.map((r) => ({
                id: r.id,
                taskId: r.taskId,
                role: r.role as MessageRole,
                content: r.content,
                artifacts: [],
                toolCalls: Array.isArray(r.toolCalls) ? (r.toolCalls as ToolCall[]) : [],
                timestamp: r.timestamp,
                imageAttachments: r.imageAttachments as Message['imageAttachments'],
              }));
              messageStore.bulkLoad(t.id, msgs);
            }
          } catch {}
        }
      })();
    }
    await hydrationPromise;
  }

  async function doSyncSession(taskId: string): Promise<void> {
    const task = deps.getTaskStore().tasks.find((t) => t.id === taskId);
    if (!task?.gatewayId || !task?.sessionKey) return;

    const res = await deps.gateway.chatHistory(task.gatewayId, task.sessionKey);
    if (!res.ok || !res.result) return;

    const raw = res.result as { messages?: RawHistoryMessage[] };
    const rawMsgs = raw.messages ?? [];

    const messageStore = deps.getMessageStore();
    const localMsgs = messageStore.messagesByTask[taskId] ?? [];
    const localAssistantTimestamps = new Set(localMsgs.filter((m) => m.role === 'assistant').map((m) => m.timestamp));

    const gatewayAssistant = normalizeAssistantTurns(rawMsgs);

    const newest = gatewayAssistant.filter((m) => !localAssistantTimestamps.has(m.timestamp));
    if (newest.length === 0) {
      messageStore.clearActiveTurn(taskId);
      return;
    }

    for (let i = 0; i < newest.length; i++) {
      const gm = newest[i];
      const canonical: Message = {
        id: crypto.randomUUID(),
        taskId,
        role: 'assistant',
        content: gm.content,
        artifacts: [],
        toolCalls: gm.toolCalls,
        timestamp: gm.timestamp,
      };
      const currentStore = deps.getMessageStore();
      const mergedCanonical = mergeCanonicalMessageWithActiveTurn(canonical, currentStore.activeTurnByTask[taskId]);

      if (i === newest.length - 1) {
        currentStore.promoteActiveTurn(taskId, canonical);
      } else {
        currentStore.setState((s) => ({
          messagesByTask: {
            ...s.messagesByTask,
            [taskId]: [...(s.messagesByTask[taskId] ?? []), mergedCanonical],
          },
        }));
      }

      deps.persistence
        .persistMessage({
          id: mergedCanonical.id,
          taskId,
          role: 'assistant',
          content: mergedCanonical.content,
          timestamp: mergedCanonical.timestamp,
          toolCalls: mergedCanonical.toolCalls,
        })
        .catch(() => {});
    }
  }

  function syncSessionMessages(taskId: string): Promise<void> {
    const prev = syncChains.get(taskId) ?? Promise.resolve();
    const job = prev.then(() => syncWithRetry(taskId));
    syncChains.set(
      taskId,
      job.catch(() => {}),
    );
    return job;
  }

  async function syncWithRetry(taskId: string): Promise<void> {
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        await doSyncSession(taskId);
        return;
      } catch {
        if (attempt < RETRY_DELAYS.length) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        }
      }
    }
    console.warn('[sync] syncSessionMessages exhausted retries for task', taskId);
  }

  function retrySyncPending(): void {
    const turns = deps.getMessageStore().activeTurnByTask;
    for (const [taskId, turn] of Object.entries(turns)) {
      if ((turn as ActiveTurn).finalized) {
        syncSessionMessages(taskId).catch(() => {});
      }
    }
  }

  async function syncFromGateway(): Promise<void> {
    try {
      await hydrateFromLocal();
      const res = await deps.gateway.syncSessions();
      if (!res.ok || !res.discovered) return;
      const taskStore = deps.getTaskStore();
      const messageStore = deps.getMessageStore();
      const discovered = res.discovered.map((d) => ({ ...d, model: sanitizeModel(d.model) }));
      taskStore.adoptTasks(discovered);

      for (const d of discovered) {
        const collapsedMessages = collapseDiscoveredMessages(
          d.messages.map((message: { role: string; content: string; timestamp: string; toolCalls?: ToolCall[] }) => ({
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
            toolCalls: message.toolCalls,
          })),
          d.taskId,
        );

        taskStore.updateTaskMetadata(d.taskId, {
          model: d.model,
          modelProvider: d.modelProvider,
          thinkingLevel: d.thinkingLevel,
          inputTokens: d.inputTokens,
          outputTokens: d.outputTokens,
          contextTokens: d.contextTokens,
        });
        if (collapsedMessages.length === 0) continue;

        const local = messageStore.messagesByTask[d.taskId] ?? [];
        const hasLocalData = local.length > 0;

        if (hasLocalData) {
          const localTimestamps = new Set(local.filter((m) => m.role === 'assistant').map((m) => m.timestamp));
          const newAssistantMsgs = collapsedMessages.filter(
            (message) => message.role === 'assistant' && !localTimestamps.has(message.timestamp),
          );
          if (newAssistantMsgs.length === 0) continue;

          const mapped: Message[] = newAssistantMsgs.map((message) => ({
            ...message,
            id: crypto.randomUUID(),
          }));
          const merged = [...local, ...mapped].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
          messageStore.bulkLoad(d.taskId, merged);
          for (const msg of mapped) {
            deps.persistence
              .persistMessage({
                id: msg.id,
                taskId: msg.taskId,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                toolCalls: msg.toolCalls,
              })
              .catch(() => {});
          }
        } else {
          const mapped: Message[] = collapsedMessages.map((message) => ({
            ...message,
            id: crypto.randomUUID(),
          }));
          messageStore.bulkLoad(d.taskId, mapped);
          for (const msg of mapped) {
            deps.persistence
              .persistMessage({
                id: msg.id,
                taskId: msg.taskId,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                toolCalls: msg.toolCalls,
              })
              .catch(() => {});
          }
        }
      }
    } catch {
      console.warn('[sync] Gateway session sync failed');
    }
  }

  return { hydrateFromLocal, syncSessionMessages, syncFromGateway, retrySyncPending };
}
