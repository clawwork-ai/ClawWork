import { useEffect, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useMessageStore } from '../stores/messageStore';
import { useUiStore } from '../stores/uiStore';
import { useRoomStore } from '../stores/roomStore';
import { deriveSessionActivity, getTaskSessionKeys } from '@clawwork/core';
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
  const activeTurnBySession = useMessageStore((s) => s.activeTurnBySession);
  const unreadTaskIds = useUiStore((s) => s.unreadTaskIds);
  const rooms = useRoomStore((s) => s.rooms);

  const prevRef = useRef<{ status: string; taskIds: string }>({ status: '', taskIds: '' });

  useEffect(() => {
    const runningTasks = tasks.filter(
      (task) =>
        deriveSessionActivity(getTaskSessionKeys(task, rooms[task.id]), activeTurnBySession, processingBySession) !==
        'idle',
    );
    const isRunning = runningTasks.length > 0;
    const hasUnread = unreadTaskIds.size > 0;

    let status: 'idle' | 'running' | 'unread';
    if (isRunning) status = 'running';
    else if (hasUnread) status = 'unread';
    else status = 'idle';

    const activeIds = runningTasks.map((t) => t.id);
    const taskIdsKey = activeIds.join(',');

    if (prevRef.current.status === status && prevRef.current.taskIds === taskIdsKey) return;
    prevRef.current = { status, taskIds: taskIdsKey };

    const activeTasks = activeIds.map((id) => {
      const task = tasks.find((t) => t.id === id)!;
      const sessionKeys = getTaskSessionKeys(task, rooms[task.id]);
      const snippetSessionKey = sessionKeys.find((sessionKey) => activeTurnBySession[sessionKey]?.streamingText);
      return {
        taskId: id,
        title: task.title || i18n.t('common.noTitle'),
        snippet: ((snippetSessionKey ? activeTurnBySession[snippetSessionKey]?.streamingText : '') ?? '').slice(0, 60),
        duration: formatDuration(task.updatedAt),
      };
    });

    window.clawwork.updateTrayStatus(status, activeTasks);
  }, [tasks, processingBySession, activeTurnBySession, unreadTaskIds, rooms]);
}
