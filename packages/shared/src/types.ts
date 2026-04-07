export type TaskStatus = 'active' | 'completed' | 'archived';

export type MessageRole = 'user' | 'assistant' | 'system';

export type ArtifactType = 'file' | 'code' | 'image' | 'link' | 'structured_data';

export type ToolCallStatus = 'running' | 'done' | 'error';

import type { GatewayAuth } from './gateway-protocol.js';

export interface GatewayServer {
  id: string;
  name: string;
  url: string;
  auth: GatewayAuth;
  isDefault: boolean;
  color?: string;
}

export type { GatewayAuth } from './gateway-protocol.js';

export interface Task {
  id: string;
  sessionKey: string;
  sessionId: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  artifactDir: string;
  gatewayId: string;
  agentId?: string;
  ensemble?: boolean;
  model?: string;
  modelProvider?: string;
  thinkingLevel?: string;
  inputTokens?: number;
  outputTokens?: number;
  contextTokens?: number;
  teamId?: string;
}

export type RoomStatus = 'active' | 'stopping' | 'stopped';

export interface RoomPerformer {
  sessionKey: string;
  agentId: string;
  agentName: string;
  emoji?: string;
  verifiedAt: string;
}

export interface TaskRoom {
  taskId: string;
  conductorSessionKey: string;
  conductorReady: boolean;
  status: RoomStatus;
  performers: RoomPerformer[];
}

export interface TeamAgent {
  agentId: string;
  role: string;
  isManager: boolean;
}

export interface Team {
  id: string;
  name: string;
  emoji: string;
  description: string;
  gatewayId: string;
  source: 'local' | 'hub';
  version: string;
  hubSlug?: string;
  agents: TeamAgent[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamHubEntry {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  version: string;
  agentCount: number;
  category: string;
  tags: string[];
  author: string;
  registryId?: string;
}

export interface TeamHubRegistry {
  id: string;
  name: string;
  description: string;
  url: string;
  isOfficial: boolean;
  teams: TeamHubEntry[];
  fetchedAt: string;
}

export interface TeamHubRegistryConfig {
  id: string;
  url: string;
  isOfficial: boolean;
}

export interface ParsedTeamAgent {
  id: string;
  name: string;
  role: 'coordinator' | 'worker';
}

export interface AgentFileSet {
  agentMd?: string;
  soulMd?: string;
  skillsJson?: string;
}

export interface ParsedTeam {
  name: string;
  description: string;
  version: string;
  agents: ParsedTeamAgent[];
  body: string;
}

export interface SkillRef {
  id: string;
  source: string;
  sourceType: 'github' | 'clawhub' | 'local';
}

export type InstallEventType =
  | 'agent_creating'
  | 'agent_created'
  | 'file_setting'
  | 'file_set'
  | 'skill_installing'
  | 'skill_installed'
  | 'team_persisting'
  | 'team_persisted'
  | 'warning'
  | 'error'
  | 'done';

export interface InstallEvent {
  type: InstallEventType;
  agentSlug?: string;
  agentId?: string;
  skillId?: string;
  fileName?: string;
  message?: string;
  progress?: { current: number; total: number };
}

export interface MessageImageAttachment {
  fileName: string;
  dataUrl: string;
}

export interface Message {
  id: string;
  taskId: string;
  role: MessageRole;
  content: string;
  artifacts: Artifact[];
  toolCalls: ToolCall[];
  imageAttachments?: MessageImageAttachment[];
  timestamp: string;
  sessionKey?: string;
  agentId?: string;
  runId?: string;
  thinkingContent?: string;
}

export interface Artifact {
  id: string;
  taskId: string;
  messageId: string;
  type: ArtifactType;
  name: string;
  filePath: string;
  localPath: string;
  mimeType: string;
  size: number;
  contentText?: string;
  createdAt: string;
}

export interface ToolCall {
  id: string;
  name: string;
  status: ToolCallStatus;
  args?: Record<string, unknown>;
  result?: string;
  startedAt: string;
  completedAt?: string;
}

export type ErrorSource = 'local' | 'gateway' | 'upstream' | 'agent' | 'tool' | 'sync' | 'db';
export type ErrorStage = 'send' | 'stream' | 'final' | 'lifecycle' | 'sync' | 'persist';
export type Retryable = 'yes' | 'no' | 'unknown';

export interface AppError {
  source: ErrorSource;
  stage: ErrorStage;
  code?: string;
  rawMessage: string;
  details?: Record<string, unknown>;
  retryable: Retryable;
}

export interface IpcResult<T = unknown> {
  ok: boolean;
  result?: T;
  error?: string;
  errorCode?: string;
  errorDetails?: Record<string, unknown>;
  pairingRequired?: boolean;
}

export interface ChatAttachment {
  mimeType: string;
  fileName: string;
  content: string;
}

export interface AgentIdentity {
  name?: string;
  theme?: string;
  emoji?: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface AgentModelInfo {
  primary?: string;
  fallbacks?: string[];
}

export interface AgentInfo {
  id: string;
  name?: string;
  identity?: AgentIdentity;
  model?: AgentModelInfo;
}

export interface AgentListResponse {
  defaultId: string;
  mainKey: string;
  scope: string;
  agents: AgentInfo[];
}

export interface AgentCreateParams {
  name: string;
  workspace: string;
  emoji?: string;
  avatar?: string;
}

export interface AgentCreateResponse {
  agentId: string;
  name: string;
  workspace: string;
}

export interface AgentUpdateParams {
  agentId: string;
  name?: string;
  workspace?: string;
  model?: string;
  avatar?: string;
}

export interface AgentDeleteParams {
  agentId: string;
  deleteFiles?: boolean;
}

export interface AgentFileEntry {
  name: string;
  path: string;
  missing: boolean;
  size?: number;
  updatedAtMs?: number;
}

export interface AgentFilesListResponse {
  agentId: string;
  workspace: string;
  files: AgentFileEntry[];
}

export interface AgentFileContentResponse {
  agentId: string;
  file: AgentFileEntry & { content?: string };
}

export interface AgentFileSetParams {
  agentId: string;
  name: string;
  content: string;
}

export interface AgentFileSetResponse {
  ok: true;
  agentId: string;
  workspace: string;
  file: AgentFileEntry & { content?: string };
}

export interface ModelCatalogEntry {
  id: string;
  name?: string;
  provider?: string;
  reasoning?: boolean;
  contextWindow?: number;
  [key: string]: unknown;
}

export interface ModelListResponse {
  models: ModelCatalogEntry[];
}

export interface ToolEntry {
  id: string;
  label: string;
  description: string;
  source: 'core' | 'plugin';
  pluginId?: string;
  optional?: boolean;
  defaultProfiles: string[];
}

export interface ToolGroup {
  id: string;
  label: string;
  source: 'core' | 'plugin';
  pluginId?: string;
  tools: ToolEntry[];
}

export interface ToolsCatalog {
  agentId: string;
  profiles: Array<{ id: string; label: string }>;
  groups: ToolGroup[];
}

export interface SkillStatusConfigCheck {
  path: string;
  satisfied: boolean;
}

export interface SkillRequirements {
  bins: string[];
  anyBins: string[];
  env: string[];
  config: string[];
  os: string[];
}

export interface SkillInstallOption {
  id: string;
  kind: string;
  label: string;
  bins: string[];
}

export interface SkillStatusEntry {
  name: string;
  description: string;
  source: string;
  bundled: boolean;
  filePath: string;
  baseDir: string;
  skillKey: string;
  primaryEnv?: string;
  emoji?: string;
  homepage?: string;
  always: boolean;
  disabled: boolean;
  blockedByAllowlist: boolean;
  eligible: boolean;
  requirements: SkillRequirements;
  missing: SkillRequirements;
  configChecks: SkillStatusConfigCheck[];
  install: SkillInstallOption[];
}

export interface SkillStatusReport {
  workspaceDir: string;
  managedSkillsDir: string;
  skills: SkillStatusEntry[];
}

export type SkillInstallParams =
  | { name: string; installId: string; dangerouslyForceUnsafeInstall?: boolean; timeoutMs?: number }
  | { source: 'clawhub'; slug: string; version?: string; force?: boolean; timeoutMs?: number };

export interface SkillInstallResult {
  ok: boolean;
  message: string;
  stdout: string;
  stderr: string;
  code: number;
  slug?: string;
  version?: string;
  targetDir?: string;
}

export type SkillUpdateParams =
  | { skillKey: string; enabled?: boolean; apiKey?: string; env?: Record<string, string> }
  | { source: 'clawhub'; slug?: string; all?: boolean };

export interface SkillUpdateResult {
  ok: boolean;
  skillKey?: string;
  config?: Record<string, unknown>;
}

export interface SkillBinsResult {
  bins: string[];
}

export interface ConfigSnapshot {
  raw: string;
  hash: string;
  config: Record<string, unknown>;
  path: string;
}

export interface ConfigSetParams {
  raw: string;
  baseHash?: string;
}

export interface ConfigPatchParams {
  raw: string;
  baseHash?: string;
  sessionKey?: string;
  note?: string;
  restartDelayMs?: number;
}

export interface ConfigSetResult {
  ok: boolean;
  path: string;
  config: Record<string, unknown>;
}

export interface ConfigPatchResult {
  ok: boolean;
  noop?: boolean;
  path: string;
  config: Record<string, unknown>;
}

export interface ConfigSchemaResult {
  schema: unknown;
  uiHints: Record<string, unknown>;
  version: string;
  generatedAt: string;
}

export interface ConfigSchemaLookupResult {
  path: string;
  schema: unknown;
  hint?: unknown;
  hintPath?: string;
  children: Array<{ path: string; schema: unknown; hint?: unknown }>;
}

export interface SessionPatchParams {
  sessionKey: string;
  thinkingLevel?: string | null;
  fastMode?: boolean | null;
  model?: string | null;
  reasoningLevel?: string | null;
  elevatedLevel?: string | null;
  verboseLevel?: string | null;
  responseUsage?: string | null;
  label?: string | null;
}

export type FileTier = 'text' | 'image' | 'document' | 'unsupported';

export interface FileIndexEntry {
  relativePath: string;
  absolutePath: string;
  fileName: string;
  size: number;
  mtime: number;
  mimeType: string;
  tier: FileTier;
}

export interface FileReadResult {
  content: string;
  mimeType: string;
  size: number;
  truncated: boolean;
  tier: 'text' | 'image' | 'document';
}

export type ApprovalDecision = 'allow-once' | 'allow-always' | 'deny';

export interface ExecApprovalMutableFileOperand {
  argvIndex: number;
  path: string;
  sha256: string;
}

export interface ExecApprovalSystemRunBinding {
  argv: string[];
  cwd?: string | null;
  agentId?: string | null;
  sessionKey?: string | null;
  envHash?: string | null;
}

export interface ExecApprovalSystemRunPlan {
  argv: string[];
  cwd?: string | null;
  commandText: string;
  commandPreview?: string | null;
  agentId?: string | null;
  sessionKey?: string | null;
  mutableFileOperand?: ExecApprovalMutableFileOperand | null;
}

export interface ExecApprovalRequestDetails {
  command: string;
  commandPreview?: string | null;
  commandArgv?: string[];
  envKeys?: string[];
  systemRunBinding?: ExecApprovalSystemRunBinding | null;
  systemRunPlan?: ExecApprovalSystemRunPlan | null;
  cwd?: string | null;
  nodeId?: string | null;
  host?: string | null;
  security?: string | null;
  ask?: string | null;
  agentId?: string | null;
  resolvedPath?: string | null;
  sessionKey?: string | null;
  turnSourceChannel?: string | null;
  turnSourceTo?: string | null;
  turnSourceAccountId?: string | null;
  turnSourceThreadId?: string | number | null;
}

export interface ExecApprovalRequest {
  id: string;
  request: ExecApprovalRequestDetails;
  createdAtMs: number;
  expiresAtMs: number;
}

export interface ExecApprovalResolved {
  id: string;
  decision?: ApprovalDecision | null;
  resolvedBy?: string | null;
  ts?: number | null;
  request?: ExecApprovalRequestDetails | null;
}

export type UsageProviderId =
  | 'anthropic'
  | 'github-copilot'
  | 'google-gemini-cli'
  | 'minimax'
  | 'openai-codex'
  | 'xiaomi'
  | 'zai';

export interface UsageWindow {
  label: string;
  usedPercent: number;
  resetAt?: number;
}

export interface ProviderUsageSnapshot {
  provider: UsageProviderId;
  displayName: string;
  windows: UsageWindow[];
  plan?: string;
  error?: string;
}

export interface UsageStatus {
  updatedAt: number;
  providers: ProviderUsageSnapshot[];
}

export interface CostUsageTotals {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  missingCostEntries: number;
}

export interface CostUsageDailyEntry extends CostUsageTotals {
  date: string;
}

export interface CostUsageSummary {
  updatedAt: number;
  days: number;
  daily: CostUsageDailyEntry[];
  totals: CostUsageTotals;
}

export interface SessionCostSummary {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  missingCostEntries: number;
  firstActivity?: number;
  lastActivity?: number;
  durationMs?: number;
}

export interface SessionUsageEntry {
  key: string;
  label?: string;
  sessionId?: string;
  updatedAt?: number;
  agentId?: string;
  model?: string;
  modelProvider?: string;
  usage: SessionCostSummary | null;
}

export interface SessionsUsageResult {
  updatedAt: number;
  startDate: string;
  endDate: string;
  sessions: SessionUsageEntry[];
  totals: CostUsageTotals;
}

export type CronSchedule =
  | { kind: 'at'; at: string }
  | { kind: 'every'; everyMs: number; anchorMs?: number }
  | { kind: 'cron'; expr: string; tz?: string; staggerMs?: number };

export type CronSessionTarget = 'main' | 'isolated' | 'current' | `session:${string}`;
export type CronWakeMode = 'next-heartbeat' | 'now';

export type CronPayload =
  | { kind: 'systemEvent'; text: string }
  | {
      kind: 'agentTurn';
      message: string;
      model?: string;
      fallbacks?: string[];
      thinking?: string;
      timeoutSeconds?: number;
      allowUnsafeExternalContent?: boolean;
      lightContext?: boolean;
      deliver?: boolean;
      channel?: string;
      to?: string;
      bestEffortDeliver?: boolean;
    };

export type CronDeliveryMode = 'none' | 'announce' | 'webhook';

export interface CronFailureDestination {
  channel?: string;
  to?: string;
  accountId?: string;
  mode?: 'announce' | 'webhook';
}

export interface CronDelivery {
  mode: CronDeliveryMode;
  channel?: string;
  to?: string;
  accountId?: string;
  bestEffort?: boolean;
  failureDestination?: CronFailureDestination;
}

export interface CronFailureAlert {
  after?: number;
  channel?: string;
  to?: string;
  cooldownMs?: number;
  mode?: 'announce' | 'webhook';
  accountId?: string;
}

export type CronRunStatus = 'ok' | 'error' | 'skipped';
export type CronDeliveryStatus = 'delivered' | 'not-delivered' | 'unknown' | 'not-requested';

export interface CronJobState {
  nextRunAtMs?: number;
  runningAtMs?: number;
  lastRunAtMs?: number;
  lastRunStatus?: CronRunStatus;
  lastError?: string;
  lastDurationMs?: number;
  consecutiveErrors?: number;
  lastDelivered?: boolean;
  lastDeliveryStatus?: CronDeliveryStatus;
  lastDeliveryError?: string;
  lastFailureAlertAtMs?: number;
}

export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  agentId?: string;
  sessionKey?: string;
  description?: string;
  deleteAfterRun?: boolean;
  schedule: CronSchedule;
  sessionTarget: CronSessionTarget;
  wakeMode: CronWakeMode;
  payload: CronPayload;
  delivery?: CronDelivery;
  failureAlert?: CronFailureAlert | false;
  state: CronJobState;
}

export type CronJobCreate = Omit<CronJob, 'id' | 'createdAtMs' | 'updatedAtMs' | 'state'>;

export interface CronJobPatch {
  name?: string;
  description?: string;
  enabled?: boolean;
  agentId?: string;
  sessionKey?: string;
  deleteAfterRun?: boolean;
  schedule?: CronSchedule;
  sessionTarget?: CronSessionTarget;
  wakeMode?: CronWakeMode;
  payload?: CronPayload;
  delivery?: CronDelivery;
  failureAlert?: CronFailureAlert | false;
}

export interface CronRunLogEntry {
  ts: number;
  jobId: string;
  action: 'finished';
  status?: CronRunStatus;
  error?: string;
  summary?: string;
  delivered?: boolean;
  deliveryStatus?: CronDeliveryStatus;
  deliveryError?: string;
  sessionId?: string;
  sessionKey?: string;
  runAtMs?: number;
  durationMs?: number;
  nextRunAtMs?: number;
  model?: string;
  provider?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
  };
  jobName?: string;
}

export interface CronListParams {
  enabled?: 'all' | 'enabled' | 'disabled';
  query?: string;
  sortBy?: 'nextRunAtMs' | 'updatedAtMs' | 'name';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CronListResult {
  jobs: CronJob[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface CronStatusResult {
  enabled: boolean;
  storePath: string;
  jobs: number;
  nextWakeAtMs?: number;
}

export interface CronRunParams {
  jobId: string;
  mode?: 'due' | 'force';
}

export interface CronRunResult {
  enqueued?: boolean;
  runId?: string;
  ran?: boolean;
  reason?: string;
}

export interface CronRunsParams {
  scope?: 'job' | 'all';
  jobId?: string;
  limit?: number;
  offset?: number;
  statuses?: CronRunStatus[];
  deliveryStatuses?: CronDeliveryStatus[];
  query?: string;
  sortDir?: 'asc' | 'desc';
}

export interface CronRunsResult {
  entries: CronRunLogEntry[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}
