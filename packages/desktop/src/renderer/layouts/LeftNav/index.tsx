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
import {
  Plus,
  Search,
  FolderOpen,
  Settings,
  Archive,
  Server,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import { useTaskContextMenu, TaskContextMenuPopover, type SessionActions } from '@/components/ContextMenu';
import SearchResults, { type SearchResult } from '@/components/SearchResults';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import TaskItem from './TaskItem';
import ConnectionStatus from './ConnectionStatus';
import type { TaskStatus } from '@clawwork/shared';

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
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-accent)]',
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
        'titlebar-no-drag w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors relative',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-accent)]',
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
  const gwInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const hasUpdate = useUiStore((s) => s.hasUpdate);
  const leftNavCollapsed = useUiStore((s) => s.leftNavCollapsed);
  const toggleLeftNavCollapsed = useUiStore((s) => s.toggleLeftNavCollapsed);
  const focusSearch = useUiStore((s) => s.focusSearch);
  const connectedGateways = Object.values(gwInfoMap).filter((gw) => gwStatusMap[gw.id] === 'connected');
  const hasMultipleGateways = connectedGateways.length > 1;
  const searchFocusTrigger = useUiStore((s) => s.searchFocusTrigger);

  const gwStatusValues = Object.values(gwStatusMap);
  const aggregatedGwStatus: 'connected' | 'connecting' | 'disconnected' = gwStatusValues.some((s) => s === 'connected')
    ? 'connected'
    : gwStatusValues.some((s) => s === 'connecting')
      ? 'connecting'
      : 'disconnected';

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
          className="titlebar-no-drag flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-accent)] active:scale-95"
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
        <div className="flex-shrink-0 flex items-center justify-center w-full h-12">{CollapseToggleButton}</div>

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
          icon={FolderOpen}
          tooltip={t('common.fileManager')}
          onClick={() => setMainView('files')}
          className={
            mainView === 'files'
              ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
          }
        />

        <div className="w-6 h-px bg-[var(--border)] my-1" />

        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-0.5 px-1.5">
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
          </div>
        </ScrollArea>

        <div className="w-6 h-px bg-[var(--border)] my-1" />

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

        <ConnectionStatus gatewayStatus={aggregatedGwStatus} collapsed />

        {overlays}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-14 relative">
      <div className="absolute top-[8px] right-2 z-[51]">{CollapseToggleButton}</div>
      <div className="px-4 pb-3 space-y-2 flex-shrink-0">
        {hasMultipleGateways ? (
          <div className="titlebar-no-drag flex items-center gap-0.5">
            <Button variant="soft" onClick={() => startNewTask()} className="flex-1 gap-2 rounded-r-none">
              <Plus size={16} /> {t('common.newTask')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="soft" className="px-1.5 rounded-l-none border-l border-[var(--border)]">
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {connectedGateways.map((gw) => (
                  <DropdownMenuItem key={gw.id} onClick={() => startNewTask(gw.id)}>
                    {gw.color ? (
                      <span className="mr-2 w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: gw.color }} />
                    ) : (
                      <Server size={12} className="mr-2 flex-shrink-0 opacity-60" />
                    )}
                    {gw.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button variant="soft" onClick={() => startNewTask()} className="titlebar-no-drag w-full gap-2">
            <Plus size={16} /> {t('common.newTask')}
          </Button>
        )}
        <div className="titlebar-no-drag relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('leftNav.searchTasks')}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-transparent transition-all"
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
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-10 bg-[var(--bg-elevated)] border-t border-[var(--border)]"
            >
              <SearchResults results={searchResults} onSelect={handleSelectResult} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col h-full">
          <div className="px-4 pb-2 flex-shrink-0">
            <NavButton
              icon={FolderOpen}
              label={t('common.fileManager')}
              active={mainView === 'files'}
              onClick={() => setMainView('files')}
            />
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-0.5">
              {visibleTasks.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-8">{t('leftNav.emptyHint')}</p>
              )}
              {activeTasks.length > 0 && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] px-3 py-2">
                    {t('common.inProgress')} ({activeTasks.length})
                  </p>
                  {activeTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      active={task.id === activeTaskId}
                      onContextMenu={(e) => handleContextMenu(e, task.id, task.status)}
                      multiGateway={hasMultipleGateways}
                      editing={editingTaskId === task.id}
                      onEditDone={() => setEditingTaskId(null)}
                    />
                  ))}
                </>
              )}
              {completedTasks.length > 0 && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] px-3 py-2 mt-3">
                    {t('common.completed')} ({completedTasks.length})
                  </p>
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      active={task.id === activeTaskId}
                      onContextMenu={(e) => handleContextMenu(e, task.id, task.status)}
                      multiGateway={hasMultipleGateways}
                      editing={editingTaskId === task.id}
                      onEditDone={() => setEditingTaskId(null)}
                    />
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-2 border-t border-[var(--border)]">
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
          <ConnectionStatus gatewayStatus={aggregatedGwStatus} collapsed className="mr-1.5" />
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
