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
  Check,
  ChevronDown,
  FolderOpen,
  Settings,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
  Users,
  Gauge,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import { useFileStore } from '@/stores/fileStore';
import { useTaskContextMenu, TaskContextMenuPopover, type SessionActions } from '@/components/ContextMenu';
import SearchResults, { type SearchResult } from '@/components/SearchResults';
import { cn } from '@/lib/utils';
import { motionDuration, motion as motionPresets } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { exportToFiles, exportToLocal } from '@/lib/export-session';
import { syncFromGateway } from '@/lib/session-sync';
import AgentIcon from '@/components/AgentIcon';
import TaskItem from './TaskItem';
import type { AgentInfo, Task, TaskStatus } from '@clawwork/shared';
import EmptyState from '@/components/semantic/EmptyState';
import { useSessionPreviews } from '@/hooks/useSessionPreviews';

function groupTasksByTime(tasks: Task[]): {
  today: Task[];
  yesterday: Task[];
  last7Days: Task[];
  older: Task[];
} {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();
  const startOfYesterdayMs = startOfTodayMs - MS_PER_DAY;
  const startOf7DaysAgoMs = startOfTodayMs - 7 * MS_PER_DAY;

  const today: Task[] = [];
  const yesterday: Task[] = [];
  const last7Days: Task[] = [];
  const older: Task[] = [];

  for (const task of tasks) {
    const t = new Date(task.updatedAt).getTime();
    if (t >= startOfTodayMs) today.push(task);
    else if (t >= startOfYesterdayMs) yesterday.push(task);
    else if (t >= startOf7DaysAgoMs) last7Days.push(task);
    else older.push(task);
  }
  return { today, yesterday, last7Days, older };
}

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
          aria-label={tooltip}
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

const navActiveClass = (active: boolean) =>
  active
    ? 'bg-[var(--accent-dim)] text-[var(--text-primary)]'
    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]';

function basename(path: string | undefined): string {
  if (!path) return '';
  const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '');
  return normalized.split('/').pop() || normalized;
}

function agentLabel(agent: AgentInfo | undefined, fallbackId: string): string {
  if (!agent) return fallbackId;
  return basename(agent.workspace) || agent.name || fallbackId;
}

function isCronTaskTitle(title: string | undefined): boolean {
  return /^\s*cron\s*[:\uFF1A]/i.test(title ?? '');
}

function isEmptyImportedPlaceholder(task: Task): boolean {
  return task.id.startsWith('native-') && !task.title.trim();
}

function matchesSelectedMainAgent(task: Task, gatewayId: string | undefined, agentId: string | undefined): boolean {
  if (!gatewayId || !agentId) return true;
  return task.gatewayId === gatewayId && task.agentId === agentId;
}

const startupSyncedMainAgentKeys = new Set<string>();

function mainAgentSyncKey(gatewayId: string, agent: AgentInfo): string {
  return `${gatewayId}:${agent.id}:${agent.workspace ?? ''}`;
}

function syncMainAgentSessions(gatewayId: string, agent: AgentInfo): void {
  void syncFromGateway({ gatewayId, agentId: agent.id, workspace: agent.workspace }).catch((err) =>
    console.warn('[left-nav] sync selected main agent sessions failed:', err),
  );
}

function useStartupMainAgentSessionSync(): void {
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const catalog = useUiStore((s) => (defaultGatewayId ? s.agentCatalogByGateway[defaultGatewayId] : undefined));
  const selectedMainAgentByGateway = useUiStore((s) => s.selectedMainAgentByGateway);
  const gwStatusMap = useUiStore((s) => s.gatewayStatusMap);

  useEffect(() => {
    if (!defaultGatewayId || gwStatusMap[defaultGatewayId] !== 'connected') return;

    const selectedId = selectedMainAgentByGateway[defaultGatewayId];
    if (!selectedId || !catalog?.agents.length) return;

    const selected = catalog.agents.find((agent) => agent.id === selectedId);
    if (!selected) return;

    const syncKey = mainAgentSyncKey(defaultGatewayId, selected);
    if (startupSyncedMainAgentKeys.has(syncKey)) return;

    startupSyncedMainAgentKeys.add(syncKey);
    syncMainAgentSessions(defaultGatewayId, selected);
  }, [catalog, defaultGatewayId, gwStatusMap, selectedMainAgentByGateway]);
}

function MainAgentWorkspaceSelector({ collapsed }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const catalog = useUiStore((s) => (defaultGatewayId ? s.agentCatalogByGateway[defaultGatewayId] : undefined));
  const selectedMainAgentByGateway = useUiStore((s) => s.selectedMainAgentByGateway);
  const setSelectedMainAgentForGateway = useUiStore((s) => s.setSelectedMainAgentForGateway);
  const updatePending = useTaskStore((s) => s.updatePending);

  if (!defaultGatewayId || !catalog?.agents.length) return null;

  const selectedId = selectedMainAgentByGateway[defaultGatewayId] || '';
  const selected = selectedId ? catalog.agents.find((agent) => agent.id === selectedId) : undefined;

  const handleSelect = (agent: AgentInfo): void => {
    setSelectedMainAgentForGateway(defaultGatewayId, agent.id);
    const pending = useTaskStore.getState().pendingNewTask;
    if (pending?.gatewayId === defaultGatewayId && !pending.ensemble && !pending.teamId) {
      updatePending({ agentId: agent.id });
    }
    syncMainAgentSessions(defaultGatewayId, agent);
  };

  const label = selected
    ? agentLabel(selected, selected.id)
    : t('leftNav.selectMainWorkspace', { defaultValue: 'Select workspace' });
  const secondaryLabel = selected
    ? selected.workspace
      ? (selected.name ?? selected.id)
      : selected.id
    : t('leftNav.noMainWorkspaceSelected', { defaultValue: 'No main workspace selected' });
  const triggerClass = collapsed
    ? 'titlebar-no-drag flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none glow-focus'
    : 'titlebar-no-drag flex min-w-0 w-full items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2.5 py-2 text-left transition-colors hover:border-[var(--text-muted)] focus-visible:outline-none glow-focus';

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button className={triggerClass} aria-label={t('leftNav.mainWorkspace', { defaultValue: 'Main workspace' })}>
              {selected ? (
                <AgentIcon
                  gatewayId={defaultGatewayId}
                  agentId={selected.id}
                  gatewayAvatarUrl={selected.identity?.avatarUrl}
                  emoji={selected.identity?.emoji}
                  imgClass="h-4 w-4 rounded-full object-cover"
                  emojiClass="emoji-sm"
                  iconSize={collapsed ? 16 : 14}
                />
              ) : (
                <FolderOpen size={collapsed ? 16 : 14} className="flex-shrink-0 text-[var(--text-muted)]" />
              )}
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="type-label block truncate text-[var(--text-primary)]">{label}</span>
                    <span className="type-support block truncate text-[var(--text-muted)]">{secondaryLabel}</span>
                  </span>
                  <ChevronDown size={13} className="flex-shrink-0 text-[var(--text-muted)]" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side={collapsed ? 'right' : 'top'}>
          {t('leftNav.mainWorkspace', { defaultValue: 'Main workspace' })}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align={collapsed ? 'start' : 'end'} side={collapsed ? 'right' : 'top'} className="w-72">
        {catalog.agents.map((agent) => {
          const selectedAgent = agent.id === selected?.id;
          return (
            <DropdownMenuItem
              key={agent.id}
              onClick={() => handleSelect(agent)}
              className={cn(selectedAgent && 'text-[var(--accent)]')}
            >
              <AgentIcon
                gatewayId={defaultGatewayId}
                agentId={agent.id}
                gatewayAvatarUrl={agent.identity?.avatarUrl}
                emoji={agent.identity?.emoji}
                imgClass="h-4 w-4 rounded-full object-cover"
                emojiClass="emoji-sm"
                iconSize={14}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{agentLabel(agent, agent.id)}</span>
                <span className="type-support block truncate text-[var(--text-muted)]">
                  {agent.workspace ? (agent.name ?? agent.id) : agent.id}
                </span>
              </span>
              {selectedAgent && <Check size={13} className="ml-auto flex-shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function LeftNav() {
  const { t } = useTranslation();
  useStartupMainAgentSessionSync();
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
  const setSelectedArtifact = useFileStore((s) => s.setSelectedArtifact);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const gwStatusMap = useUiStore((s) => s.gatewayStatusMap);
  const hasUpdate = useUiStore((s) => s.hasUpdate);
  const leftNavCollapsed = useUiStore((s) => s.leftNavCollapsed);
  const toggleLeftNavCollapsed = useUiStore((s) => s.toggleLeftNavCollapsed);
  const focusSearch = useUiStore((s) => s.focusSearch);
  const searchFocusTrigger = useUiStore((s) => s.searchFocusTrigger);
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const selectedMainAgentByGateway = useUiStore((s) => s.selectedMainAgentByGateway);
  const selectedMainAgentId = defaultGatewayId ? selectedMainAgentByGateway[defaultGatewayId] : undefined;

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
      setSelectedArtifact(result.id);
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

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== 'archived' &&
          !isCronTaskTitle(t.title) &&
          !isEmptyImportedPlaceholder(t) &&
          matchesSelectedMainAgent(t, defaultGatewayId ?? undefined, selectedMainAgentId),
      ),
    [defaultGatewayId, selectedMainAgentId, tasks],
  );
  const activeTasks = useMemo(() => visibleTasks.filter((t) => t.status === 'active'), [visibleTasks]);
  const completedTasks = useMemo(() => visibleTasks.filter((t) => t.status === 'completed'), [visibleTasks]);
  const activeGroups = useMemo(() => groupTasksByTime(activeTasks), [activeTasks]);
  const sessionPreviews = useSessionPreviews(visibleTasks);

  const renderTaskGroup = (groupTasks: Task[], label: string) => {
    if (groupTasks.length === 0) return null;
    return (
      <>
        <p className="type-meta px-3 py-1.5 text-[var(--text-muted)] mt-2">{label}</p>
        {groupTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            active={task.id === activeTaskId}
            onContextMenu={(e) => handleContextMenu(e, task.id, task.status)}
            editing={editingTaskId === task.id}
            onEditDone={() => setEditingTaskId(null)}
            preview={sessionPreviews[task.id]}
          />
        ))}
      </>
    );
  };

  const CollapseToggleButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleLeftNavCollapsed}
          aria-label={leftNavCollapsed ? t('leftNav.expandNav') : t('leftNav.collapseNav')}
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
            className={navActiveClass(mainView === 'teams')}
          />
          <IconButton
            icon={FolderOpen}
            tooltip={t('common.fileManager')}
            onClick={() => setMainView('files')}
            className={navActiveClass(mainView === 'files')}
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
                preview={sessionPreviews[task.id]}
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
                preview={sessionPreviews[task.id]}
              />
            ))}
          </motion.div>
        </ScrollArea>

        <div className="w-6 h-px bg-[var(--border)]" />

        <MainAgentWorkspaceSelector collapsed />

        <div className="flex flex-col items-center gap-0.5">
          <IconButton
            icon={Clock}
            tooltip={t('leftNav.scheduledTasks')}
            onClick={() => setMainView('cron')}
            className={navActiveClass(mainView === 'cron')}
          />
          <IconButton
            icon={Archive}
            tooltip={t('leftNav.archivedChats')}
            onClick={() => setMainView('archived')}
            className={navActiveClass(mainView === 'archived')}
          />
          <IconButton
            icon={Gauge}
            tooltip={t('leftNav.dashboard')}
            onClick={() => setMainView('dashboard')}
            className={navActiveClass(mainView === 'dashboard')}
          />
          <IconButton
            icon={Settings}
            tooltip={hasUpdate ? t('leftNav.updateAvailable') : t('leftNav.appSettings')}
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={navActiveClass(settingsOpen)}
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
              <Button
                size="icon-sm"
                onClick={() => startNewTask()}
                aria-label={t('common.newTask')}
                className="h-7 w-7"
              >
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
              {renderTaskGroup(activeGroups.today, t('leftNav.groupToday'))}
              {renderTaskGroup(activeGroups.yesterday, t('leftNav.groupYesterday'))}
              {renderTaskGroup(activeGroups.last7Days, t('leftNav.groupLast7Days'))}
              {renderTaskGroup(activeGroups.older, t('leftNav.groupOlder'))}
              {renderTaskGroup(completedTasks, `${t('common.completed')} (${completedTasks.length})`)}
            </motion.div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex-shrink-0 px-3" style={{ paddingBottom: 'calc(var(--density-panel-gap) / 4)' }}>
        <div className="mb-2">
          <MainAgentWorkspaceSelector />
        </div>
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
            className={navActiveClass(mainView === 'archived')}
          />
          <div className="flex-1" />
          <IconButton
            icon={Gauge}
            tooltip={t('leftNav.dashboard')}
            onClick={() => setMainView('dashboard')}
            tooltipSide="top"
            className={navActiveClass(mainView === 'dashboard')}
          />
          <IconButton
            icon={Settings}
            tooltip={hasUpdate ? t('leftNav.updateAvailable') : t('leftNav.appSettings')}
            onClick={() => setSettingsOpen(true)}
            tooltipSide="top"
            className={navActiveClass(settingsOpen)}
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
