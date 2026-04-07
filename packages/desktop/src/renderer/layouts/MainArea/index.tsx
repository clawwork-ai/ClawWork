import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import ConnectionBanner from '@/components/ConnectionBanner';
import { AnimatePresence } from 'framer-motion';
import {
  PanelRightOpen,
  PanelRightClose,
  Archive,
  ArchiveRestore,
  Search,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { parseAgentIdFromSessionKey } from '@clawwork/shared';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore, EMPTY_MESSAGES, activeTurnToMessage } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import { useRoomStore } from '@/stores/roomStore';
import { cn, formatRelativeTime, formatTokenCount, formatCost } from '@/lib/utils';
import WindowTitlebar from '@/components/semantic/WindowTitlebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import ChatMessage from '@/components/ChatMessage';
import StreamingMessage from '@/components/StreamingMessage';
import ThinkingIndicator from '@/components/ThinkingIndicator';
import ChatInput from '@/components/ChatInput';
import ImageLightbox from '@/components/ImageLightbox';
import FilePreviewModal from '@/components/FilePreviewModal';
import EnsembleAgentBar from '@/components/EnsembleAgentBar';
import FileBrowser from '../FileBrowser';
import CronPanel from '@/layouts/CronPanel';
import TeamsPanel from '@/layouts/TeamsPanel';
import { useUsageStore } from '@/stores/usageStore';
import DataTable, { type DataTableColumn } from '@/components/data-display/DataTable';
import EmptyState from '@/components/semantic/EmptyState';
import StatusTag from '@/components/semantic/StatusTag';
import WelcomeScreen from './WelcomeScreen';

const STICK_TO_BOTTOM_THRESHOLD_PX = 60;
const MAX_HEADER_TITLE_LENGTH = 120;

interface MainAreaProps {
  onTogglePanel: () => void;
}

interface ArchivedTaskRow {
  id: string;
  title: string;
  gatewayName: string;
  updatedAt: string;
}

interface AssistantIdentity {
  agentName?: string;
  agentEmoji?: string;
  localAvatarUrl?: string;
  gatewayAvatarUrl?: string;
  agentRoleLabel?: string;
}

function buildLocalAvatarUrl(gatewayId: string | undefined, agentId: string | undefined): string | undefined {
  if (!gatewayId || !agentId) return undefined;
  return `clawwork-avatar://${gatewayId}/${agentId}`;
}

function resolveAssistantIdentity({
  task,
  sessionKey,
  agentId,
  gatewayId,
  performerBySessionKey,
  performerByAgentId,
  catalogAgentById,
  conductorLabel,
}: {
  task?: { sessionKey: string; agentId?: string; ensemble?: boolean };
  sessionKey?: string;
  agentId?: string;
  gatewayId?: string;
  performerBySessionKey: Map<string, { sessionKey: string; agentId: string; agentName: string; emoji?: string }>;
  performerByAgentId: Map<string, { sessionKey: string; agentId: string; agentName: string; emoji?: string }>;
  catalogAgentById: Map<string, { id: string; name?: string; identity?: { emoji?: string; avatarUrl?: string } }>;
  conductorLabel: string;
}): AssistantIdentity {
  const resolvedAgentId = agentId ?? (sessionKey ? parseAgentIdFromSessionKey(sessionKey) : undefined);
  const conductorAgentId =
    task?.agentId ?? (task?.sessionKey ? parseAgentIdFromSessionKey(task.sessionKey) : undefined);
  const performer =
    (sessionKey ? performerBySessionKey.get(sessionKey) : undefined) ??
    (resolvedAgentId ? performerByAgentId.get(resolvedAgentId) : undefined);
  const catalogEntry = resolvedAgentId ? catalogAgentById.get(resolvedAgentId) : undefined;
  const conductorCatalogEntry = conductorAgentId ? catalogAgentById.get(conductorAgentId) : undefined;
  const isConductor = Boolean(
    task?.ensemble &&
    ((sessionKey && sessionKey === task.sessionKey) ||
      (!sessionKey && resolvedAgentId && conductorAgentId && resolvedAgentId === conductorAgentId)),
  );

  if (isConductor) {
    const targetId = conductorAgentId ?? resolvedAgentId;
    const agentName = conductorCatalogEntry?.name ?? catalogEntry?.name ?? conductorAgentId ?? conductorLabel;
    return {
      agentName,
      agentEmoji: conductorCatalogEntry?.identity?.emoji ?? catalogEntry?.identity?.emoji,
      localAvatarUrl: buildLocalAvatarUrl(gatewayId, targetId),
      gatewayAvatarUrl: conductorCatalogEntry?.identity?.avatarUrl ?? catalogEntry?.identity?.avatarUrl,
      agentRoleLabel: agentName === conductorLabel ? undefined : conductorLabel,
    };
  }

  return {
    agentName: performer?.agentName ?? catalogEntry?.name ?? resolvedAgentId,
    agentEmoji: performer?.emoji ?? catalogEntry?.identity?.emoji,
    localAvatarUrl: buildLocalAvatarUrl(gatewayId, resolvedAgentId),
    gatewayAvatarUrl: catalogEntry?.identity?.avatarUrl,
  };
}

function ChatHeader({
  onTogglePanel,
  messageLayout,
  onToggleMessageLayout,
}: {
  onTogglePanel: () => void;
  messageLayout: 'centered' | 'wide';
  onToggleMessageLayout: () => void;
}) {
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
    const trimmed = titleDraft.trim().slice(0, MAX_HEADER_TITLE_LENGTH);
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
  const contextUsagePercent =
    contextTokens != null && contextTokens > 0 ? Math.round((contextTokens / 200_000) * 100) : null;
  const hasInputSummary = inputTokens != null;
  const hasOutputSummary = outputTokens != null;
  const hasContextSummary = contextUsagePercent != null;
  const hasCostSummary = sessionCost != null && sessionCost > 0;
  const hasUsageData = hasInputSummary || hasOutputSummary || hasContextSummary || hasCostSummary;

  return (
    <header className="titlebar-drag flex items-center justify-between px-5 h-[var(--density-toolbar-height)] border-b border-[var(--border)] flex-shrink-0">
      <div className="titlebar-no-drag flex items-center gap-2.5">
        {activeTask ? (
          <>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value.slice(0, MAX_HEADER_TITLE_LENGTH))}
                onBlur={commitTitleEdit}
                onKeyDown={handleTitleKeyDown}
                maxLength={MAX_HEADER_TITLE_LENGTH}
                className="type-label max-w-80 rounded border border-[var(--ring-accent)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[var(--text-primary)] outline-none"
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <h2
                    className="type-section-title max-w-xl cursor-pointer truncate text-[var(--text-primary)]"
                    onDoubleClick={startTitleEdit}
                  >
                    {activeTask.title || t('common.newTask')}
                  </h2>
                </TooltipTrigger>
                <TooltipContent>{t('contextMenu.rename')}</TooltipContent>
              </Tooltip>
            )}
          </>
        ) : (
          <h2 className="type-label text-[var(--text-muted)]">ClawWork</h2>
        )}
      </div>
      <div className="titlebar-no-drag flex items-center gap-1">
        {hasUsageData && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="type-meta inline-flex h-8 items-center gap-0 rounded-lg border border-[var(--border-subtle)] px-1 text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
                {inputTokens != null && (
                  <span className="inline-flex items-center gap-0.5 px-1.5">
                    <ArrowUp size={14} className="text-[var(--text-secondary)]" />
                    {formatTokenCount(inputTokens)}
                  </span>
                )}
                {hasOutputSummary && (
                  <>
                    {hasInputSummary && <span className="h-3.5 w-px bg-[var(--border-subtle)]" />}
                    <span className="inline-flex items-center gap-0.5 px-1.5">
                      <ArrowDown size={14} className="text-[var(--text-secondary)]" />
                      {formatTokenCount(outputTokens)}
                    </span>
                  </>
                )}
                {hasContextSummary && (
                  <>
                    {(hasInputSummary || hasOutputSummary) && <span className="h-3.5 w-px bg-[var(--border-subtle)]" />}
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 px-1.5',
                        contextUsagePercent >= 90
                          ? 'text-[var(--danger)]'
                          : contextUsagePercent >= 70
                            ? 'text-[var(--warning)]'
                            : 'text-[var(--accent)]',
                      )}
                    >
                      <span className="text-[var(--text-secondary)]">{t('rightPanel.contextUsage')}</span>
                      {contextUsagePercent}%
                    </span>
                  </>
                )}
                {hasCostSummary && (
                  <>
                    {(hasInputSummary || hasOutputSummary || hasContextSummary) && (
                      <span className="h-3.5 w-px bg-[var(--border-subtle)]" />
                    )}
                    <span className="inline-flex items-center gap-0.5 px-1.5 text-[var(--accent)]">
                      <DollarSign size={14} className="text-[var(--text-secondary)]" />
                      {formatCost(sessionCost)}
                    </span>
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-h-screen overflow-y-auto">
              <div className="space-y-3">
                {cost && (
                  <div className="space-y-2">
                    <div className="type-label text-[var(--text-secondary)]">
                      {t('usage.period', { days: cost.days || 30 })}
                    </div>
                    <div className="type-meta flex h-8 w-full items-center gap-0 rounded-lg border border-[var(--border-subtle)] px-1 text-[var(--text-secondary)]">
                      <span className="inline-flex min-w-0 flex-1 items-center gap-0.5 px-1.5 text-[var(--accent)]">
                        <DollarSign size={14} className="text-[var(--text-secondary)]" />
                        {formatCost(cost.totals.totalCost)}
                      </span>
                      <span className="h-3.5 w-px bg-[var(--border-subtle)]" />
                      <span className="inline-flex min-w-0 flex-1 items-center gap-0.5 px-1.5">
                        <ArrowUp size={14} className="text-[var(--text-secondary)]" />
                        {formatTokenCount(cost.totals.input)}
                      </span>
                      <span className="h-3.5 w-px bg-[var(--border-subtle)]" />
                      <span className="inline-flex min-w-0 flex-1 items-center gap-0.5 px-1.5">
                        <ArrowDown size={14} className="text-[var(--text-secondary)]" />
                        {formatTokenCount(cost.totals.output)}
                      </span>
                    </div>
                  </div>
                )}

                {usageStatus && usageStatus.providers.length > 0 && (
                  <div className="space-y-2 border-t border-[var(--border)] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="type-label text-[var(--text-secondary)]">{t('usage.rateLimits')}</span>
                      <button
                        onClick={() => fetchUsage(costGatewayId, sessionKey || undefined)}
                        disabled={usageLoading}
                        className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={cn(usageLoading && 'animate-spin')} />
                      </button>
                    </div>
                    {usageStatus.providers.map((provider) => (
                      <div key={provider.provider} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="type-support text-[var(--text-primary)]">{provider.displayName}</span>
                          {provider.plan ? <StatusTag tone="accent">{provider.plan}</StatusTag> : null}
                        </div>
                        {provider.error && (
                          <div className="type-meta flex items-center gap-1 text-[var(--danger)]">
                            <AlertTriangle size={10} />
                            {provider.error}
                          </div>
                        )}
                        {provider.windows.map((w, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="type-meta flex items-center justify-between text-[var(--text-muted)]">
                              <span>{w.label}</span>
                              <span className={cn(w.usedPercent >= 90 && 'text-[var(--danger)]')}>
                                {Math.round(w.usedPercent)}%
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-300',
                                  w.usedPercent >= 90
                                    ? 'bg-[var(--danger)]'
                                    : w.usedPercent >= 70
                                      ? 'bg-[var(--warning)]'
                                      : 'bg-[var(--accent)]',
                                )}
                                style={{ width: `${Math.min(100, w.usedPercent)}%` }}
                              />
                            </div>
                            {w.resetAt && (
                              <div className="type-meta text-[var(--text-muted)]">
                                {t('usage.resetsAt', { time: new Date(w.resetAt).toLocaleTimeString() })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={messageLayout === 'wide' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={onToggleMessageLayout}
            >
              <ArrowLeftRight size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {messageLayout === 'wide' ? t('mainArea.messageLayoutCentered') : t('mainArea.messageLayoutWide')}
          </TooltipContent>
        </Tooltip>
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
  const { t } = useTranslation();
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const activeTask = useTaskStore((s) => s.tasks.find((task) => task.id === s.activeTaskId));
  const activeRoom = useRoomStore((s) => (activeTaskId ? s.rooms[activeTaskId] : undefined));
  const messageLayout = useUiStore((s) => s.messageLayout);
  const messages = useMessageStore((s) =>
    activeTaskId ? (s.messagesByTask[activeTaskId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  );
  const activeTurnBySession = useMessageStore((s) => s.activeTurnBySession);
  const processingBySession = useMessageStore((s) => s.processingBySession);
  const highlightedId = useMessageStore((s) => s.highlightedMessageId);
  const setHighlightedMessage = useMessageStore((s) => s.setHighlightedMessage);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);
  const [previewFile, setPreviewFile] = useState<{ path: string; content: string } | null>(null);
  const closeFilePreview = useCallback(() => setPreviewFile(null), []);
  const handleHighlightDone = useCallback(() => setHighlightedMessage(null), [setHighlightedMessage]);
  const sessionKeys = useMemo(() => {
    if (!activeTask?.sessionKey) return [];
    return [activeTask.sessionKey, ...(activeRoom?.performers.map((performer) => performer.sessionKey) ?? [])];
  }, [activeRoom?.performers, activeTask?.sessionKey]);
  const activeTurns = useMemo(
    () =>
      sessionKeys.reduce<Array<{ sessionKey: string; turn: (typeof activeTurnBySession)[string] }>>(
        (items, sessionKey) => {
          const turn = activeTurnBySession[sessionKey];
          if (turn) items.push({ sessionKey, turn });
          return items;
        },
        [],
      ),
    [activeTurnBySession, sessionKeys],
  );
  const isProcessing = useMemo(
    () => sessionKeys.some((sessionKey) => processingBySession.has(sessionKey)),
    [processingBySession, sessionKeys],
  );
  const timelineItems = useMemo(() => {
    const messageItems = messages.map((message) => ({
      key: message.id,
      timestamp: message.timestamp,
      kind: 'message' as const,
      message,
    }));
    const turnItems = activeTurns.map(({ sessionKey, turn }) => ({
      key: `turn-${sessionKey}-${turn.id}`,
      timestamp: turn.timestamp,
      kind: 'turn' as const,
      sessionKey,
      turn,
    }));
    return [...messageItems, ...turnItems].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  }, [activeTurns, messages]);
  const performerBySessionKey = useMemo(
    () => new Map((activeRoom?.performers ?? []).map((performer) => [performer.sessionKey, performer])),
    [activeRoom?.performers],
  );
  const performerByAgentId = useMemo(
    () => new Map((activeRoom?.performers ?? []).map((performer) => [performer.agentId, performer])),
    [activeRoom?.performers],
  );
  const agentCatalog = useUiStore((s) =>
    activeTask?.gatewayId ? s.agentCatalogByGateway[activeTask.gatewayId] : undefined,
  );
  const catalogAgentById = useMemo(
    () => new Map((agentCatalog?.agents ?? []).map((a) => [a.id, a])),
    [agentCatalog?.agents],
  );
  const hasRenderableActiveTurn = activeTurns.some(
    ({ turn }) => turn.finalized || turn.streamingText || turn.streamingThinking || turn.toolCalls.length > 0,
  );
  const showWelcome = !activeTask || (messages.length === 0 && !hasRenderableActiveTurn);
  const conductorLabel = t('chatMessage.conductor');

  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_TO_BOTTOM_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) return;
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeTurns.length, isProcessing]);

  if (showWelcome) {
    return (
      <>
        <div className="flex-1 px-5 pt-4 pb-0 overflow-y-auto">
          <div
            className={cn(
              messageLayout === 'centered' ? 'max-w-[var(--content-max-width)] mx-auto' : 'w-full max-w-none',
            )}
          >
            <WelcomeScreen />
          </div>
        </div>
        <ChatInput />
        <ImageLightbox src={lightboxSrc} onClose={closeLightbox} />
        <FilePreviewModal file={previewFile} onClose={closeFilePreview} />
      </>
    );
  }

  return (
    <>
      <ScrollArea viewportRef={viewportRef} className="flex-1 px-5 pt-4 pb-0" onScrollCapture={handleScroll}>
        <div
          className={cn(
            'space-y-3',
            messageLayout === 'centered' ? 'max-w-[var(--content-max-width)] mx-auto' : 'w-full max-w-none',
          )}
        >
          {timelineItems.map((item, index) => {
            if (item.kind === 'message') {
              const previous = index > 0 ? timelineItems[index - 1] : null;
              const previousRole = previous?.kind === 'message' ? previous.message.role : 'assistant';
              const identity =
                item.message.role === 'assistant'
                  ? resolveAssistantIdentity({
                      task: activeTask,
                      sessionKey: item.message.sessionKey,
                      agentId: item.message.agentId,
                      gatewayId: activeTask?.gatewayId,
                      performerBySessionKey,
                      performerByAgentId,
                      catalogAgentById,
                      conductorLabel,
                    })
                  : undefined;
              return (
                <div
                  key={item.key}
                  className={cn(index > 0 && item.message.role === 'user' && previousRole !== 'user' && 'pt-3')}
                >
                  <ChatMessage
                    message={item.message}
                    agentName={identity?.agentName}
                    agentEmoji={identity?.agentEmoji}
                    localAvatarUrl={identity?.localAvatarUrl}
                    gatewayAvatarUrl={identity?.gatewayAvatarUrl}
                    agentRoleLabel={identity?.agentRoleLabel}
                    highlighted={item.message.id === highlightedId}
                    onHighlightDone={handleHighlightDone}
                    onImageClick={setLightboxSrc}
                    onFileClick={setPreviewFile}
                  />
                </div>
              );
            }

            if (item.turn.finalized && item.turn.content) {
              const identity = resolveAssistantIdentity({
                task: activeTask,
                sessionKey: item.sessionKey,
                agentId: parseAgentIdFromSessionKey(item.sessionKey),
                gatewayId: activeTask?.gatewayId,
                performerBySessionKey,
                performerByAgentId,
                catalogAgentById,
                conductorLabel,
              });
              return (
                <ChatMessage
                  key={item.key}
                  message={activeTurnToMessage(item.turn, activeTaskId!, item.sessionKey)}
                  agentName={identity.agentName}
                  agentEmoji={identity.agentEmoji}
                  localAvatarUrl={identity.localAvatarUrl}
                  gatewayAvatarUrl={identity.gatewayAvatarUrl}
                  agentRoleLabel={identity.agentRoleLabel}
                  highlighted={false}
                  onHighlightDone={handleHighlightDone}
                  onImageClick={setLightboxSrc}
                  onFileClick={setPreviewFile}
                />
              );
            }

            if (item.turn.streamingText || item.turn.streamingThinking || item.turn.toolCalls.length > 0) {
              const identity = resolveAssistantIdentity({
                task: activeTask,
                sessionKey: item.sessionKey,
                agentId: parseAgentIdFromSessionKey(item.sessionKey),
                gatewayId: activeTask?.gatewayId,
                performerBySessionKey,
                performerByAgentId,
                catalogAgentById,
                conductorLabel,
              });
              return (
                <StreamingMessage
                  key={item.key}
                  content={item.turn.streamingText}
                  thinkingContent={item.turn.streamingThinking || undefined}
                  toolCalls={item.turn.toolCalls}
                  agentEmoji={identity.agentEmoji}
                  localAvatarUrl={identity.localAvatarUrl}
                  gatewayAvatarUrl={identity.gatewayAvatarUrl}
                  agentName={identity.agentName}
                  agentRoleLabel={identity.agentRoleLabel}
                />
              );
            }

            return null;
          })}
          <AnimatePresence>{isProcessing && !hasRenderableActiveTurn && <ThinkingIndicator />}</AnimatePresence>
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
  const rows: ArchivedTaskRow[] = archivedTasks.map((task) => ({
    id: task.id,
    title: task.title || t('common.noTitle'),
    gatewayName: gwInfoMap[task.gatewayId]?.name ?? '-',
    updatedAt: task.updatedAt,
  }));
  const columns: DataTableColumn<ArchivedTaskRow>[] = [
    {
      key: 'task',
      header: t('common.task'),
      kind: 'text',
      width: '50%',
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <MessageSquare size={14} className="shrink-0 text-[var(--text-muted)] opacity-50" />
          <span className="truncate text-[var(--text-primary)]">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'gateway',
      header: t('common.gateway'),
      kind: 'text',
      width: '24%',
      render: (row) => <span className="block truncate">{row.gatewayName}</span>,
    },
    {
      key: 'time',
      header: t('common.time'),
      kind: 'time',
      width: '18%',
      render: (row) => <span className="whitespace-nowrap">{formatRelativeTime(new Date(row.updatedAt))}</span>,
    },
    {
      key: 'action',
      header: '',
      kind: 'action',
      width: '8%',
      render: (row) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation();
                handleReactivate(row.id);
              }}
            >
              <ArchiveRestore size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('contextMenu.reactivate')}</TooltipContent>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <WindowTitlebar
        left={
          <div className="flex items-center gap-2.5">
            <Archive size={18} className="text-[var(--text-muted)]" />
            <h2 className="type-section-title text-[var(--text-primary)]">{t('leftNav.archivedChats')}</h2>
            <span className="type-support text-[var(--text-muted)]">({totalArchived})</span>
          </div>
        }
      />
      {totalArchived > 0 && (
        <div className="px-5 py-3 flex-shrink-0">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('leftNav.searchTasks')}
              className="w-full h-[var(--density-control-height)] pl-9 pr-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] glow-focus focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 px-5">
        <div className="max-w-[var(--content-max-width)]">
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            onRowClick={(row) => handleOpenTask(row.id)}
            empty={
              <EmptyState
                icon={<Archive size={24} className="text-[var(--text-muted)]" />}
                title={searchQuery.trim() ? t('search.noResults') : t('archived.empty')}
              />
            }
          />
        </div>
      </ScrollArea>
    </div>
  );
}

export default function MainArea({ onTogglePanel }: MainAreaProps) {
  const mainView = useUiStore((s) => s.mainView);
  const messageLayout = useUiStore((s) => s.messageLayout);
  const toggleMessageLayout = useUiStore((s) => s.toggleMessageLayout);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);

  return (
    <div className="flex flex-col h-full">
      <ConnectionBanner />
      {mainView === 'files' ? (
        <div className="flex-1 min-h-0">
          <FileBrowser />
        </div>
      ) : mainView === 'archived' ? (
        <div className="flex-1 min-h-0">
          <ArchivedTasks />
        </div>
      ) : mainView === 'cron' ? (
        <div className="flex-1 min-h-0">
          <CronPanel />
        </div>
      ) : mainView === 'teams' ? (
        <div className="flex-1 min-h-0">
          <TeamsPanel />
        </div>
      ) : (
        <div key={`chat-${activeTaskId ?? 'welcome'}`} className="relative flex flex-col flex-1 min-h-0">
          <ChatHeader
            onTogglePanel={onTogglePanel}
            messageLayout={messageLayout}
            onToggleMessageLayout={toggleMessageLayout}
          />
          {activeTaskId && <EnsembleAgentBar taskId={activeTaskId} />}
          <ChatContent />
        </div>
      )}
    </div>
  );
}
