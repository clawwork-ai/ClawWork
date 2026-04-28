import { parseAgentIdFromSessionKey, parseTaskIdFromSessionKey } from '@clawwork/shared';
import type { Message, MessageRole, ToolCall, IpcResult } from '@clawwork/shared';
import type { RawHistoryMessage } from '../protocol/types.js';
import type { ActiveTurn, MessageState } from '../stores/message-store.js';
import { mergeCanonicalMessageWithActiveTurn } from '../stores/message-store.js';
import {
  sanitizeModel,
  normalizeContentBlocks,
  normalizeAssistantTurns,
  collapseDiscoveredMessages,
  mergeMessageAttachments,
} from '../protocol/normalize-history.js';

type DiscoveredSyncMessage = {
  role: string;
  content: string;
  timestamp: string;
  attachments?: unknown[];
  toolCalls?: ToolCall[];
};

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
        sessionKey?: string;
        agentId?: string;
        runId?: string;
        attachments?: unknown[];
        toolCalls?: unknown[];
      }[];
    }>;
    persistMessage: (msg: {
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
        messages: DiscoveredSyncMessage[];
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
    'messagesByTask' | 'activeTurnBySession' | 'bulkLoad' | 'promoteActiveTurn' | 'clearActiveTurn'
  > & {
    setState: (
      updater: (state: {
        messagesByTask: Record<string, Message[]>;
      }) => Partial<{ messagesByTask: Record<string, Message[]> }>,
    ) => void;
  };
}

const RETRY_DELAYS = [2000, 4000, 8000];

function normalizeLocalAssistantMessage(row: { role: string; content: string; attachments?: unknown[] }): {
  content: string;
  attachments?: Message['attachments'];
} {
  const existingAttachments = Array.isArray(row.attachments) ? (row.attachments as Message['attachments']) : undefined;
  if (row.role !== 'assistant') return { content: row.content, attachments: existingAttachments };
  const normalized = normalizeContentBlocks([{ type: 'text', text: row.content }]);
  return {
    content: normalized.content,
    attachments: mergeMessageAttachments(existingAttachments, normalized.attachments),
  };
}

export function createSessionSync(deps: SessionSyncDeps) {
  let hydrationPromise: Promise<void> | null = null;
  const syncChains = new Map<string, Promise<void>>();

  function persistCanonicalMessage(message: Message): void {
    deps.persistence
      .persistMessage({
        id: message.id,
        taskId: message.taskId,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        sessionKey: message.sessionKey,
        agentId: message.agentId,
        runId: message.runId,
        attachments: message.attachments as unknown[] | undefined,
        toolCalls: message.toolCalls,
      })
      .catch((err) => console.error('[session-sync] persistMessage failed:', err));
  }

  function backfillAssistantAttachments(
    taskId: string,
    sessionKey: string,
    incoming: Array<{ timestamp: string; attachments?: Message['attachments'] }>,
  ): void {
    const withAttachments = incoming.filter((message) => message.attachments?.length);
    if (withAttachments.length === 0) return;

    const byTimestamp = new Map(withAttachments.map((message) => [message.timestamp, message]));
    const updated: Message[] = [];

    deps.getMessageStore().setState((s) => {
      const messages = s.messagesByTask[taskId] ?? [];
      let changed = false;
      const next = messages.map((message) => {
        if (message.role !== 'assistant') return message;
        if ((message.sessionKey ?? sessionKey) !== sessionKey) return message;
        const match = byTimestamp.get(message.timestamp);
        if (!match?.attachments?.length) return message;

        const merged = mergeMessageAttachments(message.attachments, match.attachments);
        if ((merged?.length ?? 0) === (message.attachments?.length ?? 0)) return message;

        changed = true;
        const nextMessage = { ...message, attachments: merged };
        updated.push(nextMessage);
        return nextMessage;
      });

      return changed ? { messagesByTask: { ...s.messagesByTask, [taskId]: next } } : {};
    });

    for (const message of updated) {
      persistCanonicalMessage(message);
    }
  }

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
              const msgs: Message[] = res.rows.map((r) => {
                const normalized = normalizeLocalAssistantMessage(r);
                return {
                  id: r.id,
                  taskId: r.taskId,
                  role: r.role as MessageRole,
                  content: normalized.content,
                  artifacts: [],
                  toolCalls: Array.isArray(r.toolCalls) ? (r.toolCalls as ToolCall[]) : [],
                  timestamp: r.timestamp,
                  sessionKey: r.sessionKey,
                  agentId: r.agentId,
                  runId: r.runId,
                  attachments: normalized.attachments,
                };
              });
              messageStore.bulkLoad(t.id, msgs);
            }
          } catch (err) {
            console.warn('[sync] hydrateFromLocal failed for task', t.id, err);
          }
        }
      })().catch((err) => {
        hydrationPromise = null;
        throw err;
      });
    }
    await hydrationPromise;
  }

  async function doSyncSession(taskId: string, sessionKeyOverride?: string): Promise<void> {
    const task = deps.getTaskStore().tasks.find((t) => t.id === taskId);
    const sessionKey = sessionKeyOverride ?? task?.sessionKey;
    if (!task?.gatewayId || !sessionKey) return;

    const res = await deps.gateway.chatHistory(task.gatewayId, sessionKey);
    if (!res.ok || !res.result) return;

    const raw = res.result as { messages?: RawHistoryMessage[] };
    const rawMsgs = raw.messages ?? [];

    const messageStore = deps.getMessageStore();
    const localMsgs = messageStore.messagesByTask[taskId] ?? [];
    const localAssistantMsgs = localMsgs.filter((m) => m.role === 'assistant');
    const localAssistantKeys = new Set(
      localAssistantMsgs.map((m) => `${m.sessionKey ?? task.sessionKey}|${m.timestamp}`),
    );
    const latestLocalAssistantTimestamp = localAssistantMsgs.reduce<string | undefined>(
      (latest, message) => (!latest || message.timestamp > latest ? message.timestamp : latest),
      undefined,
    );

    const gatewayAssistant = normalizeAssistantTurns(rawMsgs);
    backfillAssistantAttachments(taskId, sessionKey, gatewayAssistant);

    const newest = gatewayAssistant.filter(
      (m) =>
        !localAssistantKeys.has(`${sessionKey}|${m.timestamp}`) &&
        (!latestLocalAssistantTimestamp || m.timestamp > latestLocalAssistantTimestamp),
    );
    if (newest.length === 0) {
      messageStore.clearActiveTurn(sessionKey);
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
        attachments: gm.attachments,
        sessionKey,
        agentId: parseAgentIdFromSessionKey(sessionKey),
        timestamp: gm.timestamp,
      };
      const currentStore = deps.getMessageStore();
      const mergedCanonical = mergeCanonicalMessageWithActiveTurn(
        canonical,
        currentStore.activeTurnBySession[sessionKey],
      );

      if (i === newest.length - 1) {
        currentStore.promoteActiveTurn(sessionKey, taskId, canonical);
      } else {
        currentStore.setState((s) => ({
          messagesByTask: {
            ...s.messagesByTask,
            [taskId]: [...(s.messagesByTask[taskId] ?? []), mergedCanonical],
          },
        }));
      }

      persistCanonicalMessage(mergedCanonical);
    }
  }

  function syncSessionMessages(taskId: string, sessionKeyOverride?: string): Promise<void> {
    const chainKey = sessionKeyOverride ?? deps.getTaskStore().tasks.find((t) => t.id === taskId)?.sessionKey ?? taskId;
    const prev = syncChains.get(chainKey) ?? Promise.resolve();
    const job = prev.then(() => syncWithRetry(taskId, sessionKeyOverride));
    const settled = job
      .catch(() => {})
      .finally(() => {
        if (syncChains.get(chainKey) === settled) syncChains.delete(chainKey);
      });
    syncChains.set(chainKey, settled);
    return job;
  }

  async function syncWithRetry(taskId: string, sessionKeyOverride?: string): Promise<void> {
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        await doSyncSession(taskId, sessionKeyOverride);
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
    const turns = deps.getMessageStore().activeTurnBySession;
    for (const [sessionKey, turn] of Object.entries(turns)) {
      if ((turn as ActiveTurn).finalized) {
        const taskId = parseTaskIdFromSessionKey(sessionKey);
        if (taskId) syncSessionMessages(taskId, sessionKey).catch(() => {});
      }
    }
  }

  function loadAndPersistMessages(params: {
    taskId: string;
    messages: Message[];
    sessionKey: string;
    agentId?: string;
    existingMessages?: Message[];
  }): void {
    const mapped: Message[] = params.messages.map((message) => ({
      ...message,
      id: crypto.randomUUID(),
      sessionKey: message.role === 'assistant' ? params.sessionKey : undefined,
      agentId: message.role === 'assistant' ? params.agentId : undefined,
    }));
    const nextMessages = params.existingMessages
      ? [...params.existingMessages, ...mapped].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      : mapped;

    deps.getMessageStore().bulkLoad(params.taskId, nextMessages);

    for (const msg of mapped) {
      persistCanonicalMessage(msg);
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
          d.messages.map((message: DiscoveredSyncMessage) => ({
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
            attachments: message.attachments as Message['attachments'],
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
          backfillAssistantAttachments(
            d.taskId,
            d.sessionKey,
            collapsedMessages.filter((message) => message.role === 'assistant'),
          );
          const localTimestamps = new Set(local.filter((m) => m.role === 'assistant').map((m) => m.timestamp));
          const newAssistantMsgs = collapsedMessages.filter(
            (message) => message.role === 'assistant' && !localTimestamps.has(message.timestamp),
          );
          if (newAssistantMsgs.length === 0) continue;

          loadAndPersistMessages({
            taskId: d.taskId,
            messages: newAssistantMsgs,
            sessionKey: d.sessionKey,
            agentId: d.agentId,
            existingMessages: local,
          });
        } else {
          loadAndPersistMessages({
            taskId: d.taskId,
            messages: collapsedMessages,
            sessionKey: d.sessionKey,
            agentId: d.agentId,
          });
        }
      }
    } catch {
      console.warn('[sync] Gateway session sync failed');
    }
  }

  return { hydrateFromLocal, syncSessionMessages, syncFromGateway, retrySyncPending };
}
