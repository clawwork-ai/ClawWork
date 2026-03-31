import { type MouseEvent, useState, useRef, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageSquare, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import { motionDuration, motionEase, motion as motionPresets } from '@/styles/design-tokens';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Task } from '@clawwork/shared';
import ActivityBars from '@/components/ActivityBars';

interface TaskItemProps {
  task: Task;
  active: boolean;
  onContextMenu: (e: MouseEvent) => void;
  collapsed?: boolean;
  editing?: boolean;
  onEditDone?: () => void;
}

export default function TaskItem({ task, active, onContextMenu, collapsed, editing, onEditDone }: TaskItemProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const updateTaskTitle = useTaskStore((s) => s.updateTaskTitle);

  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(task.title);

  useEffect(() => {
    if (editing) {
      setDraft(task.title);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, task.title]);

  const commitRename = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.title) {
      updateTaskTitle(task.id, trimmed);
    }
    onEditDone?.();
  }, [draft, task.title, task.id, updateTaskTitle, onEditDone]);

  const cancelRename = useCallback(() => {
    onEditDone?.();
  }, [onEditDone]);
  const clearUnread = useUiStore((s) => s.clearUnread);
  const hasUnread = useUiStore((s) => s.unreadTaskIds.has(task.id));
  const setMainView = useUiStore((s) => s.setMainView);
  const isStreaming = useMessageStore((s) => {
    const turn = s.activeTurnBySession[task.sessionKey];
    return !!turn && !turn.finalized && (!!turn.streamingText || !!turn.streamingThinking);
  });
  const isCompleted = task.status === 'completed';

  const handleClick = (): void => {
    setActiveTask(task.id);
    clearUnread(task.id);
    setMainView('chat');
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            variants={motionPresets.listItem}
            whileTap={reduced ? undefined : { scale: 0.95 }}
            onClick={handleClick}
            onContextMenu={onContextMenu}
            className={cn(
              'titlebar-no-drag w-full flex justify-center py-1.5 relative rounded-md',
              'focus-visible:outline-none glow-focus',
              active && 'glow-selected',
            )}
          >
            <span
              className={cn(
                'type-label flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                active
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                  : isCompleted
                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
              )}
            >
              {task.title ? task.title[0].toUpperCase() : <MessageSquare size={14} />}
            </span>
            {isStreaming && <ActivityBars className="absolute top-0 right-0.5 scale-50 origin-top-right" />}
            {hasUnread && !isStreaming && (
              <span className="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-[var(--accent)]" />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="right">{task.title || t('common.newTask')}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <motion.button
      variants={motionPresets.listItem}
      whileHover={reduced ? undefined : { backgroundColor: active ? undefined : 'var(--bg-hover)' }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ duration: motionDuration.normal, ease: motionEase.exit }}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      className={cn(
        'group titlebar-no-drag w-full rounded-md text-left transition-all relative',
        'focus-visible:outline-none glow-focus',
        active
          ? 'glow-selected bg-[var(--bg-elevated)]'
          : isStreaming
            ? 'bg-[var(--accent-dim)]'
            : isCompleted
              ? ''
              : 'hover:bg-[var(--bg-hover)]',
      )}
    >
      <div className="flex items-center gap-2 px-3 h-9">
        {hasUnread && !active && (
          <Circle size={6} className="flex-shrink-0 fill-[var(--accent)] text-[var(--accent)]" />
        )}

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelRename();
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="type-label w-full rounded border border-[var(--ring-accent)] bg-[var(--bg-primary)] px-1 py-0 text-[var(--text-primary)] outline-none"
            />
          ) : (
            <span
              className={cn(
                'block truncate type-body',
                active
                  ? 'text-[var(--text-primary)]'
                  : isCompleted
                    ? 'text-[var(--text-muted)]'
                    : 'text-[var(--text-secondary)]',
              )}
            >
              {task.title || t('common.newTask')}
            </span>
          )}
        </div>

        {isStreaming && <ActivityBars className="flex-shrink-0 scale-75 origin-center" />}
      </div>
    </motion.button>
  );
}
