import { useTranslation } from 'react-i18next';
import { useTaskStore, useUiStore } from '../stores/hooks';

interface TaskListProps {
  onSelect: () => void;
}

const MS_PER_DAY = 86_400_000;

interface TaskGroup {
  label: string;
  tasks: Array<{ id: string; title: string; updatedAt: string }>;
}

function groupByTime(
  tasks: Array<{ id: string; title: string; updatedAt: string }>,
  labels: { today: string; yesterday: string; thisWeek: string; older: string },
): TaskGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - MS_PER_DAY);
  const weekAgo = new Date(today.getTime() - 7 * MS_PER_DAY);

  const groups: TaskGroup[] = [
    { label: labels.today, tasks: [] },
    { label: labels.yesterday, tasks: [] },
    { label: labels.thisWeek, tasks: [] },
    { label: labels.older, tasks: [] },
  ];

  for (const task of tasks) {
    const updated = new Date(task.updatedAt);
    if (updated >= today) groups[0].tasks.push(task);
    else if (updated >= yesterday) groups[1].tasks.push(task);
    else if (updated >= weekAgo) groups[2].tasks.push(task);
    else groups[3].tasks.push(task);
  }

  return groups.filter((g) => g.tasks.length > 0);
}

export function TaskList({ onSelect }: TaskListProps) {
  const { t } = useTranslation();
  const tasks = useTaskStore((s) => s.tasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const unreadTaskIds = useUiStore((s) => s.unreadTaskIds);
  const clearUnread = useUiStore((s) => s.clearUnread);

  const groupedTasks = groupByTime(tasks, {
    today: t('tasks.today'),
    yesterday: t('tasks.yesterday'),
    thisWeek: t('tasks.thisWeek'),
    older: t('tasks.older'),
  });

  return (
    <nav className="py-2" role="navigation" aria-label={t('tasks.navigationLabel', { defaultValue: 'Task list' })}>
      {groupedTasks.map((group) => (
        <div key={group.label}>
          <div className="px-4 py-1.5">
            <span className="type-meta" style={{ color: 'var(--text-muted)' }}>
              {group.label}
            </span>
          </div>
          {group.tasks.map((task) => {
            const isActive = task.id === activeTaskId;
            const isUnread = unreadTaskIds.has(task.id);
            return (
              <button
                key={task.id}
                onClick={() => {
                  setActiveTask(task.id);
                  clearUnread(task.id);
                  onSelect();
                }}
                aria-label={task.title || t('tasks.newTask')}
                aria-current={isActive ? 'true' : undefined}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                }}
              >
                <span
                  className="type-body flex-1 truncate"
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isUnread ? 600 : 400,
                  }}
                >
                  {task.title || t('tasks.newTask')}
                </span>
                {isUnread && (
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="type-support" style={{ color: 'var(--text-muted)' }}>
            {t('tasks.empty')}
          </p>
        </div>
      )}
    </nav>
  );
}
