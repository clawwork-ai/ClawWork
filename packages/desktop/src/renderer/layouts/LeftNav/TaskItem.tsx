import { type MouseEvent, useState, useRef, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageSquare, Circle, Loader2, Server, Cpu, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import { motionDuration, motionEase, motion as motionPresets } from '@/styles/design-tokens';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Task } from '@clawwork/shared';

const GATEWAY_INJECTED_MODEL = 'gateway-injected';

interface TaskItemProps {
  task: Task;
  active: boolean;
  onContextMenu: (e: MouseEvent) => void;
  collapsed?: boolean;
  multiGateway?: boolean;
  editing?: boolean;
  onEditDone?: () => void;
}

export default function TaskItem({
  task,
  active,
  onContextMenu,
  collapsed,
  multiGateway,
  editing,
  onEditDone,
}: TaskItemProps) {
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
  const gwInfo = useUiStore((s) => s.gatewayInfoMap[task.gatewayId]);
  const agentInfo = useUiStore((s) => {
    if (!task.agentId) return undefined;
    const catalog = s.agentCatalogByGateway[task.gatewayId];
    if (!catalog || task.agentId === catalog.defaultId) return undefined;
    return catalog.agents.find((a) => a.id === task.agentId);
  });
  const modelLabel = task.model === GATEWAY_INJECTED_MODEL ? 'Default' : task.model?.split('/').pop();
  const modelTooltip = task.model === GATEWAY_INJECTED_MODEL ? 'Default' : task.model;

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
                'w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors',
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
        'titlebar-no-drag w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-all relative',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-accent)]',
        active
          ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
      )}
      style={active ? { boxShadow: 'var(--shadow-card)' } : undefined}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[var(--accent)]" />}
      <MessageSquare size={16} className="mt-0.5 flex-shrink-0 opacity-50" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
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
              className="font-medium flex-1 min-w-0 bg-[var(--bg-primary)] border border-[var(--ring-accent)] rounded px-1 py-0 text-[var(--text-primary)] outline-none text-sm"
            />
          ) : (
            <span className="font-medium truncate flex-1">{task.title || t('common.newTask')}</span>
          )}
          {isStreaming ? (
            <Loader2 size={12} className="flex-shrink-0 animate-spin text-[var(--accent)]" />
          ) : hasUnread ? (
            <Circle size={6} className="flex-shrink-0 fill-[var(--accent)] text-[var(--accent)]" />
          ) : null}
        </div>
        <div className="flex items-center gap-x-1.5 gap-y-1 mt-1 flex-wrap">
          {task.status === 'completed' && (
            <span className="text-xs leading-tight px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              {t('common.completed')}
            </span>
          )}
          {multiGateway && gwInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex items-center gap-1 text-xs leading-tight px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] max-w-20 truncate"
                  style={gwInfo.color ? { borderLeft: `2px solid ${gwInfo.color}` } : undefined}
                >
                  <Server size={10} className="flex-shrink-0 opacity-60" />
                  {gwInfo.name}
                </span>
              </TooltipTrigger>
              <TooltipContent>{gwInfo.name}</TooltipContent>
            </Tooltip>
          )}
          {agentInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-xs leading-tight px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] max-w-20 truncate">
                  {agentInfo.identity?.emoji ? (
                    <span className="text-xs leading-none">{agentInfo.identity.emoji}</span>
                  ) : (
                    <Bot size={10} className="flex-shrink-0 opacity-60" />
                  )}
                  {agentInfo.name ?? agentInfo.id}
                </span>
              </TooltipTrigger>
              <TooltipContent>{agentInfo.name ?? agentInfo.id}</TooltipContent>
            </Tooltip>
          )}
          {modelLabel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-xs leading-tight px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] max-w-20 truncate">
                  <Cpu size={10} className="flex-shrink-0 opacity-60" />
                  {modelLabel}
                </span>
              </TooltipTrigger>
              <TooltipContent>{modelTooltip}</TooltipContent>
            </Tooltip>
          )}
          <span className="text-xs leading-tight text-[var(--text-muted)]">
            {formatRelativeTime(new Date(task.updatedAt))}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
