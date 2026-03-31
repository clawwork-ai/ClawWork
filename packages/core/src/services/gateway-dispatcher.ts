import { parseTaskIdFromSessionKey, isSubagentSession } from '@clawwork/shared';
import type {
  ToolCall,
  ToolCallStatus,
  ModelListResponse,
  AgentListResponse,
  SkillStatusReport,
  ToolsCatalog,
} from '@clawwork/shared';
import { extractText, extractThinking, extractToolCalls, parseToolArgs } from '../protocol/parse-content.js';
import type { ChatEventPayload } from '../protocol/types.js';
import { buildAppError, formatErrorForUser, formatErrorForToast } from './error-classify.js';
import type { TranslateFn } from './error-classify.js';
import { autoTitleIfNeeded } from './auto-title.js';
import type { MessageState } from '../stores/message-store.js';
import type { GatewayTransportPort, GatewayStatusEvent } from '../ports/gateway-transport.js';

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

interface ErrorCorrelation {
  taskId: string;
  runId?: string;
  code?: string;
  source: string;
  rawMessage: string;
  displayedAt: number;
}

type NotificationSettingKey = 'taskComplete' | 'approvalRequest' | 'gatewayDisconnect';

export interface GatewayDispatcherDeps {
  gateway: GatewayTransportPort;
  getSettings: () => Promise<{
    notifications?: { taskComplete?: boolean; approvalRequest?: boolean; gatewayDisconnect?: boolean };
  } | null>;
  sendNotification: (params: { title: string; body: string; taskId?: string }) => Promise<unknown>;

  getTaskStore: () => {
    tasks: { id: string; title: string; gatewayId: string; sessionKey: string; ensemble?: boolean }[];
    updateTaskTitle: (id: string, title: string) => void;
  };
  getMessageStore: () => Pick<
    MessageState,
    | 'messagesByTask'
    | 'activeTurnBySession'
    | 'addMessage'
    | 'upsertToolCall'
    | 'appendStreamDelta'
    | 'appendThinkingDelta'
    | 'finalizeStream'
    | 'clearActiveTurn'
    | 'setProcessing'
  >;

  getActiveTaskId: () => string | null;
  markUnread: (taskId: string) => void;

  setGatewayStatusByGateway: (gatewayId: string, status: 'connected' | 'connecting' | 'disconnected') => void;
  setGatewayVersion: (gatewayId: string, version: string | undefined) => void;
  setGatewayReconnectInfo: (gatewayId: string, info: { attempt: number; max: number; gaveUp: boolean } | null) => void;
  setDefaultGatewayId: (id: string | null) => void;
  setGatewayInfoMap: (map: Record<string, { id: string; name: string; color?: string }>) => void;
  setGatewaysLoaded: (loaded: boolean) => void;
  getGatewayInfoMap: () => Record<string, { id: string; name: string; color?: string }>;

  setModelCatalogForGateway: (gatewayId: string, models: unknown[]) => void;
  setAgentCatalogForGateway: (gatewayId: string, agents: unknown[], defaultId: string) => void;
  setToolsCatalogForGateway: (gatewayId: string, catalog: ToolsCatalog) => void;
  setSkillsStatusForGateway: (gatewayId: string, report: SkillStatusReport) => void;

  onPerformerCandidate?: (taskId: string, sessionKey: string, gatewayId: string) => void;
  lookupTaskIdBySubagentKey?: (subagentKey: string) => string | undefined;
  onSubagentCandidate?: (sessionKey: string, gatewayId: string) => void;
  onApprovalRequested?: (gatewayId: string, approval: unknown) => void;
  onApprovalResolved?: (id: string) => void;
  onToast?: (type: 'error' | 'warning' | 'success', title: string, opts?: { description?: string }) => void;
  translate: TranslateFn;
  isWindowFocused: () => boolean;
  reportDebugEvent: (event: {
    domain: string;
    event: string;
    traceId?: string;
    feature?: string;
    data?: Record<string, unknown>;
  }) => void;

  hydrateFromLocal: () => Promise<void>;
  syncFromGateway: () => Promise<void>;
  syncSessionMessages: (taskId: string, sessionKeyOverride?: string) => Promise<void>;
  retrySyncPending: () => void;
}

const DEDUP_FALLBACK_WINDOW_MS = 2000;

export function createGatewayDispatcher(deps: GatewayDispatcherDeps) {
  const perTaskLastError = new Map<string, ErrorCorrelation>();
  const lifecycleErrorBuffer = new Map<
    string,
    { error: string; runId?: string; timer: ReturnType<typeof setTimeout> }
  >();
  const abortedByUser = new Set<string>();
  const connectedGateways = new Set<string>();
  let synced = false;

  function debugEvent(
    event: string,
    data: Record<string, unknown>,
    extra?: { traceId?: string; feature?: string },
  ): void {
    console.debug(`[debug] ${event}`, data);
    deps.reportDebugEvent({ domain: 'renderer', event, traceId: extra?.traceId, feature: extra?.feature, data });
  }

  function maybeNotify(
    settingKey: NotificationSettingKey,
    params: { title: string; body: string; taskId?: string },
  ): void {
    deps
      .getSettings()
      .then((settings) => {
        if (settings?.notifications?.[settingKey] === false) return;
        deps.sendNotification(params);
      })
      .catch(() => {});
  }

  function isSameFailure(a: ErrorCorrelation, existing: ErrorCorrelation): boolean {
    if (a.taskId !== existing.taskId) return false;
    if (a.runId && existing.runId) return a.runId === existing.runId;
    if (a.code && existing.code) return a.code === existing.code && a.source === existing.source;
    return false;
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

  function resolveTaskId(sessionKey: string): string | null {
    const direct = parseTaskIdFromSessionKey(sessionKey);
    if (direct) return direct;
    return deps.lookupTaskIdBySubagentKey?.(sessionKey) ?? null;
  }

  function handleChatEvent(payload: ChatEventPayload, gatewayId: string): void {
    const { sessionKey, state } = payload;
    if (!sessionKey) {
      debugEvent('renderer.event.dropped.missing_session', { state });
      return;
    }

    const taskId = resolveTaskId(sessionKey);
    if (!taskId) {
      if (isSubagentSession(sessionKey)) {
        deps.onSubagentCandidate?.(sessionKey, gatewayId);
        debugEvent('renderer.event.subagent_candidate', { gatewayId, sessionKey, state });
      } else {
        debugEvent('renderer.event.dropped.invalid_task', { sessionKey, state });
      }
      return;
    }

    const localTasks = deps.getTaskStore().tasks;
    const matchedTask = localTasks.find((t) => t.id === taskId);
    if (!matchedTask) {
      debugEvent('renderer.event.dropped.unknown_task', { taskId, sessionKey, state });
      return;
    }

    if (matchedTask.ensemble && sessionKey !== matchedTask.sessionKey) {
      deps.onPerformerCandidate?.(taskId, sessionKey, matchedTask.gatewayId);
    }

    if (taskId !== deps.getActiveTaskId()) {
      deps.markUnread(taskId);
    }

    const store = deps.getMessageStore();
    const text = extractText(payload);
    const thinking = extractThinking(payload);

    if (state === 'delta') {
      clearTaskErrorState(taskId);
      if (text) {
        store.setProcessing(sessionKey, false);
        store.appendStreamDelta(sessionKey, text);
        debugEvent('renderer.chat.delta.applied', { taskId, sessionKey, chars: text.length });
      }
      if (thinking) {
        store.appendThinkingDelta(sessionKey, thinking);
      }
      const toolCalls = extractToolCalls(payload);
      for (const tc of toolCalls) {
        store.upsertToolCall(sessionKey, taskId, tc);
      }
    } else if (state === 'final') {
      store.setProcessing(sessionKey, false);
      if (text) store.appendStreamDelta(sessionKey, text);
      if (thinking) store.appendThinkingDelta(sessionKey, thinking);
      debugEvent('renderer.chat.final.received', { taskId, sessionKey, chars: text.length });
      const toolCalls = extractToolCalls(payload);
      for (const tc of toolCalls) {
        store.upsertToolCall(sessionKey, taskId, tc);
      }
      store.finalizeStream(sessionKey, { runId: payload.runId });
      debugEvent('renderer.chat.finalized', { taskId, sessionKey });
      autoTitleIfNeeded(taskId, sessionKey, deps.getTaskStore, deps.getMessageStore);
      if (!deps.isWindowFocused() || deps.getActiveTaskId() !== taskId) {
        const task = deps.getTaskStore().tasks.find((t) => t.id === taskId);
        maybeNotify('taskComplete', {
          title: deps.translate('notifications.taskComplete'),
          body: task?.title || taskId,
          taskId,
        });
      }
      deps.syncSessionMessages(taskId, sessionKey).catch((err) => {
        debugEvent('renderer.sync.post-final.failed', {
          taskId,
          sessionKey,
          error: err instanceof Error ? err.message : 'unknown',
        });
      });
    } else if (state === 'error') {
      store.setProcessing(sessionKey, false);
      store.clearActiveTurn(sessionKey);

      const buffered = lifecycleErrorBuffer.get(taskId);
      if (buffered) {
        clearTimeout(buffered.timer);
        lifecycleErrorBuffer.delete(taskId);
      }

      const errorCode = payload.errorCode ?? payload.error?.code;
      const errorDetails = payload.error?.details;
      const rawMessage =
        payload.errorMessage ??
        payload.error?.message ??
        (extractText(payload) || deps.translate('errors.requestFailed'));
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
        const userText = formatErrorForUser(appError, deps.translate);
        store.addMessage(taskId, 'system', userText);
        const { title, description } = formatErrorForToast(appError, deps.translate);
        deps.onToast?.('error', title, { description });
        recordDisplayedError(correlation);
      }
    } else if (state === 'aborted') {
      store.setProcessing(sessionKey, false);
      store.clearActiveTurn(sessionKey);
      debugEvent('renderer.chat.aborted', { taskId, sessionKey, userInitiated: abortedByUser.has(taskId) });

      if (!abortedByUser.has(taskId)) {
        store.addMessage(
          taskId,
          'system',
          deps.translate('errors.serverAborted', { defaultValue: 'Task interrupted by server' }),
        );
      }
    }
  }

  function handleAgentEvent(payload: AgentEvent, gatewayId: string): void {
    const { sessionKey, stream, data } = payload;
    if (!sessionKey || !data) {
      debugEvent('renderer.agent.dropped.missing_fields', {
        stream,
        hasData: Boolean(data),
        hasSessionKey: Boolean(sessionKey),
      });
      return;
    }

    const taskId = resolveTaskId(sessionKey);
    if (!taskId) {
      if (isSubagentSession(sessionKey)) {
        deps.onSubagentCandidate?.(sessionKey, gatewayId);
        debugEvent('renderer.agent.subagent_candidate', { gatewayId, sessionKey, stream });
      } else {
        debugEvent('renderer.agent.dropped.invalid_task', { sessionKey, stream });
      }
      return;
    }

    const localTasks = deps.getTaskStore().tasks;
    const agentTask = localTasks.find((t) => t.id === taskId);
    if (!agentTask) {
      debugEvent('renderer.agent.dropped.unknown_task', { taskId, sessionKey, stream });
      return;
    }

    if (agentTask.ensemble && sessionKey !== agentTask.sessionKey) {
      deps.onPerformerCandidate?.(taskId, sessionKey, agentTask.gatewayId);
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

    if (taskId !== deps.getActiveTaskId()) {
      deps.markUnread(taskId);
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

    const store = deps.getMessageStore();
    const existingMsgs = store.messagesByTask[taskId] ?? [];
    for (let i = existingMsgs.length - 1; i >= 0; i--) {
      const existing = existingMsgs[i].toolCalls.find((t) => t.id === tc.id);
      if (existing) {
        tc.startedAt = existing.startedAt;
        break;
      }
    }
    if (!tc.startedAt) tc.startedAt = new Date().toISOString();

    store.upsertToolCall(sessionKey, taskId, tc);
    debugEvent('renderer.toolcall.upserted', {
      taskId,
      sessionKey,
      toolCallId: tc.id,
      status: tc.status,
      name: tc.name,
    });
  }

  function handleAgentLifecycleStream(taskId: string, sessionKey: string, data: AgentLifecycleData): void {
    const store = deps.getMessageStore();

    switch (data.phase) {
      case 'start':
        store.setProcessing(sessionKey, true);
        debugEvent('renderer.agent.lifecycle.start', { taskId, sessionKey });
        break;
      case 'end':
        store.setProcessing(sessionKey, false);
        debugEvent('renderer.agent.lifecycle.end', { taskId, sessionKey });
        break;
      case 'error': {
        store.setProcessing(sessionKey, false);
        debugEvent('renderer.agent.lifecycle.error', { taskId, sessionKey, error: data.error });
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
            store.addMessage(taskId, 'system', formatErrorForUser(appError, deps.translate));
            const { title, description } = formatErrorForToast(appError, deps.translate);
            deps.onToast?.('error', title, { description });
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
          const msg = deps.translate('agent.modelFallback', {
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

  async function fetchCatalogs(gatewayId: string): Promise<void> {
    try {
      const [modelsRes, agentsRes, toolsRes, skillsRes] = await Promise.all([
        deps.gateway.listModels(gatewayId),
        deps.gateway.listAgents(gatewayId),
        deps.gateway.getToolsCatalog(gatewayId),
        deps.gateway.getSkillsStatus(gatewayId),
      ]);
      if (modelsRes.ok && modelsRes.result) {
        const data = modelsRes.result as unknown as ModelListResponse;
        if (data.models) deps.setModelCatalogForGateway(gatewayId, data.models);
      }
      if (agentsRes.ok && agentsRes.result) {
        const data = agentsRes.result as unknown as AgentListResponse;
        if (data.agents) deps.setAgentCatalogForGateway(gatewayId, data.agents, data.defaultId);
      }
      if (toolsRes.ok && toolsRes.result) {
        const data = toolsRes.result as unknown as ToolsCatalog;
        if (data.groups) deps.setToolsCatalogForGateway(gatewayId, data);
      }
      if (skillsRes.ok && skillsRes.result) {
        const data = skillsRes.result as unknown as SkillStatusReport;
        if (Array.isArray(data.skills)) deps.setSkillsStatusForGateway(gatewayId, data);
      }
    } catch {
      console.warn('[catalogs] Failed to fetch model/agent/tools/skills catalogs');
    }
  }

  function markAbortedByUser(taskId: string): void {
    abortedByUser.add(taskId);
  }

  async function fetchAgentsForGateway(
    gatewayId: string,
    agentCatalogByGateway: Record<string, unknown>,
  ): Promise<void> {
    if (agentCatalogByGateway[gatewayId]) return;
    try {
      const res = await deps.gateway.listAgents(gatewayId);
      if (res.ok && res.result) {
        const data = res.result as unknown as AgentListResponse;
        if (data.agents) deps.setAgentCatalogForGateway(gatewayId, data.agents, data.defaultId);
      }
    } catch {
      console.warn('[catalogs] Failed to fetch agents for gateway', gatewayId);
    }
  }

  function start(): () => void {
    const removeGatewayEvent = deps.gateway.onGatewayEvent((data) => {
      debugEvent('renderer.gateway.event.received', {
        gatewayId: data.gatewayId,
        event: data.event,
        payloadKeys: Object.keys(data.payload ?? {}),
      });
      if (data.event === 'chat') {
        handleChatEvent(data.payload as unknown as ChatEventPayload, data.gatewayId);
      } else if (data.event === 'agent') {
        handleAgentEvent(data.payload as unknown as AgentEvent, data.gatewayId);
      } else if (data.event === 'exec.approval.requested') {
        deps.onApprovalRequested?.(data.gatewayId, data.payload);
      } else if (data.event === 'exec.approval.resolved') {
        deps.onApprovalResolved?.((data.payload as { id: string }).id);
      }
    });

    return removeGatewayEvent;
  }

  async function initialize(): Promise<void> {
    deps.hydrateFromLocal();

    deps.gateway.gatewayStatus().then((statusMap) => {
      for (const [gwId, info] of Object.entries(statusMap)) {
        const status = info.connected
          ? ('connected' as const)
          : info.error
            ? ('disconnected' as const)
            : ('connecting' as const);
        deps.setGatewayStatusByGateway(gwId, status);
        if (info.serverVersion) deps.setGatewayVersion(gwId, info.serverVersion);
        if (info.connected) connectedGateways.add(gwId);
      }
      if (connectedGateways.size > 0 && !synced) {
        synced = true;
        deps.syncFromGateway();
        for (const gwId of connectedGateways) fetchCatalogs(gwId);
      }
    });

    deps.gateway.listGateways().then((gateways) => {
      const defaultGw = gateways.find((g) => g.isDefault);
      if (defaultGw) deps.setDefaultGatewayId(defaultGw.id);
      else if (gateways.length > 0) deps.setDefaultGatewayId(gateways[0].id);
      const infoMap: Record<string, { id: string; name: string; color?: string }> = {};
      for (const gw of gateways) {
        infoMap[gw.id] = { id: gw.id, name: gw.name, color: gw.color };
      }
      deps.setGatewayInfoMap(infoMap);
      deps.setGatewaysLoaded(true);
    });
  }

  function handleGatewayStatus(s: GatewayStatusEvent): void {
    const wasConnected = connectedGateways.has(s.gatewayId);
    const next = s.connected ? ('connected' as const) : s.error ? ('disconnected' as const) : ('connecting' as const);
    deps.setGatewayStatusByGateway(s.gatewayId, next);
    deps.setGatewayVersion(s.gatewayId, s.serverVersion);

    if (s.reconnectAttempt !== undefined && s.maxAttempts !== undefined) {
      deps.setGatewayReconnectInfo(s.gatewayId, {
        attempt: s.reconnectAttempt,
        max: s.maxAttempts,
        gaveUp: s.gaveUp ?? false,
      });
    } else if (s.connected) {
      deps.setGatewayReconnectInfo(s.gatewayId, null);
    }

    if (s.connected && !wasConnected) {
      connectedGateways.add(s.gatewayId);
      deps.onToast?.('success', deps.translate('connection.reconnected'));
      if (!synced) {
        synced = true;
        deps.syncFromGateway();
      }
      deps.retrySyncPending();
      fetchCatalogs(s.gatewayId);
    } else if (!s.connected && wasConnected) {
      connectedGateways.delete(s.gatewayId);
      deps.onToast?.('warning', deps.translate('connection.lostConnection'), {
        description: deps.translate('connection.reconnecting'),
      });
      const gwInfo = deps.getGatewayInfoMap()[s.gatewayId];
      maybeNotify('gatewayDisconnect', {
        title: deps.translate('notifications.gatewayDisconnected'),
        body: gwInfo?.name || s.gatewayId,
      });
    }
  }

  function startGatewayStatus(): () => void {
    return deps.gateway.onGatewayStatus(handleGatewayStatus);
  }

  function reset(): void {
    perTaskLastError.clear();
    for (const b of lifecycleErrorBuffer.values()) clearTimeout(b.timer);
    lifecycleErrorBuffer.clear();
    abortedByUser.clear();
    connectedGateways.clear();
    synced = false;
  }

  return { start, initialize, startGatewayStatus, markAbortedByUser, fetchAgentsForGateway, reset };
}
