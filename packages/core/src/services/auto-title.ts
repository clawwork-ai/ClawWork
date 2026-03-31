import type { Message } from '@clawwork/shared';
import type { ActiveTurn } from '../stores/message-store.js';

export function autoTitleIfNeeded(
  taskId: string,
  sessionKey: string,
  getTaskState: () => {
    tasks: { id: string; title: string }[];
    updateTaskTitle: (id: string, title: string) => void;
  },
  getMessageState: () => {
    messagesByTask: Record<string, Message[]>;
    activeTurnBySession: Record<string, ActiveTurn>;
  },
): void {
  const { tasks, updateTaskTitle } = getTaskState();
  const task = tasks.find((t) => t.id === taskId);
  if (task && !task.title) {
    const state = getMessageState();
    const msgs = state.messagesByTask[taskId] ?? [];
    const turn = state.activeTurnBySession[sessionKey];
    const firstAssistant =
      msgs.find((m) => m.role === 'assistant') ?? (turn?.content ? { content: turn.content } : null);
    if (firstAssistant && firstAssistant.content) {
      const title = firstAssistant.content.slice(0, 30).replace(/\n/g, ' ').trim();
      if (title) {
        updateTaskTitle(taskId, title + (firstAssistant.content.length > 30 ? '\u2026' : ''));
      }
    }
  }
}
