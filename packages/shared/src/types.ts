// ============================================================
// ClawWork Core Types
// Shared across ClawWork packages
// ============================================================

/** Task status lifecycle: active → completed → archived */
export type TaskStatus = 'active' | 'completed' | 'archived';

/** Message sender role */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Artifact content type */
export type ArtifactType = 'file' | 'code' | 'image' | 'link' | 'structured_data';

/** Tool call execution status */
export type ToolCallStatus = 'running' | 'done' | 'error';

// ------------------------------------------------------------
// Gateway Server Configuration
// ------------------------------------------------------------

import type { GatewayAuth } from './gateway-protocol.js';

/** A configured OpenClaw Gateway server instance */
export interface GatewayServer {
  id: string;
  name: string;
  url: string;
  auth: GatewayAuth;
  isDefault: boolean;
  color?: string;
}

// Re-export GatewayAuth so consumers don't need a second import
export type { GatewayAuth } from './gateway-protocol.js';

// ------------------------------------------------------------
// Core Entities
// ------------------------------------------------------------

export interface Task {
  id: string;
  sessionKey: string;
  sessionId: string;
  title: string;
  status: TaskStatus;
  createdAt: string; // ISO 8601
  updatedAt: string;
  tags: string[];
  artifactDir: string;
  gatewayId: string;
  agentId?: string;
  model?: string;
  modelProvider?: string;
  thinkingLevel?: string;
  inputTokens?: number;
  outputTokens?: number;
  contextTokens?: number;
}

/** Image attachment stored with a user message for UI preview */
export interface MessageImageAttachment {
  fileName: string;
  /** data URL (e.g. "data:image/png;base64,...") for rendering in <img> */
  dataUrl: string;
}

export interface Message {
  id: string;
  taskId: string;
  role: MessageRole;
  content: string;
  artifacts: Artifact[];
  toolCalls: ToolCall[];
  /** Image attachments sent with user messages (for inline preview) */
  imageAttachments?: MessageImageAttachment[];
  timestamp: string; // ISO 8601
  runId?: string;
  thinkingContent?: string;
}

export interface Artifact {
  id: string;
  taskId: string;
  messageId: string;
  type: ArtifactType;
  name: string;
  /** Original source path (e.g. from sendMedia) */
  filePath: string;
  /** Relative path within workspace: <taskId>/<filename> */
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

// ------------------------------------------------------------
// Chat Attachments (for Gateway chat.send)
// ------------------------------------------------------------

/** Image attachment sent via Gateway chat.send. Only image/* MIME types are supported. */
export interface ChatAttachment {
  mimeType: string; // e.g. "image/png", "image/jpeg"
  fileName: string;
  content: string; // base64-encoded (no data URL prefix)
}

// ------------------------------------------------------------
// Gateway Agent / Model catalog
// ------------------------------------------------------------

export interface AgentIdentity {
  name?: string;
  theme?: string;
  emoji?: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface AgentInfo {
  id: string;
  name?: string;
  identity?: AgentIdentity;
}

export interface AgentListResponse {
  defaultId: string;
  mainKey: string;
  scope: string;
  agents: AgentInfo[];
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

// ------------------------------------------------------------
// Gateway Tools Catalog
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Exec Approval (operator.approvals scope)
// ------------------------------------------------------------

// ------------------------------------------------------------
// File Context (@ file picker)
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Exec Approval (operator.approvals scope)
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Usage & Cost (from Gateway usage.status / usage.cost)
// ------------------------------------------------------------

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
