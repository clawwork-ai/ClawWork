import { useEffect } from 'react';
import { createGatewayDispatcher } from '@clawwork/core';
import type { ExecApprovalRequest, ModelCatalogEntry, AgentInfo } from '@clawwork/shared';
import { parseTaskIdFromSessionKey } from '@clawwork/shared';
import { toast } from 'sonner';
import i18n from '../i18n';
import { ports, composerBridge, useMessageStore, useTaskStore, useUiStore, useRoomStore } from '../platform';
import { useApprovalStore } from '../stores/approvalStore';
import { hydrateFromLocal, syncFromGateway, syncSessionMessages, retrySyncPending } from '../lib/session-sync';

let dispatcher: ReturnType<typeof createGatewayDispatcher> | null = null;

function getDispatcher() {
  if (!dispatcher) {
    dispatcher = createGatewayDispatcher({
      gateway: ports.gateway,
      getSettings: ports.settings.getSettings,
      sendNotification: (params) => ports.notifications.sendNotification(params),

      getTaskStore: () => useTaskStore.getState(),
      getMessageStore: () => useMessageStore.getState(),

      getActiveTaskId: () => useTaskStore.getState().activeTaskId,
      markUnread: (taskId) => useUiStore.getState().markUnread(taskId),

      setGatewayStatusByGateway: (gwId, status) => useUiStore.getState().setGatewayStatusByGateway(gwId, status),
      setGatewayVersion: (gwId, version) => useUiStore.getState().setGatewayVersion(gwId, version),
      setGatewayReconnectInfo: (gwId, info) => useUiStore.getState().setGatewayReconnectInfo(gwId, info),
      setDefaultGatewayId: (id) => useUiStore.getState().setDefaultGatewayId(id),
      setGatewayInfoMap: (map) => useUiStore.getState().setGatewayInfoMap(map),
      setGatewaysLoaded: (loaded) => useUiStore.getState().setGatewaysLoaded(loaded),
      getGatewayInfoMap: () => useUiStore.getState().gatewayInfoMap,

      setModelCatalogForGateway: (gwId, models) =>
        useUiStore.getState().setModelCatalogForGateway(gwId, models as ModelCatalogEntry[]),
      setAgentCatalogForGateway: (gwId, agents, defaultId) =>
        useUiStore.getState().setAgentCatalogForGateway(gwId, agents as AgentInfo[], defaultId),
      setToolsCatalogForGateway: (gwId, catalog) => useUiStore.getState().setToolsCatalogForGateway(gwId, catalog),
      setSkillsStatusForGateway: (gwId, report) => useUiStore.getState().setSkillsStatusForGateway(gwId, report),

      lookupTaskIdBySubagentKey: (key) => useRoomStore.getState().lookupTaskIdBySubagentKey(key),
      onSubagentCandidate: (sessionKey, gatewayId) => {
        const tasks = useTaskStore.getState().tasks;
        const ensembleTasks = tasks.filter((t) => t.ensemble && t.gatewayId === gatewayId);
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
            .catch(() => {});
        }
      },
      onApprovalRequested: (gatewayId, payload) => {
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
            .catch(() => {});
        }
      },
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

export function useGatewayBootstrap(): void {
  useEffect(() => {
    const d = getDispatcher();
    const removeEvents = d.start();
    const removeStatus = d.startGatewayStatus();
    d.initialize();

    const unsubTasks = useTaskStore.subscribe((state, prev) => {
      if (state.tasks.length > 0 && prev.tasks.length === 0) {
        for (const task of state.tasks) {
          if (!task.ensemble) continue;
          useRoomStore.getState().hydrateRoom(task.id, task.sessionKey);
        }
      }
    });

    const removeDebug = window.clawwork.onDebugEvent(() => {});

    return () => {
      removeEvents();
      removeStatus();
      removeDebug();
      unsubTasks();
      d.reset();
    };
  }, []);
}

export async function fetchAgentsForGateway(gatewayId: string): Promise<void> {
  const agentCatalog = useUiStore.getState().agentCatalogByGateway;
  return getDispatcher().fetchAgentsForGateway(gatewayId, agentCatalog);
}
