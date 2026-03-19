import type { Message, MessageRole, ToolCall } from '@clawwork/shared';
import { useTaskStore } from '../stores/taskStore';
import { useMessageStore } from '../stores/messageStore';

const GATEWAY_INJECTED_MODEL = 'gateway-injected';
let hydrationPromise: Promise<void> | null = null;

function sanitizeModel(model?: string): string | undefined {
  return model === GATEWAY_INJECTED_MODEL ? undefined : model;
}

/**
 * Load tasks and their messages from local SQLite.
 * Called once on mount for instant offline render.
 */
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
              toolCalls: [],
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

/**
 * Discover sessions from all connected Gateways and adopt any that don't exist locally.
 * Called once on first Gateway connect.
 */
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
      // Update metadata for existing tasks (adoptTasks only creates new ones)
      updateTaskMetadata(d.taskId, {
        model: d.model,
        modelProvider: d.modelProvider,
        thinkingLevel: d.thinkingLevel,
        inputTokens: d.inputTokens,
        outputTokens: d.outputTokens,
        contextTokens: d.contextTokens,
      });
      if (d.messages.length === 0) continue;
      const local = messagesByTask[d.taskId] ?? [];
      const existingCounts = new Map<string, number>();
      for (const msg of local) {
        const key = `${msg.role}:${msg.content}`;
        existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
      }
      const remoteCounts = new Map<string, number>();
      const newMsgs: Message[] = d.messages
        .filter((msg: { role: string; content: string; timestamp: string }) => {
          const key = `${msg.role}:${msg.content}`;
          const seen = remoteCounts.get(key) ?? 0;
          remoteCounts.set(key, seen + 1);
          return seen + 1 > (existingCounts.get(key) ?? 0);
        })
        .map(
          (m: {
            role: string;
            content: string;
            timestamp: string;
            toolCalls?: {
              id: string;
              name: string;
              status: string;
              args?: Record<string, unknown>;
              result?: string;
              startedAt: string;
              completedAt?: string;
            }[];
          }) => ({
            id: crypto.randomUUID(),
            taskId: d.taskId,
            role: m.role as MessageRole,
            content: m.content,
            artifacts: [],
            toolCalls: (m.toolCalls ?? []).map(
              (tc): ToolCall => ({
                id: tc.id,
                name: tc.name,
                status: tc.status as ToolCall['status'],
                args: tc.args,
                result: tc.result,
                startedAt: tc.startedAt,
                completedAt: tc.completedAt,
              }),
            ),
            timestamp: m.timestamp,
          }),
        );
      if (newMsgs.length === 0) continue;
      const merged = [...local, ...newMsgs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      bulkLoad(d.taskId, merged);
      for (const msg of newMsgs) {
        window.clawwork
          .persistMessage({
            id: msg.id,
            taskId: msg.taskId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })
          .catch(() => {});
      }
    }
  } catch {
    console.warn('[sync] Gateway session sync failed');
  }
}
