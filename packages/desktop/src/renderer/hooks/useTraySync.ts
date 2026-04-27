import { useEffect, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useMessageStore } from '../stores/messageStore';
import { useUiStore } from '../stores/uiStore';
import i18n from '../i18n';

function formatDuration(updatedAt: string): string {
  const ms = Date.now() - new Date(updatedAt).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return i18n.t('common.justNow');
  if (min === 1) return i18n.t('common.minAgo', { count: 1 });
  return i18n.t('common.minAgo', { count: min });
}

export function useTraySync(): void {
  const tasks = useTaskStore((s) => s.tasks);
  const processingBySession = useMessageStore((s) => s.processingBySession);
  const unreadTaskIds = useUiStore((s) => s.unreadTaskIds);

  const prevRef = useRef<{ status: string; taskIds: string }>({ status: '', taskIds: '' });

  useEffect(() => {
    const isRunning = processingBySession.size > 0;
    const hasUnread = unreadTaskIds.size > 0;

    let status: 'idle' | 'running' | 'unread';
    if (isRunning) status = 'running';
    else if (hasUnread) status = 'unread';
    else status = 'idle';

    const activeIds = tasks.filter((t) => processingBySession.has(t.sessionKey)).map((t) => t.id);
    const taskIdsKey = activeIds.join(',');

    if (prevRef.current.status === status && prevRef.current.taskIds === taskIdsKey) return;
    prevRef.current = { status, taskIds: taskIdsKey };

    const activeTurnBySession = useMessageStore.getState().activeTurnBySession;
    const activeTasks = activeIds.map((id) => {
      const task = tasks.find((t) => t.id === id)!;
      return {
        taskId: id,
        title: task.title || i18n.t('common.noTitle'),
        snippet: (activeTurnBySession[task.sessionKey]?.streamingText ?? '').slice(0, 60),
        duration: formatDuration(task.updatedAt),
      };
    });

    window.clawwork.updateTrayStatus(status, activeTasks);
  }, [tasks, processingBySession, unreadTaskIds]);
}
