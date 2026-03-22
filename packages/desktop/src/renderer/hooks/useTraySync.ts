import { useEffect, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useUiStore } from '../stores/uiStore';
import { useMessageStore } from '../stores/messageStore';

function formatDuration(updatedAt: string): string {
  const ms = Date.now() - new Date(updatedAt).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min === 1) return '1 min ago';
  return `${min} min ago`;
}

export function useTraySync(): void {
  const tasks = useTaskStore((s) => s.tasks);
  const processingTasks = useMessageStore((s) => s.processingTasks);
  const gatewayStatusMap = useUiStore((s) => s.gatewayStatusMap);
  const unreadTaskIds = useUiStore((s) => s.unreadTaskIds);

  const prevRef = useRef<{ status: string; taskIds: string }>({ status: '', taskIds: '' });

  useEffect(() => {
    const anyDisconnected = Object.values(gatewayStatusMap).some((s) => s === 'disconnected');
    const isRunning = processingTasks.size > 0;
    const hasUnread = unreadTaskIds.size > 0;

    let status: 'idle' | 'running' | 'unread' | 'disconnected';
    if (anyDisconnected) status = 'disconnected';
    else if (isRunning) status = 'running';
    else if (hasUnread) status = 'unread';
    else status = 'idle';

    const activeIds = tasks.filter((t) => processingTasks.has(t.id)).map((t) => t.id);
    const taskIdsKey = activeIds.join(',');

    if (prevRef.current.status === status && prevRef.current.taskIds === taskIdsKey) return;
    prevRef.current = { status, taskIds: taskIdsKey };

    const activeTurnByTask = useMessageStore.getState().activeTurnByTask;
    const activeTasks = activeIds.map((id) => {
      const t = tasks.find((task) => task.id === id)!;
      return {
        taskId: id,
        title: t.title || 'Untitled',
        snippet: (activeTurnByTask[id]?.streamingText ?? '').slice(0, 60),
        duration: formatDuration(t.updatedAt),
      };
    });

    window.clawwork.updateTrayStatus(status, activeTasks);
  }, [tasks, processingTasks, gatewayStatusMap, unreadTaskIds]);
}
