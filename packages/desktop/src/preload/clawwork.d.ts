import type {
  IpcResult as SharedIpcResult,
  ChatAttachment as SharedChatAttachment,
  Team,
  TeamHubRegistry,
  ApprovalDecision,
  CronJob,
  CronJobCreate,
  CronJobPatch,
  CronListParams,
  CronListResult,
  CronRunResult,
  CronRunsParams,
  CronStatusResult,
  SkillInstallParams,
  SkillInstallResult,
  SkillSearchParams,
  SkillSearchResult,
  SkillDetailResult,
  SkillUpdateParams,
  SkillUpdateResult,
  SkillBinsResult,
  ConfigSnapshot,
  ConfigSetParams,
  ConfigPatchParams,
  ConfigSetResult,
  ConfigPatchResult,
  ConfigSchemaResult,
  ConfigSchemaLookupResult,
  ParsedTeam,
  AgentFileSet,
} from '@clawwork/shared';

type IpcResult<T = Record<string, unknown>> = SharedIpcResult<T>;

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
  serverVersion?: string;
  reconnectAttempt?: number;
  maxAttempts?: number;
  gaveUp?: boolean;
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
  pairingCode?: string;
  authMode?: 'token' | 'password' | 'pairingCode';
  isDefault?: boolean;
  color?: string;
}

interface GatewayStatusMap {
  [gatewayId: string]: { connected: boolean; name: string; error?: string; serverVersion?: string };
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

interface NotificationSettings {
  taskComplete?: boolean;
  approvalRequest?: boolean;
  gatewayDisconnect?: boolean;
}

interface AppSettings {
  workspacePath: string;
  theme?: 'dark' | 'light' | 'auto';
  density?: 'compact' | 'comfortable' | 'spacious';
  language?: string;
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
  notifications?: NotificationSettings;
  leftNavShortcut?: 'Comma' | 'BracketLeft';
  rightPanelShortcut?: 'Period' | 'BracketRight';
  devMode?: boolean;
  teamHubRegistries?: Array<{ id: string; url: string; isOfficial: boolean }>;
}

export type VoicePermissionStatus = 'granted' | 'not-determined' | 'denied' | 'unsupported';

interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
  releaseNotes?: string | null;
}

interface UpdateDownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

interface UpdateDownloadedInfo {
  version: string;
}

interface UpdateError {
  message: string;
  code: 'dev-not-supported' | 'network' | 'no-release-metadata' | 'signature' | 'unknown';
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
  ensemble?: boolean;
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
  sessionKey?: string;
  agentId?: string;
  runId?: string;
  imageAttachments?: unknown[];
  toolCalls?: unknown[];
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

type ChatAttachment = SharedChatAttachment;

export interface ClawWorkAPI {
  sendMessage: (
    gatewayId: string,
    sessionKey: string,
    content: string,
    attachments?: ChatAttachment[],
  ) => Promise<IpcResult>;
  chatHistory: (gatewayId: string, sessionKey: string, limit?: number) => Promise<IpcResult>;
  listSessions: (gatewayId: string) => Promise<IpcResult>;
  abortChat: (gatewayId: string, sessionKey: string) => Promise<IpcResult>;

  listModels: (gatewayId: string) => Promise<IpcResult>;
  listAgents: (gatewayId: string) => Promise<IpcResult>;
  createAgent: (
    gatewayId: string,
    params: { name: string; workspace: string; emoji?: string; avatar?: string },
  ) => Promise<IpcResult>;
  updateAgent: (
    gatewayId: string,
    params: {
      agentId: string;
      name?: string;
      workspace?: string;
      model?: string;
      avatar?: string;
    },
  ) => Promise<IpcResult>;
  deleteAgent: (gatewayId: string, params: { agentId: string; deleteFiles?: boolean }) => Promise<IpcResult>;
  listAgentFiles: (gatewayId: string, agentId: string) => Promise<IpcResult>;
  getAgentFile: (gatewayId: string, agentId: string, name: string) => Promise<IpcResult>;
  setAgentFile: (gatewayId: string, agentId: string, name: string, content: string) => Promise<IpcResult>;
  patchSession: (gatewayId: string, sessionKey: string, patch: Record<string, unknown>) => Promise<IpcResult>;
  getToolsCatalog: (gatewayId: string, agentId?: string) => Promise<IpcResult>;
  getSkillsStatus: (gatewayId: string, agentId?: string) => Promise<IpcResult>;
  searchSkills: (gatewayId: string, params: SkillSearchParams) => Promise<IpcResult<SkillSearchResult>>;
  getSkillDetail: (gatewayId: string, slug: string) => Promise<IpcResult<SkillDetailResult>>;
  installSkill: (gatewayId: string, params: SkillInstallParams) => Promise<IpcResult<SkillInstallResult>>;
  updateSkill: (gatewayId: string, params: SkillUpdateParams) => Promise<IpcResult<SkillUpdateResult>>;
  getSkillBins: (gatewayId: string) => Promise<IpcResult<SkillBinsResult>>;
  getConfig: (gatewayId: string) => Promise<IpcResult<ConfigSnapshot>>;
  setConfig: (gatewayId: string, params: ConfigSetParams) => Promise<IpcResult<ConfigSetResult>>;
  patchConfig: (gatewayId: string, params: ConfigPatchParams) => Promise<IpcResult<ConfigPatchResult>>;
  getConfigSchema: (gatewayId: string) => Promise<IpcResult<ConfigSchemaResult>>;
  lookupConfigSchema: (gatewayId: string, path: string) => Promise<IpcResult<ConfigSchemaLookupResult>>;

  gatewayStatus: () => Promise<GatewayStatusMap>;
  syncSessions: () => Promise<SyncResult>;
  listGateways: () => Promise<GatewayListItem[]>;

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

  loadTasks: () => Promise<ListResult<PersistedTask>>;
  loadMessages: (taskId: string) => Promise<ListResult<PersistedMessage>>;

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
  onArtifactSaved: (callback: (artifact: unknown) => void) => () => void;
  saveCodeBlock: (params: {
    taskId: string;
    messageId: string;
    content: string;
    language?: string;
    fileName?: string;
  }) => Promise<IpcResult>;
  saveImageFromUrl: (params: { taskId: string; messageId: string; url: string; alt?: string }) => Promise<IpcResult>;
  searchArtifacts: (query: string) => Promise<IpcResult>;
  openArtifactFile: (localPath: string) => Promise<IpcResult>;
  showArtifactInFolder: (localPath: string) => Promise<IpcResult>;
  exportSessionMarkdown: (taskId: string) => Promise<IpcResult>;
  exportSessionMarkdownAs: (taskId: string) => Promise<IpcResult>;

  openWorkspaceFolder: () => Promise<void>;
  isWorkspaceConfigured: () => Promise<boolean>;
  getWorkspacePath: () => Promise<string | null>;
  getDefaultWorkspacePath: () => Promise<string>;
  browseWorkspace: () => Promise<string | null>;
  setupWorkspace: (path: string) => Promise<IpcResult>;
  changeWorkspace: (path: string) => Promise<IpcResult>;

  getSettings: () => Promise<AppSettings | null>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<{ ok: boolean; config: AppSettings }>;
  rebuildMenu: () => Promise<void>;
  getMicrophonePermission: () => Promise<{ status: VoicePermissionStatus }>;
  requestMicrophonePermission: () => Promise<{ status: VoicePermissionStatus }>;
  checkWhisper: () => Promise<{
    available: boolean;
    binaryPath: string | null;
    modelPath: string | null;
    error?: string;
  }>;
  transcribeAudio: (audio: ArrayBuffer) => Promise<{ ok: boolean; transcript?: string; error?: string }>;

  reconnectGateway: (gatewayId: string) => Promise<IpcResult>;

  addGateway: (gateway: GatewayServerConfig) => Promise<IpcResult>;
  removeGateway: (gatewayId: string) => Promise<IpcResult>;
  updateGateway: (gatewayId: string, partial: Partial<GatewayServerConfig>) => Promise<IpcResult>;
  setDefaultGateway: (gatewayId: string) => Promise<IpcResult>;
  testGateway: (url: string, auth: { token?: string; password?: string; pairingCode?: string }) => Promise<IpcResult>;

  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<UpdateCheckResult>;
  downloadUpdate: () => Promise<{ ok: boolean; error?: string }>;
  installUpdate: () => Promise<{ ok: boolean; error?: string }>;
  onUpdateDownloadProgress: (callback: (progress: UpdateDownloadProgress) => void) => () => void;
  onUpdateDownloaded: (callback: (info: UpdateDownloadedInfo) => void) => () => void;
  onUpdateError: (callback: (error: UpdateError) => void) => () => void;

  globalSearch: (query: string) => Promise<SearchResponse>;

  persistTask: (task: {
    id: string;
    sessionKey: string;
    sessionId: string;
    title: string;
    status: string;
    ensemble?: boolean;
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
    ensemble?: boolean;
    model?: string;
    modelProvider?: string;
    thinkingLevel?: string;
    inputTokens?: number;
    outputTokens?: number;
    contextTokens?: number;
    teamId?: string | null;
    updatedAt: string;
  }) => Promise<IpcResult>;

  persistMessage: (msg: {
    id: string;
    taskId: string;
    role: string;
    content: string;
    timestamp: string;
    sessionKey?: string;
    agentId?: string;
    runId?: string;
    imageAttachments?: unknown[];
    toolCalls?: unknown[];
  }) => Promise<IpcResult>;

  deleteTask: (taskId: string) => Promise<IpcResult>;

  persistRoom: (params: { taskId: string; status: string; conductorReady: boolean }) => Promise<IpcResult>;
  loadRoom: (taskId: string) => Promise<{
    ok: boolean;
    room: { taskId: string; status: string; conductorReady: boolean } | null;
    performers: Array<{
      sessionKey: string;
      taskId: string;
      agentId: string;
      agentName: string;
      emoji: string | null;
      verifiedAt: string;
    }>;
    error?: string;
  }>;
  persistPerformer: (params: {
    taskId: string;
    sessionKey: string;
    agentId: string;
    agentName: string;
    emoji?: string;
    verifiedAt: string;
  }) => Promise<IpcResult>;
  deleteRoom: (taskId: string) => Promise<IpcResult>;

  listSessionsBySpawner: (gatewayId: string, spawnedBy: string) => Promise<IpcResult>;
  createSession: (gatewayId: string, params: { key: string; agentId: string; message?: string }) => Promise<IpcResult>;

  getUsageStatus: (gatewayId: string) => Promise<IpcResult>;
  getUsageCost: (
    gatewayId: string,
    params?: { startDate?: string; endDate?: string; days?: number },
  ) => Promise<IpcResult>;
  getSessionUsage: (gatewayId: string, sessionKey: string) => Promise<IpcResult>;

  resolveExecApproval: (gatewayId: string, id: string, decision: ApprovalDecision) => Promise<IpcResult>;

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

  setWindowButtonVisibility: (visible: boolean) => void;

  getDeviceId: () => Promise<string>;

  selectContextFolder: () => Promise<IpcResult>;
  listContextFiles: (folders: string[], query?: string) => Promise<IpcResult>;
  readContextFile: (absolutePath: string, folders: string[]) => Promise<IpcResult>;
  watchContextFolder: (folderPath: string) => Promise<IpcResult>;
  unwatchContextFolder: (folderPath: string) => Promise<IpcResult>;
  onContextFilesChanged: (callback: (folderPath: string) => void) => () => void;

  quickLaunchSubmit: (message: string) => void;
  quickLaunchHide: () => void;
  getQuickLaunchConfig: () => Promise<QuickLaunchConfigResult>;
  updateQuickLaunchConfig: (enabled: boolean, shortcut?: string) => Promise<boolean>;
  onQuickLaunchSubmit: (callback: (message: string) => void) => () => void;

  sendNotification: (params: { title: string; body: string; taskId?: string }) => Promise<IpcResult>;
  onNotificationNavigateTask: (callback: (taskId: string) => void) => () => void;

  listCronJobs: (gatewayId: string, params?: CronListParams) => Promise<IpcResult<CronListResult>>;
  getCronStatus: (gatewayId: string) => Promise<IpcResult<CronStatusResult>>;
  addCronJob: (gatewayId: string, params: CronJobCreate) => Promise<IpcResult<CronJob>>;
  updateCronJob: (gatewayId: string, jobId: string, patch: CronJobPatch) => Promise<IpcResult<CronJob>>;
  removeCronJob: (gatewayId: string, jobId: string) => Promise<IpcResult>;
  runCronJob: (gatewayId: string, jobId: string, mode?: 'due' | 'force') => Promise<IpcResult<CronRunResult>>;
  listCronRuns: (gatewayId: string, params?: CronRunsParams) => Promise<IpcResult>;

  listTeams: () => Promise<IpcResult<Team[]>>;
  getTeam: (id: string) => Promise<IpcResult<Team | null>>;
  persistTeam: (team: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    gatewayId: string;
    source?: string;
    version?: string;
    hubSlug?: string;
    agents: Array<{ agentId: string; role?: string; isManager?: boolean }>;
    createdAt: string;
    updatedAt: string;
  }) => Promise<IpcResult>;
  deleteTeam: (id: string) => Promise<IpcResult>;

  saveAgentAvatar: (gatewayId: string, agentId: string, dataUrl: string) => Promise<IpcResult>;
  deleteAgentAvatar: (gatewayId: string, agentId: string) => Promise<IpcResult>;
  listLocalAvatars: (gatewayId: string) => Promise<IpcResult<{ result: string[] }>>;

  hubListRegistries: () => Promise<IpcResult<TeamHubRegistry[]>>;
  hubFetchRegistry: (id: string) => Promise<IpcResult<TeamHubRegistry>>;
  hubAddRegistry: (url: string) => Promise<IpcResult<TeamHubRegistry>>;
  hubRemoveRegistry: (id: string) => Promise<IpcResult>;
  hubDownloadTeam: (
    registryId: string,
    slug: string,
  ) => Promise<IpcResult<{ parsed: ParsedTeam; agentFiles: Record<string, AgentFileSet> }>>;
}

declare global {
  interface Window {
    clawwork: ClawWorkAPI;
  }
}
