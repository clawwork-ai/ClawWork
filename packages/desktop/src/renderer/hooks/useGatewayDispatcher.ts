import { useEffect, useRef } from 'react';
import { parseTaskIdFromSessionKey } from '@clawwork/shared';
import type {
  ToolCall,
  ToolCallStatus,
  ModelListResponse,
  AgentListResponse,
  ToolsCatalog,
  ExecApprovalRequest,
  ExecApprovalResolved,
} from '@clawwork/shared';
import { toast } from 'sonner';
import i18n from '../i18n';
import { useMessageStore } from '../stores/messageStore';
import { useTaskStore } from '../stores/taskStore';
import { useUiStore } from '../stores/uiStore';
import { useApprovalStore } from '../stores/approvalStore';
import { hydrateFromLocal, syncFromGateway, syncSessionMessages, retrySyncPending } from '../lib/session-sync';
import { buildAppError, formatErrorForUser, formatErrorForToast } from '../lib/error-format';

interface ErrorCorrelation {
  taskId: string;
  runId?: string;
  code?: string;
  source: string;
  rawMessage: string;
  displayedAt: number;
}

const DEDUP_FALLBACK_WINDOW_MS = 2000;

function isSameFailure(a: ErrorCorrelation, existing: ErrorCorrelation): boolean {
  if (a.taskId !== existing.taskId) return false;
  if (a.runId && existing.runId) return a.runId === existing.runId;
  if (a.code && existing.code) return a.code === existing.code && a.source === existing.source;
  return false;
}

const perTaskLastError = new Map<string, ErrorCorrelation>();
const lifecycleErrorBuffer = new Map<string, { error: string; runId?: string; timer: ReturnType<typeof setTimeout> }>();
const abortedByUser = new Set<string>();

export function markAbortedByUser(taskId: string): void {
  abortedByUser.add(taskId);
}

function shouldDisplayError(correlation: ErrorCorrelation): boolean {
  const existing = perTaskLastError.get(correlation.taskId);
  if (!existing) return true;
  if (isSameFailure(correlation, existing)) return false;
  if (Date.now() - existing.displayedAt < DEDUP_FALLBACK_WINDOW_MS) {
    if (
      !correlation.runId &&
      !existing.runId &&
      !correlation.code &&
      !existing.code &&
      correlation.source === existing.source &&
      correlation.rawMessage === existing.rawMessage
    )
      return false;
  }
  return true;
}

function recordDisplayedError(correlation: ErrorCorrelation): void {
  perTaskLastError.set(correlation.taskId, { ...correlation, displayedAt: Date.now() });
}

function clearTaskErrorState(taskId: string): void {
  perTaskLastError.delete(taskId);
  abortedByUser.delete(taskId);
  const buffered = lifecycleErrorBuffer.get(taskId);
  if (buffered) {
    clearTimeout(buffered.timer);
    lifecycleErrorBuffer.delete(taskId);
  }
}

function debugEvent(
  event: string,
  data: Record<string, unknown>,
  extra?: { traceId?: string; feature?: string },
): void {
  console.debug(`[debug] ${event}`, data);
  window.clawwork.reportDebugEvent({
    domain: 'renderer',
    event,
    traceId: extra?.traceId,
    feature: extra?.feature,
    data,
  });
}

interface ChatContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  // toolCall content blocks from Gateway
  id?: string;
  name?: string;
  arguments?: Record<string, unknown>;
}

interface ChatMessage {
  role?: string;
  content?: ChatContentBlock[];
  timestamp?: number;
}

interface ChatEventPayload {
  sessionKey: string;
  runId?: string;
  state?: 'delta' | 'final' | 'aborted' | 'error';
  message?: ChatMessage;
  content?: ChatContentBlock[];
  text?: string;
  errorMessage?: string;
  errorCode?: string;
  error?: { code?: string; message?: string; details?: Record<string, unknown> };
}

type AgentEventStream = 'lifecycle' | 'tool' | 'assistant' | 'error' | 'compaction';

interface AgentToolData {
  phase?: string;
  name?: string;
  toolCallId?: string;
  meta?: string;
  isError?: boolean;
  args?: string;
}

interface AgentLifecycleData {
  phase?: 'start' | 'end' | 'error' | 'fallback';
  error?: string;
  startedAt?: number;
  endedAt?: number;
  selectedProvider?: string;
  selectedModel?: string;
  activeProvider?: string;
  activeModel?: string;
}

interface AgentErrorData {
  reason?: string;
  expected?: number;
  received?: number;
}

interface AgentCompactionData {
  phase?: 'start' | 'end';
  willRetry?: boolean;
  completed?: boolean;
}

interface AgentEvent {
  sessionKey: string;
  runId?: string;
  stream?: AgentEventStream | string;
  seq?: number;
  ts?: number;
  data?: AgentToolData | AgentLifecycleData | AgentErrorData | AgentCompactionData;
}

/**
 * Subscribes to Gateway events and dispatches into Zustand stores.
 * Mount once at App root level.
 */
export function useGatewayEventDispatcher(): void {
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const activeTaskIdRef = useRef(activeTaskId);
  activeTaskIdRef.current = activeTaskId;

  useEffect(() => {
    const removeDebug = window.clawwork.onDebugEvent((event) => {
      console.debug(`[main-debug] ${event.event}`, event);
    });

    const handler = (data: { event: string; payload: Record<string, unknown>; gatewayId: string }): void => {
      debugEvent('renderer.gateway.event.received', {
        gatewayId: data.gatewayId,
        event: data.event,
        payloadKeys: Object.keys(data.payload ?? {}),
      });
      if (data.event === 'chat') {
        handleChatEvent(data.payload as unknown as ChatEventPayload);
      } else if (data.event === 'agent') {
        handleAgentEvent(data.payload as unknown as AgentEvent);
      } else if (data.event === 'exec.approval.requested') {
        const approvalReq = data.payload as unknown as ExecApprovalRequest;
        useApprovalStore.getState().addApproval(data.gatewayId, approvalReq);
        toast.warning(i18n.t('approval.newRequest'));
        const approvalSessionKey = approvalReq.request?.sessionKey;
        const approvalTaskId = approvalSessionKey ? parseTaskIdFromSessionKey(approvalSessionKey) : null;
        if (approvalTaskId && (!document.hasFocus() || activeTaskIdRef.current !== approvalTaskId)) {
          window.clawwork.getSettings().then((settings) => {
            if (settings?.notifications?.approvalRequest === false) return;
            window.clawwork.sendNotification({
              title: i18n.t('notifications.approvalRequired'),
              body: approvalReq.request?.commandPreview || approvalReq.request?.command || '',
              taskId: approvalTaskId,
            });
          });
        }
      } else if (data.event === 'exec.approval.resolved') {
        useApprovalStore.getState().removeApproval((data.payload as unknown as ExecApprovalResolved).id);
      }
    };

    function handleChatEvent(payload: ChatEventPayload): void {
      const { sessionKey, state } = payload;
      if (!sessionKey) {
        debugEvent('renderer.event.dropped.missing_session', { state });
        return;
      }

      const taskId = parseTaskIdFromSessionKey(sessionKey);
      if (!taskId) {
        debugEvent('renderer.event.dropped.invalid_task', { sessionKey, state });
        return;
      }

      const localTasks = useTaskStore.getState().tasks;
      if (!localTasks.some((t) => t.id === taskId)) {
        debugEvent('renderer.event.dropped.unknown_task', { taskId, sessionKey, state });
        return;
      }

      if (taskId !== activeTaskIdRef.current) {
        useUiStore.getState().markUnread(taskId);
      }

      const store = useMessageStore.getState();
      const text = extractText(payload);
      const thinking = extractThinking(payload);

      if (state === 'delta') {
        clearTaskErrorState(taskId);
        if (text) {
          store.setProcessing(taskId, false);
          store.appendStreamDelta(taskId, text);
          debugEvent('renderer.chat.delta.applied', { taskId, sessionKey, chars: text.length });
        }
        if (thinking) {
          store.appendThinkingDelta(taskId, thinking);
        }
        const toolCalls = extractToolCalls(payload);
        for (const tc of toolCalls) {
          store.upsertToolCall(taskId, tc);
        }
      } else if (state === 'final') {
        store.setProcessing(taskId, false);
        if (text) {
          store.appendStreamDelta(taskId, text);
        }
        if (thinking) {
          store.appendThinkingDelta(taskId, thinking);
        }
        debugEvent('renderer.chat.final.received', { taskId, sessionKey, chars: text.length });
        const toolCalls = extractToolCalls(payload);
        for (const tc of toolCalls) {
          store.upsertToolCall(taskId, tc);
        }
        store.finalizeStream(taskId, { runId: payload.runId });
        debugEvent('renderer.chat.finalized', { taskId, sessionKey });
        autoTitleIfNeeded(taskId);
        if (!document.hasFocus() || activeTaskIdRef.current !== taskId) {
          window.clawwork.getSettings().then((settings) => {
            if (settings?.notifications?.taskComplete === false) return;
            const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
            window.clawwork.sendNotification({
              title: i18n.t('notifications.taskComplete'),
              body: task?.title || taskId,
              taskId,
            });
          });
        }
        syncSessionMessages(taskId).catch((err) => {
          debugEvent('renderer.sync.post-final.failed', {
            taskId,
            sessionKey,
            error: err instanceof Error ? err.message : 'unknown',
          });
        });
      } else if (state === 'error') {
        store.setProcessing(taskId, false);
        store.clearActiveTurn(taskId);

        const buffered = lifecycleErrorBuffer.get(taskId);
        if (buffered) {
          clearTimeout(buffered.timer);
          lifecycleErrorBuffer.delete(taskId);
        }

        const errorCode = payload.errorCode ?? payload.error?.code;
        const errorDetails = payload.error?.details;
        const rawMessage =
          payload.errorMessage ?? payload.error?.message ?? (extractText(payload) || i18n.t('errors.requestFailed'));
        const appError = buildAppError({
          source: 'upstream',
          stage: 'stream',
          rawMessage,
          code: errorCode,
          details: errorDetails,
        });
        const correlation: ErrorCorrelation = {
          taskId,
          runId: payload.runId,
          code: errorCode,
          source: 'upstream',
          rawMessage,
          displayedAt: 0,
        };

        debugEvent('renderer.chat.error', { taskId, sessionKey, rawMessage, code: errorCode, runId: payload.runId });

        if (shouldDisplayError(correlation)) {
          const userText = formatErrorForUser(appError, i18n.t);
          store.addMessage(taskId, 'system', userText);
          const { title, description } = formatErrorForToast(appError, i18n.t);
          toast.error(title, { description });
          recordDisplayedError(correlation);
        }
      } else if (state === 'aborted') {
        store.setProcessing(taskId, false);
        store.clearActiveTurn(taskId);
        debugEvent('renderer.chat.aborted', { taskId, sessionKey, userInitiated: abortedByUser.has(taskId) });

        if (!abortedByUser.has(taskId)) {
          store.addMessage(
            taskId,
            'system',
            i18n.t('errors.serverAborted', { defaultValue: 'Task interrupted by server' }),
          );
        }
        abortedByUser.delete(taskId);
      }
    }

    function handleAgentEvent(payload: AgentEvent): void {
      const { sessionKey, stream, data } = payload;
      if (!sessionKey || !data) {
        debugEvent('renderer.agent.dropped.missing_fields', {
          stream,
          hasData: Boolean(data),
          hasSessionKey: Boolean(sessionKey),
        });
        return;
      }

      const taskId = parseTaskIdFromSessionKey(sessionKey);
      if (!taskId) {
        debugEvent('renderer.agent.dropped.invalid_task', { sessionKey, stream });
        return;
      }

      const localTasks = useTaskStore.getState().tasks;
      if (!localTasks.some((t) => t.id === taskId)) {
        debugEvent('renderer.agent.dropped.unknown_task', { taskId, sessionKey, stream });
        return;
      }

      switch (stream) {
        case 'tool':
          handleAgentToolStream(taskId, sessionKey, data as AgentToolData);
          break;
        case 'lifecycle':
          handleAgentLifecycleStream(taskId, sessionKey, data as AgentLifecycleData);
          break;
        case 'error':
          handleAgentErrorStream(taskId, sessionKey, data as AgentErrorData);
          break;
        case 'assistant':
          debugEvent('renderer.agent.assistant_stream', { taskId, sessionKey });
          break;
        case 'compaction':
          debugEvent('renderer.agent.compaction', {
            taskId,
            sessionKey,
            phase: (data as AgentCompactionData).phase,
            completed: (data as AgentCompactionData).completed,
          });
          break;
        default:
          debugEvent('renderer.agent.unknown_stream', {
            taskId,
            sessionKey,
            stream,
            topLevelKeys: data ? Object.keys(data) : [],
            phase: (data as Record<string, unknown>)?.phase,
            reason: (data as Record<string, unknown>)?.reason,
          });
          break;
      }
    }

    function handleAgentToolStream(taskId: string, sessionKey: string, data: AgentToolData): void {
      if (!data.name || !data.toolCallId) return;

      if (taskId !== activeTaskIdRef.current) {
        useUiStore.getState().markUnread(taskId);
      }

      let status: ToolCallStatus = 'running';
      if (data.phase === 'result') status = data.isError ? 'error' : 'done';
      else if (data.phase === 'error') status = 'error';

      const tc: ToolCall = {
        id: data.toolCallId,
        name: data.name,
        status,
        args: parseToolArgs(data.args),
        result: data.meta,
        startedAt: data.phase === 'update' ? new Date().toISOString() : '',
        completedAt: status !== 'running' ? new Date().toISOString() : undefined,
      };

      const store = useMessageStore.getState();
      const existingMsgs = store.messagesByTask[taskId] ?? [];
      for (let i = existingMsgs.length - 1; i >= 0; i--) {
        const existing = existingMsgs[i].toolCalls.find((t) => t.id === tc.id);
        if (existing) {
          tc.startedAt = existing.startedAt;
          break;
        }
      }
      if (!tc.startedAt) tc.startedAt = new Date().toISOString();

      store.upsertToolCall(taskId, tc);
      debugEvent('renderer.toolcall.upserted', {
        taskId,
        sessionKey,
        toolCallId: tc.id,
        status: tc.status,
        name: tc.name,
      });
    }

    function handleAgentLifecycleStream(taskId: string, sessionKey: string, data: AgentLifecycleData): void {
      const store = useMessageStore.getState();

      switch (data.phase) {
        case 'start':
          store.setProcessing(taskId, true);
          debugEvent('renderer.agent.lifecycle.start', { taskId, sessionKey });
          break;
        case 'end':
          store.setProcessing(taskId, false);
          debugEvent('renderer.agent.lifecycle.end', { taskId, sessionKey });
          break;
        case 'error': {
          store.setProcessing(taskId, false);
          debugEvent('renderer.agent.lifecycle.error', {
            taskId,
            sessionKey,
            error: data.error,
          });
          if (!data.error) break;

          const existing = lifecycleErrorBuffer.get(taskId);
          if (existing) clearTimeout(existing.timer);

          const timer = setTimeout(() => {
            lifecycleErrorBuffer.delete(taskId);
            const errorText = data.error!;
            const appError = buildAppError({ source: 'agent', stage: 'lifecycle', rawMessage: errorText });
            const correlation: ErrorCorrelation = {
              taskId,
              runId: undefined,
              source: 'agent',
              rawMessage: errorText,
              displayedAt: 0,
            };
            if (shouldDisplayError(correlation)) {
              store.addMessage(taskId, 'system', formatErrorForUser(appError, i18n.t));
              const { title, description } = formatErrorForToast(appError, i18n.t);
              toast.error(title, { description });
              recordDisplayedError(correlation);
            }
          }, DEDUP_FALLBACK_WINDOW_MS);

          lifecycleErrorBuffer.set(taskId, { error: data.error, timer });
          break;
        }
        case 'fallback':
          debugEvent('renderer.agent.lifecycle.fallback', {
            taskId,
            sessionKey,
            from: `${data.selectedProvider}/${data.selectedModel}`,
            to: `${data.activeProvider}/${data.activeModel}`,
          });
          if (data.activeModel) {
            const msg = i18n.t('agent.modelFallback', {
              model: data.activeModel,
              defaultValue: `Switched to model: ${data.activeModel}`,
            });
            store.addMessage(taskId, 'system', msg, undefined, { persist: false });
          }
          break;
      }
    }

    function handleAgentErrorStream(taskId: string, sessionKey: string, data: AgentErrorData): void {
      debugEvent('renderer.agent.stream_error', {
        taskId,
        sessionKey,
        reason: data.reason,
        expected: data.expected,
        received: data.received,
      });
    }

    const removeGatewayEvent = window.clawwork.onGatewayEvent(handler);
    return () => {
      removeGatewayEvent();
      removeDebug();
    };
  }, []);

  useEffect(() => {
    hydrateFromLocal();
  }, []);

  const connectedGatewaysRef = useRef<Set<string>>(new Set());
  const syncedRef = useRef(false);
  useEffect(() => {
    const { setGatewayStatusByGateway, setDefaultGatewayId } = useUiStore.getState();

    window.clawwork.gatewayStatus().then((statusMap) => {
      for (const [gwId, info] of Object.entries(statusMap)) {
        const status = info.connected
          ? ('connected' as const)
          : info.error
            ? ('disconnected' as const)
            : ('connecting' as const);
        setGatewayStatusByGateway(gwId, status);
        if (info.connected) {
          connectedGatewaysRef.current.add(gwId);
        }
      }
      if (connectedGatewaysRef.current.size > 0 && !syncedRef.current) {
        syncedRef.current = true;
        syncFromGateway();
        for (const gwId of connectedGatewaysRef.current) {
          fetchCatalogs(gwId);
        }
      }
    });

    window.clawwork.listGateways().then((gateways) => {
      const defaultGw = gateways.find((g) => g.isDefault);
      if (defaultGw) {
        setDefaultGatewayId(defaultGw.id);
      } else if (gateways.length > 0) {
        setDefaultGatewayId(gateways[0].id);
      }
      const infoMap: Record<string, { id: string; name: string; color?: string }> = {};
      for (const gw of gateways) {
        infoMap[gw.id] = { id: gw.id, name: gw.name, color: gw.color };
      }
      useUiStore.getState().setGatewayInfoMap(infoMap);
      useUiStore.getState().setGatewaysLoaded(true);
    });

    const removeGatewayStatus = window.clawwork.onGatewayStatus((s) => {
      const wasConnected = connectedGatewaysRef.current.has(s.gatewayId);
      const next = s.connected ? ('connected' as const) : s.error ? ('disconnected' as const) : ('connecting' as const);
      setGatewayStatusByGateway(s.gatewayId, next);

      if (s.reconnectAttempt !== undefined && s.maxAttempts !== undefined) {
        useUiStore.getState().setGatewayReconnectInfo(s.gatewayId, {
          attempt: s.reconnectAttempt,
          max: s.maxAttempts,
          gaveUp: s.gaveUp ?? false,
        });
      } else if (s.connected) {
        useUiStore.getState().setGatewayReconnectInfo(s.gatewayId, null);
      }

      if (s.connected && !wasConnected) {
        connectedGatewaysRef.current.add(s.gatewayId);
        toast.success(i18n.t('connection.reconnected'));
        if (!syncedRef.current) {
          syncedRef.current = true;
          syncFromGateway();
        }
        retrySyncPending();
        fetchCatalogs(s.gatewayId);
      } else if (!s.connected && wasConnected) {
        connectedGatewaysRef.current.delete(s.gatewayId);
        toast.warning(i18n.t('connection.lostConnection'), { description: i18n.t('connection.reconnecting') });
        window.clawwork.getSettings().then((settings) => {
          if (settings?.notifications?.gatewayDisconnect === false) return;
          const gwInfo = useUiStore.getState().gatewayInfoMap[s.gatewayId];
          window.clawwork.sendNotification({
            title: i18n.t('notifications.gatewayDisconnected'),
            body: gwInfo?.name || s.gatewayId,
          });
        });
      }
    });
    return removeGatewayStatus;
  }, []);
}

function extractText(payload: ChatEventPayload): string {
  const blocks = payload.message?.content ?? payload.content;
  if (blocks) {
    return blocks
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text!)
      .join('');
  }
  return payload.text ?? '';
}

function extractThinking(payload: ChatEventPayload): string {
  const blocks = payload.message?.content ?? payload.content;
  if (!blocks) return '';
  return blocks
    .filter((b) => b.type === 'thinking' && b.thinking)
    .map((b) => b.thinking!)
    .join('');
}

/** Extract toolCall blocks from a chat event's content array into ToolCall objects */
function extractToolCalls(payload: ChatEventPayload): ToolCall[] {
  const blocks = payload.message?.content ?? payload.content;
  if (!blocks) return [];
  const result: ToolCall[] = [];
  for (const b of blocks) {
    if (b.type === 'toolCall' && b.id && b.name) {
      result.push({
        id: b.id,
        name: b.name,
        status: 'running',
        args:
          typeof b.arguments === 'object'
            ? (b.arguments as Record<string, unknown>)
            : parseToolArgs(typeof b.arguments === 'string' ? b.arguments : undefined),
        startedAt: new Date().toISOString(),
      });
    }
  }
  return result;
}

function parseToolArgs(raw: string | undefined): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { raw };
  }
}

function autoTitleIfNeeded(taskId: string): void {
  const { tasks, updateTaskTitle } = useTaskStore.getState();
  const task = tasks.find((t) => t.id === taskId);
  if (task && !task.title) {
    const store = useMessageStore.getState();
    const msgs = store.messagesByTask[taskId] ?? [];
    const turn = store.activeTurnByTask[taskId];
    const firstAssistant =
      msgs.find((m) => m.role === 'assistant') ?? (turn?.content ? { content: turn.content } : null);
    if (firstAssistant && firstAssistant.content) {
      const title = firstAssistant.content.slice(0, 30).replace(/\n/g, ' ').trim();
      if (title) {
        updateTaskTitle(taskId, title + (firstAssistant.content.length > 30 ? '…' : ''));
      }
    }
  }
}

async function fetchCatalogs(gatewayId: string): Promise<void> {
  const { setModelCatalogForGateway, setAgentCatalogForGateway, setToolsCatalogForGateway } = useUiStore.getState();
  try {
    const [modelsRes, agentsRes, toolsRes] = await Promise.all([
      window.clawwork.listModels(gatewayId),
      window.clawwork.listAgents(gatewayId),
      window.clawwork.getToolsCatalog(gatewayId),
    ]);
    if (modelsRes.ok && modelsRes.result) {
      const data = modelsRes.result as unknown as ModelListResponse;
      if (data.models) setModelCatalogForGateway(gatewayId, data.models);
    }
    if (agentsRes.ok && agentsRes.result) {
      const data = agentsRes.result as unknown as AgentListResponse;
      if (data.agents) setAgentCatalogForGateway(gatewayId, data.agents, data.defaultId);
    }
    if (toolsRes.ok && toolsRes.result) {
      const data = toolsRes.result as unknown as ToolsCatalog;
      if (data.groups) setToolsCatalogForGateway(gatewayId, data);
    }
  } catch {
    console.warn('[catalogs] Failed to fetch model/agent/tools catalogs');
  }
}

export async function fetchAgentsForGateway(gatewayId: string): Promise<void> {
  const { setAgentCatalogForGateway, agentCatalogByGateway } = useUiStore.getState();
  if (agentCatalogByGateway[gatewayId]) return;
  try {
    const res = await window.clawwork.listAgents(gatewayId);
    if (res.ok && res.result) {
      const data = res.result as unknown as AgentListResponse;
      if (data.agents) setAgentCatalogForGateway(gatewayId, data.agents, data.defaultId);
    }
  } catch {
    console.warn('[catalogs] Failed to fetch agents for gateway', gatewayId);
  }
}
