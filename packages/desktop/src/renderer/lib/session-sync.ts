import type { Message, MessageRole, ToolCall } from '@clawwork/shared';
import { useTaskStore } from '../stores/taskStore';
import { mergeCanonicalMessageWithActiveTurn, useMessageStore } from '../stores/messageStore';

const GATEWAY_INJECTED_MODEL = 'gateway-injected';
const INTERNAL_ASSISTANT_MARKERS = new Set(['NO_REPLY']);
let hydrationPromise: Promise<void> | null = null;

function sanitizeModel(model?: string): string | undefined {
  return model === GATEWAY_INJECTED_MODEL ? undefined : model;
}

function isVisibleAssistantContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length > 0 && !INTERNAL_ASSISTANT_MARKERS.has(trimmed);
}

const syncChains = new Map<string, Promise<void>>();
const RETRY_DELAYS = [2000, 4000, 8000];

export async function hydrateFromLocal(): Promise<void> {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      const { hydrate } = useTaskStore.getState();
      const { bulkLoad } = useMessageStore.getState();
      await hydrate();
      const tasks = useTaskStore.getState().tasks;
      for (const t of tasks) {
        try {
          const res = await window.clawwork.loadMessages(t.id);
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
            bulkLoad(t.id, msgs);
          }
        } catch {}
      }
    })();
  }
  await hydrationPromise;
}

interface RawContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  arguments?: Record<string, unknown> | string;
  result?: unknown;
}

interface RawHistoryMessage {
  role: string;
  content?: RawContentBlock[];
  timestamp?: number;
}

interface NormalizedAssistantTurn {
  content: string;
  toolCalls: ToolCall[];
  timestamp: string;
}

interface DiscoveredMessageShape {
  role: string;
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
}

function extractAssistantText(blocks: RawContentBlock[]): string {
  return blocks
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text!)
    .join('');
}

function toISOTimestamp(epoch: number | undefined): string {
  return epoch ? new Date(epoch).toISOString() : new Date().toISOString();
}

function appendSegment(base: string, segment: string): string {
  const trimmed = segment.trim();
  if (!trimmed) return base;
  if (!base) return trimmed;
  return `${base}\n\n${trimmed}`;
}

function safeJsonParse(raw: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function normalizeAssistantTurns(rawMsgs: RawHistoryMessage[]): NormalizedAssistantTurn[] {
  const toolResultMap = new Map<string, string>();
  for (const msg of rawMsgs) {
    if (msg.role !== 'toolResult') continue;
    for (const block of msg.content ?? []) {
      if (block.type === 'toolResult' && block.id && block.result !== undefined) {
        toolResultMap.set(block.id, typeof block.result === 'string' ? block.result : JSON.stringify(block.result));
      }
    }
  }

  const turns: NormalizedAssistantTurn[] = [];
  let current: NormalizedAssistantTurn | null = null;

  function ensureCurrent(timestamp: string): NormalizedAssistantTurn {
    if (!current) {
      current = { content: '', toolCalls: [], timestamp };
      turns.push(current);
    }
    return current;
  }

  for (const msg of rawMsgs) {
    if (msg.role === 'user') {
      current = null;
      continue;
    }
    if (msg.role !== 'assistant') continue;

    const timestamp = toISOTimestamp(msg.timestamp);
    const text = extractAssistantText(msg.content ?? []);
    const toolCalls = (msg.content ?? [])
      .filter((block) => block.type === 'toolCall' && block.id && block.name)
      .map(
        (block): ToolCall => ({
          id: block.id!,
          name: block.name!,
          status: toolResultMap.has(block.id!) ? 'done' : 'running',
          args:
            typeof block.arguments === 'object' && block.arguments !== null
              ? (block.arguments as Record<string, unknown>)
              : typeof block.arguments === 'string'
                ? safeJsonParse(block.arguments)
                : undefined,
          result: toolResultMap.get(block.id!),
          startedAt: timestamp,
          completedAt: toolResultMap.has(block.id!) ? timestamp : undefined,
        }),
      );

    if (!text.trim() && toolCalls.length === 0) continue;

    const visibleText = isVisibleAssistantContent(text) ? text.trim() : '';

    if (toolCalls.length > 0) {
      const turn = ensureCurrent(timestamp);
      const existingIds = new Set(turn.toolCalls.map((toolCall) => toolCall.id));
      turn.toolCalls.push(...toolCalls.filter((toolCall) => !existingIds.has(toolCall.id)));
      if (visibleText) {
        turn.content = appendSegment(turn.content, visibleText);
      }
      turn.timestamp = timestamp;
      continue;
    }

    if (!visibleText) continue;

    const turn = ensureCurrent(timestamp);
    turn.content = appendSegment(turn.content, visibleText);
    turn.timestamp = timestamp;
  }

  return turns.filter((turn) => turn.content || turn.toolCalls.length > 0);
}

function collapseDiscoveredMessages(messages: DiscoveredMessageShape[], taskId: string): Message[] {
  const collapsed: Message[] = [];
  let currentAssistant: Message | null = null;

  function flushAssistant(): void {
    if (!currentAssistant) return;
    if (currentAssistant.content || currentAssistant.toolCalls.length > 0) {
      collapsed.push(currentAssistant);
    }
    currentAssistant = null;
  }

  for (const message of messages) {
    if (message.role === 'user') {
      flushAssistant();
      collapsed.push({
        id: crypto.randomUUID(),
        taskId,
        role: 'user',
        content: message.content,
        artifacts: [],
        toolCalls: [],
        timestamp: message.timestamp,
      });
      continue;
    }

    if (message.role !== 'assistant') continue;

    const visibleText = isVisibleAssistantContent(message.content) ? message.content.trim() : '';
    const toolCalls = message.toolCalls ?? [];
    if (!visibleText && toolCalls.length === 0) continue;

    if (!currentAssistant) {
      currentAssistant = {
        id: crypto.randomUUID(),
        taskId,
        role: 'assistant',
        content: '',
        artifacts: [],
        toolCalls: [],
        timestamp: message.timestamp,
      };
    }

    if (visibleText) {
      currentAssistant.content = appendSegment(currentAssistant.content, visibleText);
    }
    if (toolCalls.length > 0) {
      const existingIds = new Set(currentAssistant.toolCalls.map((toolCall) => toolCall.id));
      currentAssistant.toolCalls.push(...toolCalls.filter((toolCall) => !existingIds.has(toolCall.id)));
    }
    currentAssistant.timestamp = message.timestamp;
  }

  flushAssistant();
  return collapsed;
}

async function doSyncSession(taskId: string): Promise<void> {
  const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
  if (!task?.gatewayId || !task?.sessionKey) return;

  const res = await window.clawwork.chatHistory(task.gatewayId, task.sessionKey);
  if (!res.ok || !res.result) return;

  const raw = res.result as { messages?: RawHistoryMessage[] };
  const rawMsgs = raw.messages ?? [];

  const localMsgs = useMessageStore.getState().messagesByTask[taskId] ?? [];
  const localAssistantTimestamps = new Set(localMsgs.filter((m) => m.role === 'assistant').map((m) => m.timestamp));

  const gatewayAssistant = normalizeAssistantTurns(rawMsgs);

  const newest = gatewayAssistant.filter((m) => !localAssistantTimestamps.has(m.timestamp));
  if (newest.length === 0) {
    useMessageStore.getState().clearActiveTurn(taskId);
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
    const mergedCanonical = mergeCanonicalMessageWithActiveTurn(
      canonical,
      useMessageStore.getState().activeTurnByTask[taskId],
    );

    if (i === newest.length - 1) {
      useMessageStore.getState().promoteActiveTurn(taskId, canonical);
    } else {
      useMessageStore.setState((s) => ({
        messagesByTask: {
          ...s.messagesByTask,
          [taskId]: [...(s.messagesByTask[taskId] ?? []), mergedCanonical],
        },
      }));
    }

    window.clawwork
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

export function syncSessionMessages(taskId: string): Promise<void> {
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

export function retrySyncPending(): void {
  const turns = useMessageStore.getState().activeTurnByTask;
  for (const [taskId, turn] of Object.entries(turns)) {
    if (turn.finalized) {
      syncSessionMessages(taskId).catch(() => {});
    }
  }
}

export async function syncFromGateway(): Promise<void> {
  try {
    await hydrateFromLocal();
    const res = await window.clawwork.syncSessions();
    if (!res.ok || !res.discovered) return;
    const { adoptTasks, updateTaskMetadata } = useTaskStore.getState();
    const { messagesByTask, bulkLoad } = useMessageStore.getState();
    const discovered = res.discovered.map((d) => ({ ...d, model: sanitizeModel(d.model) }));
    adoptTasks(discovered);

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

      updateTaskMetadata(d.taskId, {
        model: d.model,
        modelProvider: d.modelProvider,
        thinkingLevel: d.thinkingLevel,
        inputTokens: d.inputTokens,
        outputTokens: d.outputTokens,
        contextTokens: d.contextTokens,
      });
      if (collapsedMessages.length === 0) continue;

      const local = messagesByTask[d.taskId] ?? [];
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
        bulkLoad(d.taskId, merged);
        for (const msg of mapped) {
          window.clawwork
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
        bulkLoad(d.taskId, mapped);
        for (const msg of mapped) {
          window.clawwork
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
