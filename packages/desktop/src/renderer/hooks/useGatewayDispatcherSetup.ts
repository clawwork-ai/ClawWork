import { createGatewayDispatcher } from '@clawwork/core';
import type { ExecApprovalRequest, ModelCatalogEntry, AgentInfo } from '@clawwork/shared';
import { parseAgentIdFromSessionKey, parseTaskIdFromSessionKey } from '@clawwork/shared';
import { toast } from 'sonner';
import { hydrateFromLocal, retrySyncPending, syncFromGateway, syncSessionMessages } from '../lib/session-sync';
import i18n from '../i18n';
import { composerBridge, ports, useMessageStore, useTaskStore, useUiStore, useRoomStore } from '../platform';
import { useApprovalStore } from '../stores/approvalStore';

export type GatewayDispatcher = ReturnType<typeof createGatewayDispatcher>;

let dispatcher: GatewayDispatcher | null = null;

function handlePerformerCandidate(taskId: string, sessionKey: string): void {
  if (useRoomStore.getState().lookupTaskIdBySubagentKey(sessionKey)) return;

  const room = useRoomStore.getState().rooms[taskId];
  if (!room || room.status === 'stopped') return;

  const agentId = parseAgentIdFromSessionKey(sessionKey);
  useRoomStore.getState().registerPerformerKey(taskId, sessionKey, agentId, agentId);
  void syncSessionMessages(taskId, sessionKey).catch((err) => {
    console.error('[performer] syncSessionMessages failed:', err);
  });
}

function handleSubagentCandidate(sessionKey: string, gatewayId: string): void {
  const tasks = useTaskStore.getState().tasks;
  const ensembleTasks = tasks.filter((task) => task.ensemble && task.gatewayId === gatewayId);
  if (ensembleTasks.length === 0) return;

  for (const task of ensembleTasks) {
    const room = useRoomStore.getState().rooms[task.id];
    if (!room || room.status === 'stopped') continue;

    void useRoomStore
      .getState()
      .verifyCandidates(task.id, task.gatewayId)
      .then(() => {
        if (useRoomStore.getState().lookupTaskIdBySubagentKey(sessionKey) === task.id) {
          return syncSessionMessages(task.id, sessionKey);
        }
        return undefined;
      })
      .catch((err) => {
        console.error('[subagent] verifyCandidates or syncSessionMessages failed:', err);
      });
  }
}

function handleApprovalRequested(gatewayId: string, payload: unknown): void {
  const approvalReq = payload as ExecApprovalRequest;
  useApprovalStore.getState().addApproval(gatewayId, approvalReq);
  toast.warning(i18n.t('approval.newRequest'));

  const approvalSessionKey = approvalReq.request?.sessionKey;
  const approvalTaskId = approvalSessionKey ? parseTaskIdFromSessionKey(approvalSessionKey) : null;
  if (approvalTaskId && (!document.hasFocus() || useTaskStore.getState().activeTaskId !== approvalTaskId)) {
    ports.settings
      .getSettings()
      .then((settings) => {
        if (settings?.notifications?.approvalRequest === false) return;
        ports.notifications.sendNotification({
          title: i18n.t('notifications.approvalRequired'),
          body: approvalReq.request?.commandPreview || approvalReq.request?.command || '',
          taskId: approvalTaskId,
        });
      })
      .catch((err) => {
        console.error('[approval] Failed to get settings or send notification:', err);
      });
  }
}

function getDispatcher(): GatewayDispatcher {
  if (!dispatcher) {
    dispatcher = createGatewayDispatcher({
      gateway: ports.gateway,
      getSettings: ports.settings.getSettings,
      sendNotification: (params) => ports.notifications.sendNotification(params),

      getTaskStore: () => useTaskStore.getState(),
      getMessageStore: () => useMessageStore.getState(),

      getActiveTaskId: () => useTaskStore.getState().activeTaskId,
      markUnread: (taskId) => useUiStore.getState().markUnread(taskId),

      setGatewayStatusByGateway: (gatewayId, status) =>
        useUiStore.getState().setGatewayStatusByGateway(gatewayId, status),
      setGatewayVersion: (gatewayId, version) => useUiStore.getState().setGatewayVersion(gatewayId, version),
      setGatewayReconnectInfo: (gatewayId, info) => useUiStore.getState().setGatewayReconnectInfo(gatewayId, info),
      setDefaultGatewayId: (id) => useUiStore.getState().setDefaultGatewayId(id),
      setGatewayInfoMap: (map) => useUiStore.getState().setGatewayInfoMap(map),
      setGatewaysLoaded: (loaded) => useUiStore.getState().setGatewaysLoaded(loaded),
      getGatewayInfoMap: () => useUiStore.getState().gatewayInfoMap,

      setModelCatalogForGateway: (gatewayId, models) =>
        useUiStore.getState().setModelCatalogForGateway(gatewayId, models as ModelCatalogEntry[]),
      setAgentCatalogForGateway: (gatewayId, agents, defaultId) =>
        useUiStore.getState().setAgentCatalogForGateway(gatewayId, agents as AgentInfo[], defaultId),
      setToolsCatalogForGateway: (gatewayId, catalog) =>
        useUiStore.getState().setToolsCatalogForGateway(gatewayId, catalog),
      setSkillsStatusForGateway: (gatewayId, report) =>
        useUiStore.getState().setSkillsStatusForGateway(gatewayId, report),

      lookupTaskIdBySubagentKey: (key) => useRoomStore.getState().lookupTaskIdBySubagentKey(key),
      onPerformerCandidate: (taskId, sessionKey) => handlePerformerCandidate(taskId, sessionKey),
      onSubagentCandidate: (sessionKey, gatewayId) => handleSubagentCandidate(sessionKey, gatewayId),
      onApprovalRequested: handleApprovalRequested,
      onApprovalResolved: (id) => {
        useApprovalStore.getState().removeApproval(id);
      },
      onToast: (type, title, opts) => {
        if (type === 'error') toast.error(title, opts);
        else if (type === 'warning') toast.warning(title, opts);
        else if (type === 'success') toast.success(title);
      },
      translate: (key, opts) => i18n.t(key, opts),
      isWindowFocused: () => document.hasFocus(),
      reportDebugEvent: (event) => window.clawwork.reportDebugEvent(event),

      hydrateFromLocal,
      syncFromGateway,
      syncSessionMessages,
      retrySyncPending,
    });
    composerBridge.markAbortedByUser = (taskId) => dispatcher!.markAbortedByUser(taskId);
  }

  return dispatcher;
}

export function useGatewayDispatcherSetup(): GatewayDispatcher {
  return getDispatcher();
}

export async function fetchAgentsForGateway(gatewayId: string): Promise<void> {
  const agentCatalog = useUiStore.getState().agentCatalogByGateway;
  return getDispatcher().fetchAgentsForGateway(gatewayId, agentCatalog);
}
