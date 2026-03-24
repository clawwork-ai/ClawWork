import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import ConnectionBanner from '@/components/ConnectionBanner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelRightOpen,
  PanelRightClose,
  Archive,
  ArchiveRestore,
  Search,
  MessageSquare,
  Server,
  Bot,
  Cpu,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  MoreHorizontal,
  FileDown,
  FolderDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore, EMPTY_MESSAGES, activeTurnToMessage } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import { cn, formatRelativeTime, formatTokenCount, formatCost } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import ChatMessage from '@/components/ChatMessage';
import StreamingMessage from '@/components/StreamingMessage';
import ThinkingIndicator from '@/components/ThinkingIndicator';
import ChatInput from '@/components/ChatInput';
import ImageLightbox from '@/components/ImageLightbox';
import FilePreviewModal from '@/components/FilePreviewModal';
import FileBrowser from '../FileBrowser';
import CronPanel from '@/layouts/CronPanel';
import logo from '@/assets/logo.png';
import { exportToFiles, exportToLocal } from '@/lib/export-session';
import { useUsageStore } from '@/stores/usageStore';
import { fetchAgentsForGateway } from '@/hooks/useGatewayDispatcher';

const STICK_TO_BOTTOM_THRESHOLD_PX = 60;

interface MainAreaProps {
  onTogglePanel: () => void;
}

function WelcomeScreen() {
  const { t } = useTranslation();
  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const agentCatalogByGateway = useUiStore((s) => s.agentCatalogByGateway);
  const pendingNewTask = useTaskStore((s) => s.pendingNewTask);
  const gateways = useMemo(() => Object.values(gatewayInfoMap), [gatewayInfoMap]);
  const hasMultipleGw = gateways.length > 1;

  const [selectedGwId, setSelectedGwId] = useState(
    pendingNewTask?.gatewayId ?? defaultGatewayId ?? gateways[0]?.id ?? '',
  );
  const initialAgentId =
    pendingNewTask?.agentId ||
    agentCatalogByGateway[pendingNewTask?.gatewayId ?? defaultGatewayId ?? '']?.defaultId ||
    '';
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId);
  const [gwExpanded, setGwExpanded] = useState(false);
  const [agentExpanded, setAgentExpanded] = useState(false);

  const gwAgents = agentCatalogByGateway[selectedGwId];
  const agentCatalog = gwAgents?.agents ?? [];
  const hasAgents = agentCatalog.length > 0;
  useEffect(() => {
    if (!selectedGwId) {
      const fallback = defaultGatewayId ?? gateways[0]?.id ?? '';
      if (fallback) setSelectedGwId(fallback);
    }
  }, [defaultGatewayId, gateways, selectedGwId]);

  useEffect(() => {
    if (selectedGwId) {
      fetchAgentsForGateway(selectedGwId);
    }
  }, [selectedGwId]);

  useEffect(() => {
    if (gwAgents?.defaultId) {
      setSelectedAgentId(gwAgents.defaultId);
    }
  }, [gwAgents]);

  useEffect(() => {
    const prev = useTaskStore.getState().pendingNewTask;
    if (prev?.gatewayId === selectedGwId && prev?.agentId === selectedAgentId) return;
    useTaskStore.setState({
      pendingNewTask: { gatewayId: selectedGwId, agentId: selectedAgentId },
    });
  }, [selectedGwId, selectedAgentId]);

  const MAX_VISIBLE = 3;

  const visibleGateways = gwExpanded ? gateways : gateways.slice(0, MAX_VISIBLE);
  const hiddenGwCount = gateways.length - MAX_VISIBLE;
  const visibleAgents = agentExpanded ? agentCatalog : agentCatalog.slice(0, MAX_VISIBLE);
  const hiddenAgentCount = agentCatalog.length - MAX_VISIBLE;

  return (
    <motion.div
      {...motionPresets.fadeIn}
      className="flex flex-col items-center justify-center h-full text-center py-20"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 scale-[2.5] rounded-full bg-[var(--accent)] opacity-[0.06] blur-2xl" />
        <img src={logo} alt="ClawWork" className="relative w-16 h-16 rounded-2xl shadow-[var(--glow-accent)]" />
      </div>
      <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-1.5 tracking-tight">ClawWork</h3>
      <p className="text-sm text-[var(--text-muted)] mb-6">{t('mainArea.welcomeSubtitle')}</p>
      <p className="text-[var(--text-secondary)] max-w-sm leading-relaxed text-sm">
        {t('mainArea.welcomeDesc1')}
        <br />
        {t('mainArea.welcomeDesc2')}
      </p>

      {hasMultipleGw && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {visibleGateways.map((gw) => (
            <button
              key={gw.id}
              onClick={() => {
                setSelectedGwId(gw.id);
                setGwExpanded(false);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                'border',
                gw.id === selectedGwId
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]',
              )}
            >
              <Server size={12} />
              <span className="max-w-[100px] truncate">{gw.name}</span>
            </button>
          ))}
          {!gwExpanded && hiddenGwCount > 0 && (
            <button
              onClick={() => setGwExpanded(true)}
              className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              +{hiddenGwCount}
              <ChevronRight size={10} />
            </button>
          )}
        </div>
      )}

      {hasAgents && (
        <div className={cn('flex flex-wrap items-center justify-center gap-2', hasMultipleGw ? 'mt-3' : 'mt-6')}>
          {visibleAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgentId(agent.id);
                setAgentExpanded(false);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                'border',
                agent.id === selectedAgentId
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]',
              )}
            >
              {agent.identity?.emoji ? (
                <span className="text-sm leading-none">{agent.identity.emoji}</span>
              ) : (
                <Bot size={12} />
              )}
              <span className="max-w-[100px] truncate">{agent.name ?? agent.id}</span>
            </button>
          ))}
          {!agentExpanded && hiddenAgentCount > 0 && (
            <button
              onClick={() => setAgentExpanded(true)}
              className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              +{hiddenAgentCount}
              <ChevronRight size={10} />
            </button>
          )}
        </div>
      )}

      <a
        href="https://github.com/clawwork-ai/clawwork"
        target="_blank"
        rel="noreferrer"
        className="mt-6 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        {t('mainArea.starOnGithub')} ⭐
      </a>
    </motion.div>
  );
}

function ChatHeader({ onTogglePanel }: { onTogglePanel: () => void }) {
  const { t } = useTranslation();
  const activeTask = useTaskStore((s) => s.tasks.find((task) => task.id === s.activeTaskId));
  const updateTaskTitle = useTaskStore((s) => s.updateTaskTitle);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const startTitleEdit = useCallback(() => {
    if (!activeTask) return;
    setTitleDraft(activeTask.title);
    setEditingTitle(true);
    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
  }, [activeTask]);

  const commitTitleEdit = useCallback(() => {
    const trimmed = titleDraft.trim();
    if (activeTask && trimmed && trimmed !== activeTask.title) {
      updateTaskTitle(activeTask.id, trimmed);
    }
    setEditingTitle(false);
  }, [titleDraft, activeTask, updateTaskTitle]);

  const cancelTitleEdit = useCallback(() => {
    setEditingTitle(false);
  }, []);

  const handleTitleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitTitleEdit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelTitleEdit();
      }
    },
    [commitTitleEdit, cancelTitleEdit],
  );
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen);
  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const hasMultipleGateways = Object.keys(gatewayInfoMap).length > 1;
  const gwInfo = activeTask ? gatewayInfoMap[activeTask.gatewayId] : undefined;
  const agentInfo = useUiStore((s) => {
    if (!activeTask?.agentId) return undefined;
    const catalog = s.agentCatalogByGateway[activeTask.gatewayId];
    if (!catalog || activeTask.agentId === catalog.defaultId) return undefined;
    return catalog.agents.find((a) => a.id === activeTask.agentId);
  });
  const sessionUsage = useUsageStore((s) => s.sessionUsage);
  const cost = useUsageStore((s) => s.cost);
  const usageStatus = useUsageStore((s) => s.status);
  const usageLoading = useUsageStore((s) => s.loading);
  const fetchUsage = useUsageStore((s) => s.fetchUsage);
  const startAutoRefresh = useUsageStore((s) => s.startAutoRefresh);
  const stopAutoRefresh = useUsageStore((s) => s.stopAutoRefresh);

  const costGatewayId = activeTask?.gatewayId ?? '';
  const sessionKey = activeTask?.sessionKey ?? '';
  useEffect(() => {
    if (costGatewayId) startAutoRefresh(costGatewayId, sessionKey || undefined);
    return () => stopAutoRefresh();
  }, [costGatewayId, sessionKey, startAutoRefresh, stopAutoRefresh]);

  const inputTokens = sessionUsage?.input ?? activeTask?.inputTokens ?? null;
  const outputTokens = sessionUsage?.output ?? activeTask?.outputTokens ?? null;
  const contextTokens = activeTask?.contextTokens ?? null;
  const sessionCost = sessionUsage?.totalCost ?? null;
  const hasUsageData =
    inputTokens != null ||
    outputTokens != null ||
    (contextTokens != null && contextTokens > 0) ||
    (sessionCost != null && sessionCost > 0);

  return (
    <header className="titlebar-drag flex items-center justify-between h-12 px-5 border-b border-[var(--border)] flex-shrink-0">
      <div className="titlebar-no-drag flex items-center gap-2.5">
        {activeTask ? (
          <>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitleEdit}
                onKeyDown={handleTitleKeyDown}
                className="font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--ring-accent)] rounded px-1.5 py-0.5 outline-none max-w-[240px]"
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <h2
                    className="font-medium text-[var(--text-primary)] truncate cursor-pointer"
                    onDoubleClick={startTitleEdit}
                  >
                    {activeTask.title || t('common.newTask')}
                  </h2>
                </TooltipTrigger>
                <TooltipContent>{t('contextMenu.rename')}</TooltipContent>
              </Tooltip>
            )}
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-md',
                activeTask.status === 'active'
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
              )}
            >
              {activeTask.status === 'active' ? t('common.inProgress') : t('common.completed')}
            </span>
            {hasMultipleGateways && gwInfo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                    style={gwInfo.color ? { borderLeft: `2px solid ${gwInfo.color}` } : undefined}
                  >
                    <Server size={10} />
                    <span className="max-w-[80px] truncate">{gwInfo.name}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{gwInfo.name}</TooltipContent>
              </Tooltip>
            )}
            {agentInfo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                    {agentInfo.identity?.emoji ? (
                      <span className="text-sm leading-none">{agentInfo.identity.emoji}</span>
                    ) : (
                      <Bot size={10} />
                    )}
                    <span className="max-w-[80px] truncate">{agentInfo.name ?? agentInfo.id}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{agentInfo.name ?? agentInfo.id}</TooltipContent>
              </Tooltip>
            )}
            {activeTask?.model && (
              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                <Cpu size={10} />
                <span className="max-w-[100px] truncate">{activeTask.model}</span>
              </span>
            )}
            {hasUsageData && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded px-1 py-0.5 transition-colors cursor-pointer">
                    {inputTokens != null && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[var(--bg-tertiary)]">
                        <ArrowUp size={9} />
                        {formatTokenCount(inputTokens)}
                      </span>
                    )}
                    {outputTokens != null && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[var(--bg-tertiary)]">
                        <ArrowDown size={9} />
                        {formatTokenCount(outputTokens)}
                      </span>
                    )}
                    {contextTokens != null && contextTokens > 0 && (
                      <span className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)]">
                        ctx {Math.round((contextTokens / 200_000) * 100)}%
                      </span>
                    )}
                    {sessionCost != null && sessionCost > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--accent)]">
                        <DollarSign size={9} />
                        {formatCost(sessionCost)}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-3">
                    {sessionUsage && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('usage.sessionCost')}
                          </span>
                          <span className="text-lg font-semibold text-[var(--accent)]">
                            {formatCost(sessionUsage.totalCost)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
                          <div className="flex items-center gap-1">
                            <ArrowUp size={10} />
                            <span>
                              {t('usage.inputTokens')}: {formatTokenCount(sessionUsage.input)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ArrowDown size={10} />
                            <span>
                              {t('usage.outputTokens')}: {formatTokenCount(sessionUsage.output)}
                            </span>
                          </div>
                          {sessionUsage.cacheRead > 0 && (
                            <div>
                              {t('usage.cacheRead')}: {formatTokenCount(sessionUsage.cacheRead)}
                            </div>
                          )}
                          {sessionUsage.cacheWrite > 0 && (
                            <div>
                              {t('usage.cacheWrite')}: {formatTokenCount(sessionUsage.cacheWrite)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {t('usage.totalTokens')}: {formatTokenCount(sessionUsage.totalTokens)}
                        </div>
                        {contextTokens != null && contextTokens > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                              <span>{t('rightPanel.contextUsage')}</span>
                              <span>{Math.round((contextTokens / 200_000) * 100)}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-300',
                                  contextTokens / 200_000 >= 0.9
                                    ? 'bg-[var(--error)]'
                                    : contextTokens / 200_000 >= 0.7
                                      ? 'bg-[var(--warning)]'
                                      : 'bg-[var(--accent)]',
                                )}
                                style={{ width: `${Math.min(100, (contextTokens / 200_000) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {cost && (
                      <div className={cn('space-y-2', sessionUsage && 'border-t border-[var(--border)] pt-3')}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('usage.instanceCost')}
                          </span>
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {formatCost(cost.totals.totalCost)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[var(--text-muted)]">
                          <div>
                            {t('usage.inputTokens')}: {formatTokenCount(cost.totals.input)}
                          </div>
                          <div>
                            {t('usage.outputTokens')}: {formatTokenCount(cost.totals.output)}
                          </div>
                        </div>
                        {cost.days > 0 && (
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {t('usage.period', { days: cost.days })}
                          </div>
                        )}
                      </div>
                    )}

                    {usageStatus && usageStatus.providers.length > 0 && (
                      <div className="space-y-2 border-t border-[var(--border)] pt-3">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('usage.rateLimits')}
                        </span>
                        {usageStatus.providers.map((provider) => (
                          <div key={provider.provider} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[var(--text-primary)]">{provider.displayName}</span>
                              {provider.plan && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-dim)] text-[var(--accent)]">
                                  {provider.plan}
                                </span>
                              )}
                            </div>
                            {provider.error && (
                              <div className="text-[10px] text-[var(--error)] flex items-center gap-1">
                                <AlertTriangle size={10} />
                                {provider.error}
                              </div>
                            )}
                            {provider.windows.map((w, i) => (
                              <div key={i} className="space-y-0.5">
                                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                                  <span>{w.label}</span>
                                  <span className={cn(w.usedPercent >= 90 && 'text-[var(--error)]')}>
                                    {Math.round(w.usedPercent)}%
                                  </span>
                                </div>
                                <div className="h-1 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all duration-300',
                                      w.usedPercent >= 90
                                        ? 'bg-[var(--error)]'
                                        : w.usedPercent >= 70
                                          ? 'bg-[var(--warning)]'
                                          : 'bg-[var(--accent)]',
                                    )}
                                    style={{ width: `${Math.min(100, w.usedPercent)}%` }}
                                  />
                                </div>
                                {w.resetAt && (
                                  <div className="text-[10px] text-[var(--text-muted)]">
                                    {t('usage.resetsAt', { time: new Date(w.resetAt).toLocaleTimeString() })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end border-t border-[var(--border)] pt-2">
                      <button
                        onClick={() => fetchUsage(costGatewayId, sessionKey || undefined)}
                        disabled={usageLoading}
                        className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={cn(usageLoading && 'animate-spin')} />
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </>
        ) : (
          <h2 className="font-medium text-[var(--text-muted)]">ClawWork</h2>
        )}
      </div>
      <div className="titlebar-no-drag flex items-center gap-1">
        {activeTask && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t('mainArea.moreActions')}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToLocal(activeTask.id)}>
                <FileDown size={14} />
                {t('contextMenu.saveToMarkdown')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToFiles(activeTask.id)}>
                <FolderDown size={14} />
                {t('contextMenu.exportToFiles')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onTogglePanel}>
              {rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('mainArea.toggleContextPanel')}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

function ChatContent() {
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const activeTask = useTaskStore((s) => s.tasks.find((task) => task.id === s.activeTaskId));
  const messages = useMessageStore((s) =>
    activeTaskId ? (s.messagesByTask[activeTaskId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  );
  const activeTurn = useMessageStore((s) => (activeTaskId ? (s.activeTurnByTask[activeTaskId] ?? null) : null));
  const highlightedId = useMessageStore((s) => s.highlightedMessageId);
  const setHighlightedMessage = useMessageStore((s) => s.setHighlightedMessage);
  const isProcessing = useMessageStore((s) => (activeTaskId ? s.processingTasks.has(activeTaskId) : false));
  const viewportRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);
  const [previewFile, setPreviewFile] = useState<{ path: string; content: string } | null>(null);
  const closeFilePreview = useCallback(() => setPreviewFile(null), []);
  const handleHighlightDone = useCallback(() => setHighlightedMessage(null), [setHighlightedMessage]);

  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_TO_BOTTOM_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) return;
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeTurn, isProcessing]);

  return (
    <>
      <ScrollArea viewportRef={viewportRef} className="flex-1 px-6 py-4" onScrollCapture={handleScroll}>
        <div className="max-w-3xl mx-auto space-y-1">
          {!activeTask && <WelcomeScreen />}
          {activeTask && messages.length === 0 && !activeTurn && <WelcomeScreen />}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              highlighted={msg.id === highlightedId}
              onHighlightDone={handleHighlightDone}
              onImageClick={setLightboxSrc}
              onFileClick={setPreviewFile}
            />
          ))}
          {activeTurn?.finalized && activeTurn.content && (
            <ChatMessage
              key={`turn-${activeTurn.id}`}
              message={activeTurnToMessage(activeTurn, activeTaskId!)}
              highlighted={false}
              onHighlightDone={handleHighlightDone}
              onImageClick={setLightboxSrc}
              onFileClick={setPreviewFile}
            />
          )}
          {activeTurn &&
            !activeTurn.finalized &&
            (activeTurn.streamingText || activeTurn.streamingThinking || activeTurn.toolCalls.length > 0) && (
              <StreamingMessage
                content={activeTurn.streamingText}
                thinkingContent={activeTurn.streamingThinking || undefined}
                toolCalls={activeTurn.toolCalls}
              />
            )}
          <AnimatePresence>
            {isProcessing &&
              (!activeTurn ||
                (!activeTurn.streamingText &&
                  !activeTurn.streamingThinking &&
                  activeTurn.toolCalls.length === 0 &&
                  !activeTurn.finalized)) && <ThinkingIndicator />}
          </AnimatePresence>
        </div>
      </ScrollArea>
      <ChatInput />
      <ImageLightbox src={lightboxSrc} onClose={closeLightbox} />
      <FilePreviewModal file={previewFile} onClose={closeFilePreview} />
    </>
  );
}

function ArchivedTasks() {
  const { t } = useTranslation();
  const tasks = useTaskStore((s) => s.tasks);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);
  const setMainView = useUiStore((s) => s.setMainView);
  const gwInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const [searchQuery, setSearchQuery] = useState('');

  const archivedTasks = useMemo(() => {
    const archived = tasks.filter((task) => task.status === 'archived');
    if (!searchQuery.trim()) return archived;
    const q = searchQuery.toLowerCase();
    return archived.filter((task) => {
      const title = (task.title || '').toLowerCase();
      const gwName = (gwInfoMap[task.gatewayId]?.name || '').toLowerCase();
      return title.includes(q) || gwName.includes(q);
    });
  }, [tasks, searchQuery, gwInfoMap]);

  const totalArchived = useMemo(() => tasks.filter((task) => task.status === 'archived').length, [tasks]);

  const handleReactivate = (taskId: string): void => {
    updateTaskStatus(taskId, 'active');
  };

  const handleOpenTask = (taskId: string): void => {
    setActiveTask(taskId);
    setMainView('chat');
  };

  return (
    <div className="flex flex-col h-full pt-14">
      <header className="flex items-center gap-2.5 h-12 px-5 border-b border-[var(--border)] flex-shrink-0">
        <Archive size={18} className="text-[var(--text-muted)]" />
        <h2 className="font-medium text-[var(--text-primary)]">{t('leftNav.archivedChats')}</h2>
        <span className="text-xs text-[var(--text-muted)]">({totalArchived})</span>
      </header>
      {totalArchived > 0 && (
        <div className="px-5 py-3 flex-shrink-0">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('leftNav.searchTasks')}
              className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 px-5">
        <div className="max-w-3xl">
          {archivedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Archive size={40} className="text-[var(--text-muted)] opacity-40 mb-4" />
              <p className="text-sm text-[var(--text-muted)]">
                {searchQuery.trim() ? t('search.noResults') : t('archived.empty')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_minmax(80px,120px)_80px_32px] gap-x-3 items-center px-3 py-1.5 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                <span>{t('common.task')}</span>
                <span>Gateway</span>
                <span>{t('common.time')}</span>
                <span />
              </div>
              <AnimatePresence>
                {archivedTasks.map((task) => {
                  const gwName = gwInfoMap[task.gatewayId]?.name;
                  return (
                    <motion.div
                      key={task.id}
                      {...motionPresets.listItem}
                      exit={{ opacity: 0, x: -8 }}
                      layout
                      className="grid grid-cols-[1fr_minmax(80px,120px)_80px_32px] gap-x-3 items-center px-3 py-2 rounded-md hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                      onClick={() => handleOpenTask(task.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare size={14} className="flex-shrink-0 text-[var(--text-muted)] opacity-50" />
                        <span className="text-sm text-[var(--text-primary)] truncate">
                          {task.title || t('common.noTitle')}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--text-muted)] truncate">{gwName || '-'}</span>
                      <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {formatRelativeTime(new Date(task.updatedAt))}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReactivate(task.id);
                            }}
                          >
                            <ArchiveRestore size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('contextMenu.reactivate')}</TooltipContent>
                      </Tooltip>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function MainArea({ onTogglePanel }: MainAreaProps) {
  const mainView = useUiStore((s) => s.mainView);

  return (
    <div className="flex flex-col h-full">
      <ConnectionBanner />
      <AnimatePresence mode="wait">
        {mainView === 'files' ? (
          <motion.div key="files" {...motionPresets.fadeIn} className="flex-1 min-h-0">
            <FileBrowser />
          </motion.div>
        ) : mainView === 'archived' ? (
          <motion.div key="archived" {...motionPresets.fadeIn} className="flex-1 min-h-0">
            <ArchivedTasks />
          </motion.div>
        ) : mainView === 'cron' ? (
          <motion.div key="cron" {...motionPresets.fadeIn} className="flex-1 min-h-0">
            <CronPanel />
          </motion.div>
        ) : (
          <motion.div key="chat" {...motionPresets.fadeIn} className="flex flex-col flex-1 min-h-0">
            <ChatHeader onTogglePanel={onTogglePanel} />
            <ChatContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
