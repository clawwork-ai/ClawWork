import type { PlatformPorts } from '@clawwork/core';

export function createElectronPorts(): PlatformPorts {
  const api = window.clawwork;

  return {
    persistence: {
      loadTasks: api.loadTasks,
      loadMessages: api.loadMessages,
      persistTask: api.persistTask,
      persistTaskUpdate: api.persistTaskUpdate,
      persistMessage: api.persistMessage,
      deleteTask: api.deleteTask,
    },
    gateway: {
      sendMessage: api.sendMessage,
      chatHistory: api.chatHistory,
      abortChat: api.abortChat,
      patchSession: api.patchSession,
      listSessionsBySpawner: api.listSessionsBySpawner,
      gatewayStatus: api.gatewayStatus,
      syncSessions: api.syncSessions,
      listGateways: api.listGateways,
      listModels: api.listModels,
      listAgents: api.listAgents,
      getToolsCatalog: api.getToolsCatalog,
      getSkillsStatus: api.getSkillsStatus,
      createSession: api.createSession,
      deleteSession: api.deleteSession,
      onGatewayEvent: api.onGatewayEvent,
      onGatewayStatus: api.onGatewayStatus,
    },
    settings: {
      getSettings: api.getSettings,
      updateSettings: api.updateSettings,
    },
    notifications: {
      sendNotification: api.sendNotification,
    },
  };
}
