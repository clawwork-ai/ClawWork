import { type MouseEvent, useState, useRef, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageSquare, Circle, Loader2, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore, type ActiveTurn } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import type { Message } from '@clawwork/shared';
import { motionDuration, motionEase, motion as motionPresets } from '@/styles/design-tokens';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Task } from '@clawwork/shared';

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
    const turn = s.activeTurnByTask[task.id];
    return !!turn && !turn.finalized && (!!turn.streamingText || !!turn.streamingThinking);
  });
  const preview = useMessageStore((s) => {
    const turn: ActiveTurn | undefined = s.activeTurnByTask[task.id];
    let text = '';
    if (turn && !turn.finalized) {
      if (turn.toolCalls.length > 0) text = turn.toolCalls[turn.toolCalls.length - 1].name;
      else if (turn.streamingText) text = turn.streamingText;
      else if (turn.streamingThinking) text = t('chat.thinking');
    }
    if (!text) {
      const msgs: Message[] = s.messagesByTask[task.id] ?? [];
      const last = msgs[msgs.length - 1];
      if (last) text = last.toolCalls?.length > 0 ? last.toolCalls[last.toolCalls.length - 1].name : last.content;
    }
    return text.replace(/\n+/g, ' ').slice(0, 80);
  });

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
            {...motionPresets.listItem}
            whileTap={reduced ? undefined : { scale: 0.95 }}
            onClick={handleClick}
            onContextMenu={onContextMenu}
            className="titlebar-no-drag w-full flex justify-center py-1.5 relative rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-accent)]"
          >
            {active && <span className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-[var(--accent)]" />}
            <span
              className={cn(
                'type-label flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                active
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
              )}
            >
              {task.title ? task.title[0].toUpperCase() : <MessageSquare size={14} />}
            </span>
            {isStreaming && <Loader2 className="absolute top-0.5 right-1 w-3 h-3 animate-spin text-[var(--accent)]" />}
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
      {...motionPresets.listItem}
      whileHover={reduced ? undefined : { x: 2 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ duration: motionDuration.normal, ease: motionEase.exit }}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      className={cn(
        'titlebar-no-drag w-full flex flex-col px-3 py-2.5 rounded-md text-left transition-all relative',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-accent)]',
        active
          ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
      )}
      style={active ? { boxShadow: 'var(--shadow-card)' } : undefined}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[var(--accent)]" />}
      <div className="flex w-full items-center gap-1.5">
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
            className="type-label min-w-0 flex-1 rounded border border-[var(--ring-accent)] bg-[var(--bg-primary)] px-1 py-0 text-[var(--text-primary)] outline-none"
          />
        ) : (
          <span className="type-label min-w-0 flex-1 truncate">{task.title || t('common.newTask')}</span>
        )}
        {isStreaming && <Loader2 size={12} className="flex-shrink-0 animate-spin text-[var(--accent)]" />}
        {hasUnread && !isStreaming && (
          <Circle size={6} className="flex-shrink-0 fill-[var(--accent)] text-[var(--accent)]" />
        )}
        <span className="type-support flex-shrink-0 text-[var(--text-muted)]">
          {formatRelativeTime(new Date(task.updatedAt))}
        </span>
      </div>
      <p
        className={cn(
          'type-support mt-0.5 truncate',
          isStreaming ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
        )}
      >
        {isStreaming && preview.includes('.') && <Wrench size={10} className="mr-1 inline-block align-[-1px]" />}
        {preview || '\u00A0'}
      </p>
    </motion.button>
  );
}
