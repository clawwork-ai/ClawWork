import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import type { ClawWorkAPI, GatewayServerConfig } from './clawwork';

function buildApi(): ClawWorkAPI {
  return {
    sendMessage: (
      gatewayId: string,
      sessionKey: string,
      content: string,
      attachments?: { mimeType: string; fileName: string; content: string }[],
    ) => ipcRenderer.invoke('ws:send-message', { gatewayId, sessionKey, content, attachments }),
    chatHistory: (gatewayId: string, sessionKey: string, limit?: number) =>
      ipcRenderer.invoke('ws:chat-history', { gatewayId, sessionKey, limit }),
    listSessions: (gatewayId: string) => ipcRenderer.invoke('ws:list-sessions', { gatewayId }),
    gatewayStatus: () => ipcRenderer.invoke('ws:gateway-status'),
    syncSessions: () => ipcRenderer.invoke('ws:sync-sessions'),
    abortChat: (gatewayId: string, sessionKey: string) =>
      ipcRenderer.invoke('ws:abort-chat', { gatewayId, sessionKey }),
    listGateways: () => ipcRenderer.invoke('ws:list-gateways'),
    listModels: (gatewayId: string) => ipcRenderer.invoke('ws:models-list', { gatewayId }),
    listAgents: (gatewayId: string) => ipcRenderer.invoke('ws:agents-list', { gatewayId }),
    patchSession: (gatewayId: string, sessionKey: string, patch: Record<string, unknown>) =>
      ipcRenderer.invoke('ws:session-patch', { gatewayId, sessionKey, patch }),
    getToolsCatalog: (gatewayId: string, agentId?: string) =>
      ipcRenderer.invoke('ws:tools-catalog', { gatewayId, agentId }),

    onGatewayEvent: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, data: unknown): void => {
        callback(data as { event: string; payload: Record<string, unknown>; gatewayId: string });
      };
      ipcRenderer.on('gateway-event', listener);
      return () => {
        ipcRenderer.removeListener('gateway-event', listener);
      };
    },
    onGatewayStatus: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, status: unknown): void => {
        callback(status as { connected: boolean; error?: string; gatewayId: string });
      };
      ipcRenderer.on('gateway-status', listener);
      return () => {
        ipcRenderer.removeListener('gateway-status', listener);
      };
    },
    onDebugEvent: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, event: unknown): void => {
        callback(
          event as {
            ts: string;
            level: 'debug' | 'info' | 'warn' | 'error';
            domain: string;
            event: string;
            data?: Record<string, unknown>;
          },
        );
      };
      ipcRenderer.on('debug-event', listener);
      return () => {
        ipcRenderer.removeListener('debug-event', listener);
      };
    },
    exportDebugBundle: (filter) => ipcRenderer.invoke('debug:export-bundle', filter),
    reportDebugEvent: (event) => ipcRenderer.send('debug:renderer-event', event),

    loadTasks: () => ipcRenderer.invoke('data:list-tasks'),
    loadMessages: (taskId: string) => ipcRenderer.invoke('data:list-messages', { taskId }),

    saveArtifact: (params: {
      taskId: string;
      sourcePath: string;
      messageId: string;
      fileName?: string;
      mediaType?: string;
    }) => ipcRenderer.invoke('artifact:save', params),
    listArtifacts: (taskId?: string) => ipcRenderer.invoke('artifact:list', { taskId }),
    getArtifact: (id: string) => ipcRenderer.invoke('artifact:get', { id }),
    readArtifactFile: (localPath: string) => ipcRenderer.invoke('artifact:read-file', { localPath }),
    onArtifactSaved: (callback: (artifact: unknown) => void) => {
      ipcRenderer.on('artifact:saved', (_event, artifact) => callback(artifact));
    },
    saveCodeBlock: (params) => ipcRenderer.invoke('artifact:save-content', params),
    saveImageFromUrl: (params) => ipcRenderer.invoke('artifact:save-image-url', params),
    searchArtifacts: (query: string) => ipcRenderer.invoke('artifact:search', { query }),

    isWorkspaceConfigured: () => ipcRenderer.invoke('workspace:is-configured') as Promise<boolean>,
    getWorkspacePath: () => ipcRenderer.invoke('workspace:get-path') as Promise<string | null>,
    getDefaultWorkspacePath: () => ipcRenderer.invoke('workspace:get-default') as Promise<string>,
    browseWorkspace: () => ipcRenderer.invoke('workspace:browse') as Promise<string | null>,
    setupWorkspace: (path: string) => ipcRenderer.invoke('workspace:setup', path),

    getSettings: () => ipcRenderer.invoke('settings:get'),
    updateSettings: (partial: Record<string, unknown>) => ipcRenderer.invoke('settings:update', partial),
    getMicrophonePermission: () => ipcRenderer.invoke('voice:get-microphone-permission'),
    requestMicrophonePermission: () => ipcRenderer.invoke('voice:request-microphone-permission'),
    checkWhisper: () => ipcRenderer.invoke('voice:check-whisper'),
    transcribeAudio: (audio: ArrayBuffer) => ipcRenderer.invoke('voice:transcribe', { audio }),

    addGateway: (gateway: GatewayServerConfig) => ipcRenderer.invoke('settings:add-gateway', gateway),
    removeGateway: (gatewayId: string) => ipcRenderer.invoke('settings:remove-gateway', gatewayId),
    updateGateway: (gatewayId: string, partial: Partial<GatewayServerConfig>) =>
      ipcRenderer.invoke('settings:update-gateway', gatewayId, partial),
    setDefaultGateway: (gatewayId: string) => ipcRenderer.invoke('settings:set-default-gateway', gatewayId),
    testGateway: (url: string, auth: { token?: string; password?: string }) =>
      ipcRenderer.invoke('settings:test-gateway', url, auth),

    checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),

    globalSearch: (query: string) => ipcRenderer.invoke('search:global', query),

    persistTask: (task: {
      id: string;
      sessionKey: string;
      sessionId: string;
      title: string;
      status: string;
      model?: string;
      modelProvider?: string;
      thinkingLevel?: string;
      inputTokens?: number;
      outputTokens?: number;
      contextTokens?: number;
      createdAt: string;
      updatedAt: string;
      tags: string[];
      artifactDir: string;
      gatewayId: string;
    }) => ipcRenderer.invoke('data:create-task', task),

    persistTaskUpdate: (params: {
      id: string;
      title?: string;
      status?: string;
      model?: string;
      modelProvider?: string;
      thinkingLevel?: string;
      inputTokens?: number;
      outputTokens?: number;
      contextTokens?: number;
      updatedAt: string;
    }) => ipcRenderer.invoke('data:update-task', params),

    persistMessage: (msg: {
      id: string;
      taskId: string;
      role: string;
      content: string;
      timestamp: string;
      imageAttachments?: unknown[];
    }) => ipcRenderer.invoke('data:create-message', msg),

    deleteTask: (taskId: string) => ipcRenderer.invoke('data:delete-task', { id: taskId }),

    getUsageStatus: (gatewayId: string) => ipcRenderer.invoke('ws:usage-status', { gatewayId }),
    getUsageCost: (gatewayId: string, params?: { startDate?: string; endDate?: string; days?: number }) =>
      ipcRenderer.invoke('ws:usage-cost', { gatewayId, ...params }),
    getSessionUsage: (gatewayId: string, sessionKey: string) =>
      ipcRenderer.invoke('ws:session-usage', { gatewayId, sessionKey }),

    resolveExecApproval: (gatewayId: string, id: string, decision: string) =>
      ipcRenderer.invoke('ws:exec-approval-resolve', { gatewayId, id, decision }),

    resetSession: (gatewayId: string, sessionKey: string, reason?: 'new' | 'reset') =>
      ipcRenderer.invoke('ws:session-reset', { gatewayId, sessionKey, reason }),
    deleteSession: (gatewayId: string, sessionKey: string) =>
      ipcRenderer.invoke('ws:session-delete', { gatewayId, sessionKey }),
    compactSession: (gatewayId: string, sessionKey: string, maxLines?: number) =>
      ipcRenderer.invoke('ws:session-compact', { gatewayId, sessionKey, maxLines }),

    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },

    updateTrayStatus: (status, tasks) => ipcRenderer.send('tray:update-status', { status, tasks: tasks ?? [] }),
    getTrayEnabled: () => ipcRenderer.invoke('tray:get-enabled') as Promise<boolean>,
    setTrayEnabled: (enabled: boolean) => ipcRenderer.invoke('tray:set-enabled', enabled) as Promise<boolean>,
    onTrayNavigateTask: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, taskId: string): void => {
        callback(taskId);
      };
      ipcRenderer.on('tray:navigate-task', listener);
      return () => {
        ipcRenderer.removeListener('tray:navigate-task', listener);
      };
    },
    onTrayOpenSettings: (callback) => {
      const listener = (): void => {
        callback();
      };
      ipcRenderer.on('tray:open-settings', listener);
      return () => {
        ipcRenderer.removeListener('tray:open-settings', listener);
      };
    },

    quickLaunchSubmit: (message: string) => ipcRenderer.send('quick-launch:submit', message),
    quickLaunchHide: () => ipcRenderer.send('quick-launch:hide'),
    getQuickLaunchConfig: () => ipcRenderer.invoke('quick-launch:get-config'),
    updateQuickLaunchConfig: (enabled: boolean, shortcut?: string) =>
      ipcRenderer.invoke('quick-launch:update-config', enabled, shortcut),
    onQuickLaunchSubmit: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, message: string): void => {
        callback(message);
      };
      ipcRenderer.on('quick-launch:submit', listener);
      return () => {
        ipcRenderer.removeListener('quick-launch:submit', listener);
      };
    },

    selectContextFolder: () => ipcRenderer.invoke('context:select-folder'),
    listContextFiles: (folders: string[], query?: string) =>
      ipcRenderer.invoke('context:list-files', { folders, query }),
    readContextFile: (absolutePath: string, folders: string[]) =>
      ipcRenderer.invoke('context:read-file', { absolutePath, folders }),
  };
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('clawwork', buildApi());
  } catch (error) {
    throw new Error(
      `[preload] Failed to expose ClawWork API: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
} else {
  throw new Error('[preload] contextIsolation must be enabled.');
}
