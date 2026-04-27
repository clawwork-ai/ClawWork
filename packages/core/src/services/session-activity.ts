import type { ActiveTurn } from '../stores/message-store.js';
import type { Task, TaskRoom } from '@clawwork/shared';

export type SessionActivity = 'idle' | 'waiting' | 'responding' | 'tooling';

export function getTaskSessionKeys(task: Pick<Task, 'sessionKey'>, room?: Pick<TaskRoom, 'performers'>): string[] {
  return [task.sessionKey, ...(room?.performers.map((performer) => performer.sessionKey) ?? [])];
}

export function deriveSessionActivity(
  sessionKeys: string[],
  activeTurnBySession: Record<string, ActiveTurn | undefined>,
  processingBySession: ReadonlySet<string>,
): SessionActivity {
  let waiting = false;
  let tooling = false;

  for (const sessionKey of sessionKeys) {
    if (processingBySession.has(sessionKey)) waiting = true;

    const turn = activeTurnBySession[sessionKey];
    if (!turn || turn.finalized) continue;

    if (turn.streamingText || turn.streamingThinking) return 'responding';
    if (turn.toolCalls.length > 0) tooling = true;
  }

  if (tooling) return 'tooling';
  if (waiting) return 'waiting';
  return 'idle';
}
