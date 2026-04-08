import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type MouseEvent,
  type ComponentType,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, FolderOpen, Settings, Archive, PanelLeftClose, PanelLeftOpen, Clock, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import { useTaskContextMenu, TaskContextMenuPopover, type SessionActions } from '@/components/ContextMenu';
import SearchResults, { type SearchResult } from '@/components/SearchResults';
import { cn } from '@/lib/utils';
import { motionDuration, motion as motionPresets } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { exportToFiles, exportToLocal } from '@/lib/export-session';
import TaskItem from './TaskItem';
import type { TaskStatus } from '@clawwork/shared';
import EmptyState from '@/components/semantic/EmptyState';

type ConfirmAction = 'reset' | 'delete' | null;

function IconButton({
  icon: Icon,
  tooltip,
  onClick,
  className,
  badge,
  tooltipSide = 'right',
}: {
  icon: ComponentType<{ size: number; className?: string }>;
  tooltip: string;
  onClick: () => void;
  className?: string;
  badge?: ReactNode;
  tooltipSide?: 'right' | 'top' | 'bottom' | 'left';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'titlebar-no-drag flex items-center justify-center w-8 h-8 rounded-md transition-colors relative',
            'focus-visible:outline-none glow-focus',
            'active:scale-95',
            className,
          )}
        >
          <Icon size={16} />
          {badge}
        </button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: ComponentType<{ size: number; className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'titlebar-no-drag type-label relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 transition-colors',
        'focus-visible:outline-none glow-focus',
        'active:scale-[0.98]',
        active
          ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
      )}
    >
      <Icon size={16} className="opacity-60 flex-shrink-0" />
      {label}
      {badge}
    </button>
  );
}

export default function LeftNav() {
  const { t } = useTranslation();
  const tasks = useTaskStore((s) => s.tasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const startNewTask = useTaskStore((s) => s.startNewTask);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);
  const removeTask = useTaskStore((s) => s.removeTask);
  const clearMessages = useMessageStore((s) => s.clearMessages);
  const addMessage = useMessageStore((s) => s.addMessage);
  const setHighlightedMessage = useMessageStore((s) => s.setHighlightedMessage);
  const mainView = useUiStore((s) => s.mainView);
  const setMainView = useUiStore((s) => s.setMainView);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const gwStatusMap = useUiStore((s) => s.gatewayStatusMap);
  const hasUpdate = useUiStore((s) => s.hasUpdate);
  const leftNavCollapsed = useUiStore((s) => s.leftNavCollapsed);
  const toggleLeftNavCollapsed = useUiStore((s) => s.toggleLeftNavCollapsed);
  const focusSearch = useUiStore((s) => s.focusSearch);
  const searchFocusTrigger = useUiStore((s) => s.searchFocusTrigger);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmTaskId, setConfirmTaskId] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const findTask = (taskId: string) => useTaskStore.getState().tasks.find((t) => t.id === taskId);

  const handleCompact = useCallback(
    (taskId: string) => {
      const task = findTask(taskId);
      if (!task) return;
      window.clawwork
        .compactSession(task.gatewayId, task.sessionKey)
        .then((res) => {
          if (res.ok) addMessage(taskId, 'system', t('session.contextCompacted'));
        })
        .catch(() => {});
    },
    [addMessage, t],
  );

  const handleResetConfirm = useCallback(() => {
    const task = findTask(confirmTaskId);
    if (!task) {
      setConfirmAction(null);
      return;
    }
    window.clawwork
      .resetSession(task.gatewayId, task.sessionKey, 'reset')
      .then((res) => {
        if (res.ok) {
          clearMessages(confirmTaskId);
          addMessage(confirmTaskId, 'system', t('session.contextReset'));
        }
      })
      .catch(() => {});
    setConfirmAction(null);
  }, [confirmTaskId, clearMessages, addMessage, t]);

  const handleDeleteConfirm = useCallback(() => {
    const task = findTask(confirmTaskId);
    if (task) {
      window.clawwork.deleteSession(task.gatewayId, task.sessionKey).catch(() => {});
    }
    clearMessages(confirmTaskId);
    removeTask(confirmTaskId);
    setConfirmAction(null);
  }, [confirmTaskId, clearMessages, removeTask]);

  const sessionActions: SessionActions = useMemo(
    () => ({
      rename: (taskId: string) => setEditingTaskId(taskId),
      compact: handleCompact,
      reset: (taskId: string) => {
        setConfirmTaskId(taskId);
        setConfirmAction('reset');
      },
      deleteTask: (taskId: string) => {
        setConfirmTaskId(taskId);
        setConfirmAction('delete');
      },
      exportMarkdown: exportToFiles,
      exportMarkdownAs: exportToLocal,
      isConnected: (taskId: string) => {
        const task = findTask(taskId);
        return task ? gwStatusMap[task.gatewayId] === 'connected' : false;
      },
    }),
    [handleCompact, gwStatusMap],
  );

  const { items, isOpen, openMenu, closeMenu } = useTaskContextMenu(updateTaskStatus, sessionActions);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchFocusTrigger === 0) return;
    if (leftNavCollapsed) return;
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, [searchFocusTrigger, leftNavCollapsed]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const resp = await window.clawwork.globalSearch(searchQuery);
      if (resp.ok && resp.results) setSearchResults(resp.results);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [searchQuery]);

  const handleSelectResult = (result: SearchResult): void => {
    setSearchQuery('');
    setSearchResults([]);
    if (result.type === 'artifact') {
      setMainView('files');
    } else {
      const targetId = result.type === 'task' ? result.id : result.taskId;
      if (targetId) setActiveTask(targetId);
      if (result.type === 'message') setHighlightedMessage(result.id);
      setMainView('chat');
    }
  };

  const handleContextMenu = (e: MouseEvent, taskId: string, status: TaskStatus): void => {
    setMenuPos({ x: e.clientX, y: e.clientY });
    openMenu(e, taskId, status);
  };

  const visibleTasks = useMemo(() => tasks.filter((t) => t.status !== 'archived'), [tasks]);
  const activeTasks = useMemo(() => visibleTasks.filter((t) => t.status === 'active'), [visibleTasks]);
  const completedTasks = useMemo(() => visibleTasks.filter((t) => t.status === 'completed'), [visibleTasks]);

  const CollapseToggleButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleLeftNavCollapsed}
          className="titlebar-no-drag flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none glow-focus active:scale-95"
        >
          {leftNavCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {leftNavCollapsed ? t('leftNav.expandNav') : t('leftNav.collapseNav')}
      </TooltipContent>
    </Tooltip>
  );

  const overlays = (
    <>
      <TaskContextMenuPopover open={isOpen} position={menuPos} items={items} onClose={closeMenu} />

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'reset' ? t('dialog.resetSessionTitle') : t('dialog.deleteTaskTitle')}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'reset' ? t('dialog.resetSessionDesc') : t('dialog.deleteTaskDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant={confirmAction === 'delete' ? 'danger' : 'default'}
              onClick={confirmAction === 'reset' ? handleResetConfirm : handleDeleteConfirm}
            >
              {t('dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (leftNavCollapsed) {
    return (
      <div className="flex flex-col h-full items-center py-2 gap-1 overflow-hidden">
        <div className="flex-shrink-0 flex flex-col items-center gap-1 w-full">{CollapseToggleButton}</div>

        <div className="flex flex-col items-center gap-0.5">
          <IconButton
            icon={Plus}
            tooltip={t('common.newTask')}
            onClick={() => startNewTask()}
            className="bg-[var(--accent-dim)] text-[var(--accent)] hover:opacity-80"
          />
          <IconButton
            icon={Search}
            tooltip={t('leftNav.searchTasks')}
            onClick={() => {
              toggleLeftNavCollapsed();
              focusSearch();
            }}
            className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          />
          <IconButton
            icon={Users}
            tooltip={`${t('teams.title')} (Beta)`}
            onClick={() => setMainView('teams')}
            className={
              mainView === 'teams'
                ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }
          />
          <IconButton
            icon={FolderOpen}
            tooltip={t('common.fileManager')}
            onClick={() => setMainView('files')}
            className={
              mainView === 'files'
                ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }
          />
        </div>

        <div className="w-6 h-px bg-[var(--border)]" />

        <ScrollArea className="flex-1 w-full">
          <motion.div
            variants={motionPresets.staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center gap-0.5 px-1.5"
          >
            {activeTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                active={task.id === activeTaskId}
                onContextMenu={(e) => handleContextMenu(e, task.id, task.status)}
                collapsed
              />
            ))}
            {completedTasks.length > 0 && activeTasks.length > 0 && (
              <div className="w-6 h-px bg-[var(--border)] my-0.5" />
            )}
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                active={task.id === activeTaskId}
                onContextMenu={(e) => handleContextMenu(e, task.id, task.status)}
                collapsed
              />
            ))}
          </motion.div>
        </ScrollArea>

        <div className="w-6 h-px bg-[var(--border)]" />

        <div className="flex flex-col items-center gap-0.5">
          <IconButton
            icon={Clock}
            tooltip={t('leftNav.scheduledTasks')}
            onClick={() => setMainView('cron')}
            className={
              mainView === 'cron'
                ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }
          />
          <IconButton
            icon={Archive}
            tooltip={t('leftNav.archivedChats')}
            onClick={() => setMainView('archived')}
            className={
              mainView === 'archived'
                ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }
          />
          <IconButton
            icon={Settings}
            tooltip={hasUpdate ? t('leftNav.updateAvailable') : t('leftNav.appSettings')}
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={
              settingsOpen
                ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }
            badge={
              hasUpdate ? (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[var(--accent)]" />
              ) : undefined
            }
          />
        </div>

        {overlays}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-10 relative">
      <div className="titlebar-drag absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-3 z-[51]">
        <div className="titlebar-no-drag flex items-center gap-1" style={{ marginLeft: 68 }}>
          {CollapseToggleButton}
        </div>
        <div className="titlebar-no-drag flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-sm" onClick={() => startNewTask()} className="h-7 w-7">
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('common.newTask')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="titlebar-no-drag relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('leftNav.searchTasks')}
            className="w-full h-[var(--density-control-height-sm)] pl-9 pr-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] type-body glow-focus focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <AnimatePresence>
          {searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: motionDuration.normal }}
              className="absolute inset-0 z-10 bg-[var(--bg-elevated)] border-t border-[var(--border)]"
            >
              <SearchResults results={searchResults} onSelect={handleSelectResult} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col h-full">
          <div className="px-3 pb-1 flex-shrink-0 space-y-0.5">
            <NavButton
              icon={Users}
              label={t('teams.title')}
              active={mainView === 'teams'}
              onClick={() => setMainView('teams')}
              badge={
                <span className="ml-auto type-support rounded-full bg-[var(--accent-dim)] px-1.5 py-0.5 text-[var(--accent)]">
                  Beta
                </span>
              }
            />
            <NavButton
              icon={FolderOpen}
              label={t('common.fileManager')}
              active={mainView === 'files'}
              onClick={() => setMainView('files')}
            />
          </div>

          <ScrollArea className="flex-1">
            <motion.div
              variants={motionPresets.staggerContainer}
              initial="initial"
              animate="animate"
              className="px-3 py-1"
            >
              {visibleTasks.length === 0 && <EmptyState title={t('leftNav.emptyHint')} className="py-8" />}
              {activeTasks.length > 0 && (
                <>
                  {activeTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      active={task.id === activeTaskId}
                      onContextMenu={(e) => handleContextMenu(e, task.id, task.status)}
                      editing={editingTaskId === task.id}
                      onEditDone={() => setEditingTaskId(null)}
                    />
                  ))}
                </>
              )}
              {completedTasks.length > 0 && (
                <>
                  <p className="type-meta px-3 py-1.5 text-[var(--text-muted)] mt-2">
                    {t('common.completed')} ({completedTasks.length})
                  </p>
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      active={task.id === activeTaskId}
                      onContextMenu={(e) => handleContextMenu(e, task.id, task.status)}
                      editing={editingTaskId === task.id}
                      onEditDone={() => setEditingTaskId(null)}
                    />
                  ))}
                </>
              )}
            </motion.div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex-shrink-0 px-3" style={{ paddingBottom: 'calc(var(--density-panel-gap) / 4)' }}>
        <NavButton
          icon={Clock}
          label={t('leftNav.scheduledTasks')}
          active={mainView === 'cron'}
          onClick={() => setMainView('cron')}
        />
      </div>

      <div className="flex-shrink-0 px-3 py-2 border-t border-[var(--border)]">
        <div className="flex items-center">
          <IconButton
            icon={Archive}
            tooltip={t('leftNav.archivedChats')}
            onClick={() => setMainView('archived')}
            tooltipSide="top"
            className={
              mainView === 'archived'
                ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }
          />
          <div className="flex-1" />
          <IconButton
            icon={Settings}
            tooltip={hasUpdate ? t('leftNav.updateAvailable') : t('leftNav.appSettings')}
            onClick={() => setSettingsOpen(true)}
            tooltipSide="top"
            className={
              settingsOpen
                ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }
            badge={
              hasUpdate ? (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[var(--accent)]" />
              ) : undefined
            }
          />
        </div>
      </div>

      {overlays}
    </div>
  );
}
