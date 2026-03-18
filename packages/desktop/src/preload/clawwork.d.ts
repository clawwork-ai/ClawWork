interface IpcResult {
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
  pairingRequired?: boolean;
}

interface ConnectionStatus {
  connected: boolean;
  error?: string;
}

interface GatewayEvent {
  event: string;
  payload: Record<string, unknown>;
  gatewayId: string;
  seq?: number;
}

interface GatewayStatusEvent {
  gatewayId: string;
  connected: boolean;
  error?: string;
}

interface DebugEvent {
  ts: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  domain: string;
  event: string;
  traceId?: string;
  feature?: string;
  message?: string;
  gatewayId?: string;
  sessionKey?: string;
  taskId?: string;
  requestId?: string;
  durationMs?: number;
  error?: { message: string; code?: string; stack?: string };
  data?: Record<string, unknown>;
}

export interface GatewayServerConfig {
  id: string;
  name: string;
  url: string;
  token?: string;
  password?: string;
  isDefault?: boolean;
  color?: string;
}

interface GatewayStatusMap {
  [gatewayId: string]: { connected: boolean; name: string; error?: string };
}

interface GatewayListItem extends GatewayServerConfig {
  connected: boolean;
}

interface QuickLaunchSettings {
  enabled: boolean;
  shortcut: string;
}

interface QuickLaunchConfigResult {
  enabled: boolean;
  shortcut: string;
  sendShortcut: string;
}

interface AppSettings {
  workspacePath: string;
  theme?: 'dark' | 'light' | 'auto';
  language?: 'en' | 'zh';
  gateways: GatewayServerConfig[];
  defaultGatewayId?: string;
  sendShortcut?: 'enter' | 'cmdEnter';
  gatewayUrl?: string;
  bootstrapToken?: string;
  password?: string;
  tlsFingerprint?: string;
  voiceInput?: {
    introSeen?: boolean;
  };
  quickLaunch?: QuickLaunchSettings;
  trayEnabled?: boolean;
  leftNavShortcut?: 'Comma' | 'BracketLeft';
  rightPanelShortcut?: 'Period' | 'BracketRight';
}

export type VoicePermissionStatus = 'granted' | 'not-determined' | 'denied' | 'unsupported';

interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
}

interface SearchResult {
  type: 'task' | 'message' | 'artifact';
  id: string;
  title: string;
  snippet: string;
  taskId?: string;
}

interface SearchResponse {
  ok: boolean;
  results?: SearchResult[];
  error?: string;
}

interface PersistedTask {
  id: string;
  sessionKey: string;
  sessionId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  artifactDir: string;
  gatewayId: string;
}

interface PersistedMessage {
  id: string;
  taskId: string;
  role: string;
  content: string;
  timestamp: string;
  imageAttachments?: unknown[];
}

interface DiscoveredSession {
  gatewayId: string;
  taskId: string;
  sessionKey: string;
  title: string;
  updatedAt: string;
  agentId: string;
  model?: string;
  modelProvider?: string;
  thinkingLevel?: string;
  inputTokens?: number;
  outputTokens?: number;
  contextTokens?: number;
  messages: { role: string; content: string; timestamp: string }[];
}

interface SyncResult {
  ok: boolean;
  discovered?: DiscoveredSession[];
  error?: string;
}

interface ListResult<T> {
  ok: boolean;
  rows?: T[];
  error?: string;
}

interface ChatAttachment {
  mimeType: string;
  fileName: string;
  content: string; // base64
}

export interface ClawWorkAPI {
  // Chat — all require gatewayId
  sendMessage: (
    gatewayId: string,
    sessionKey: string,
    content: string,
    attachments?: ChatAttachment[],
  ) => Promise<IpcResult>;
  chatHistory: (gatewayId: string, sessionKey: string, limit?: number) => Promise<IpcResult>;
  listSessions: (gatewayId: string) => Promise<IpcResult>;
  abortChat: (gatewayId: string, sessionKey: string) => Promise<IpcResult>;

  // Model / Agent / Session config
  listModels: (gatewayId: string) => Promise<IpcResult>;
  listAgents: (gatewayId: string) => Promise<IpcResult>;
  patchSession: (gatewayId: string, sessionKey: string, patch: Record<string, unknown>) => Promise<IpcResult>;
  getToolsCatalog: (gatewayId: string, agentId?: string) => Promise<IpcResult>;

  // Gateway status — returns map of all gateways
  gatewayStatus: () => Promise<GatewayStatusMap>;
  syncSessions: () => Promise<SyncResult>;
  listGateways: () => Promise<GatewayListItem[]>;

  // Push events from main process
  onGatewayEvent: (callback: (data: GatewayEvent) => void) => () => void;
  onGatewayStatus: (callback: (status: GatewayStatusEvent) => void) => () => void;
  onDebugEvent: (callback: (event: DebugEvent) => void) => () => void;
  exportDebugBundle: (filter?: {
    gatewayId?: string;
    sessionKey?: string;
    taskId?: string;
    limit?: number;
  }) => Promise<{ ok: boolean; path?: string; eventCount?: number; error?: string }>;
  reportDebugEvent: (event: {
    domain: string;
    event: string;
    traceId?: string;
    feature?: string;
    data?: Record<string, unknown>;
  }) => void;
  removeAllListeners: (channel: string) => void;

  // Data persistence
  loadTasks: () => Promise<ListResult<PersistedTask>>;
  loadMessages: (taskId: string) => Promise<ListResult<PersistedMessage>>;

  // Artifacts
  saveArtifact: (params: {
    taskId: string;
    sourcePath: string;
    messageId: string;
    fileName?: string;
    mediaType?: string;
  }) => Promise<IpcResult>;
  listArtifacts: (taskId?: string) => Promise<IpcResult>;
  getArtifact: (id: string) => Promise<IpcResult>;
  readArtifactFile: (localPath: string) => Promise<IpcResult>;
  onArtifactSaved: (callback: (artifact: unknown) => void) => void;
  saveCodeBlock: (params: {
    taskId: string;
    messageId: string;
    content: string;
    language?: string;
    fileName?: string;
  }) => Promise<IpcResult>;
  saveImageFromUrl: (params: { taskId: string; messageId: string; url: string; alt?: string }) => Promise<IpcResult>;
  searchArtifacts: (query: string) => Promise<IpcResult>;

  // Workspace
  isWorkspaceConfigured: () => Promise<boolean>;
  getWorkspacePath: () => Promise<string | null>;
  getDefaultWorkspacePath: () => Promise<string>;
  browseWorkspace: () => Promise<string | null>;
  setupWorkspace: (path: string) => Promise<IpcResult>;

  // Settings
  getSettings: () => Promise<AppSettings | null>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<{ ok: boolean; config: AppSettings }>;
  getMicrophonePermission: () => Promise<{ status: VoicePermissionStatus }>;
  requestMicrophonePermission: () => Promise<{ status: VoicePermissionStatus }>;
  checkWhisper: () => Promise<{
    available: boolean;
    binaryPath: string | null;
    modelPath: string | null;
    error?: string;
  }>;
  transcribeAudio: (audio: ArrayBuffer) => Promise<{ ok: boolean; transcript?: string; error?: string }>;

  // Gateway management
  addGateway: (gateway: GatewayServerConfig) => Promise<IpcResult>;
  removeGateway: (gatewayId: string) => Promise<IpcResult>;
  updateGateway: (gatewayId: string, partial: Partial<GatewayServerConfig>) => Promise<IpcResult>;
  setDefaultGateway: (gatewayId: string) => Promise<IpcResult>;
  testGateway: (url: string, auth: { token?: string; password?: string }) => Promise<IpcResult>;

  // Updates
  checkForUpdates: () => Promise<UpdateCheckResult>;

  // Search
  globalSearch: (query: string) => Promise<SearchResponse>;

  // Task persistence
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
  }) => Promise<IpcResult>;

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
  }) => Promise<IpcResult>;

  persistMessage: (msg: {
    id: string;
    taskId: string;
    role: string;
    content: string;
    timestamp: string;
    imageAttachments?: unknown[];
  }) => Promise<IpcResult>;

  deleteTask: (taskId: string) => Promise<IpcResult>;

  getUsageStatus: (gatewayId: string) => Promise<IpcResult>;
  getUsageCost: (
    gatewayId: string,
    params?: { startDate?: string; endDate?: string; days?: number },
  ) => Promise<IpcResult>;
  getSessionUsage: (gatewayId: string, sessionKey: string) => Promise<IpcResult>;

  resolveExecApproval: (gatewayId: string, id: string, decision: string) => Promise<IpcResult>;

  resetSession: (gatewayId: string, sessionKey: string, reason?: 'new' | 'reset') => Promise<IpcResult>;
  deleteSession: (gatewayId: string, sessionKey: string) => Promise<IpcResult>;
  compactSession: (gatewayId: string, sessionKey: string, maxLines?: number) => Promise<IpcResult>;

  updateTrayStatus: (
    status: 'idle' | 'running' | 'unread' | 'disconnected',
    tasks?: { taskId: string; title: string; snippet: string; duration: string }[],
  ) => void;
  getTrayEnabled: () => Promise<boolean>;
  setTrayEnabled: (enabled: boolean) => Promise<boolean>;
  onTrayNavigateTask: (callback: (taskId: string) => void) => () => void;
  onTrayOpenSettings: (callback: () => void) => () => void;

  selectContextFolder: () => Promise<IpcResult>;
  listContextFiles: (folders: string[], query?: string) => Promise<IpcResult>;
  readContextFile: (absolutePath: string, folders: string[]) => Promise<IpcResult>;

  quickLaunchSubmit: (message: string) => void;
  quickLaunchHide: () => void;
  getQuickLaunchConfig: () => Promise<QuickLaunchConfigResult>;
  updateQuickLaunchConfig: (enabled: boolean, shortcut?: string) => Promise<boolean>;
  onQuickLaunchSubmit: (callback: (message: string) => void) => () => void;
}

declare global {
  interface Window {
    clawwork: ClawWorkAPI;
  }
}
