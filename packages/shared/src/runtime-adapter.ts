/**
 * Runtime execution boundary — abstracts any agent runtime
 * (OpenClaw Gateway, ACP, Codex, Claude Code, etc.)
 */

// ── Runtime Capabilities ──

export interface RuntimeCapabilities {
  /** Can stream text deltas */
  streamsText: boolean;
  /** Supports tool call/result events */
  supportsToolEvents: boolean;
  /** Supports approval requests */
  supportsApprovals: boolean;
  /** Supports MCP/tool integration */
  supportsMCP: boolean;
  /** Has filesystem access */
  accessesFilesystem: boolean;
  /** Network constrained (sandboxed) */
  constrainsNetwork: boolean;
  /** Supports execution resume */
  supportsResume: boolean;
  /** Produces artifacts (files, images, etc.) */
  producesArtifacts: boolean;
  /** Reports usage/quota */
  reportsUsage: boolean;
  /** Supports child executions (subagents) */
  supportsChildExecutions: boolean;
  /** Supports streaming thinking content */
  streamsThinking: boolean;
  /** Can produce agent lifecycle events (start/end/fallback) */
  reportsLifecycle: boolean;
}

// ── Execution ──

export type ExecutionStatus = 'created' | 'running' | 'errored' | 'completed' | 'cancelled';

export interface ExecutionRef {
  /** Runtime-scoped execution identifier */
  executionId: string;
  /** Gateway/Runtime instance identifier */
  runtimeId: string;
  /** OpenClaw session key (if applicable) */
  sessionKey?: string;
  /** Human-readable label */
  label?: string;
}

export interface ExecutionInfo {
  ref: ExecutionRef;
  status: ExecutionStatus;
  agentId?: string;
  model?: string;
  modelProvider?: string;
  createdAt: number;
  updatedAt: number;
  inputTokens?: number;
  outputTokens?: number;
  contextTokens?: number;
}

// ── Execution Events (normalized) ──

export type ExecutionEventType =
  | 'execution.created'
  | 'execution.started'
  | 'execution.progress'
  | 'execution.message.delta'
  | 'execution.message.final'
  | 'execution.thinking.delta'
  | 'execution.tool.call'
  | 'execution.tool.result'
  | 'execution.approval.requested'
  | 'execution.approval.resolved'
  | 'execution.artifact.created'
  | 'execution.warning'
  | 'execution.error'
  | 'execution.completed'
  | 'execution.cancelled'
  | 'execution.child.spawned'
  | 'execution.lifecycle'
  | 'execution.status';

export interface ExecutionEventBase {
  type: ExecutionEventType;
  executionId: string;
  runtimeId: string;
  sessionKey?: string;
  timestamp: number;
}

export interface ExecutionMessageDeltaEvent extends ExecutionEventBase {
  type: 'execution.message.delta';
  text: string;
  runId?: string;
}

export interface ExecutionMessageFinalEvent extends ExecutionEventBase {
  type: 'execution.message.final';
  text: string;
  runId?: string;
}

export interface ExecutionThinkingDeltaEvent extends ExecutionEventBase {
  type: 'execution.thinking.delta';
  text: string;
}

export interface ExecutionToolCallEvent extends ExecutionEventBase {
  type: 'execution.tool.call';
  toolCallId: string;
  name: string;
  status: 'running' | 'done' | 'error';
  args?: Record<string, unknown>;
  result?: string;
}

export interface ExecutionToolResultEvent extends ExecutionEventBase {
  type: 'execution.tool.result';
  toolCallId: string;
  name: string;
  result?: string;
  isError?: boolean;
}

export interface ExecutionApprovalRequestedEvent extends ExecutionEventBase {
  type: 'execution.approval.requested';
  id: string;
  request: Record<string, unknown>;
  createdAtMs: number;
  expiresAtMs: number;
}

export interface ExecutionApprovalResolvedEvent extends ExecutionEventBase {
  type: 'execution.approval.resolved';
  id: string;
  decision?: string | null;
}

export interface ExecutionErrorEvent extends ExecutionEventBase {
  type: 'execution.error';
  message: string;
  code?: string;
  runId?: string;
}

export interface ExecutionCompletedEvent extends ExecutionEventBase {
  type: 'execution.completed';
  runId?: string;
}

export interface ExecutionCancelledEvent extends ExecutionEventBase {
  type: 'execution.cancelled';
}

export interface ExecutionLifecycleEvent extends ExecutionEventBase {
  type: 'execution.lifecycle';
  phase: 'start' | 'end' | 'error' | 'fallback';
  selectedProvider?: string;
  selectedModel?: string;
  activeProvider?: string;
  activeModel?: string;
  error?: string;
}

export interface ExecutionCreatedEvent extends ExecutionEventBase {
  type: 'execution.created';
}

export interface ExecutionStartedEvent extends ExecutionEventBase {
  type: 'execution.started';
}

export interface ExecutionChildSpawnedEvent extends ExecutionEventBase {
  type: 'execution.child.spawned';
  childExecutionId: string;
  childSessionKey?: string;
}

export interface ExecutionStatusChangeEvent extends ExecutionEventBase {
  type: 'execution.status';
  status: ExecutionStatus;
}

export type ExecutionEvent =
  | ExecutionCreatedEvent
  | ExecutionStartedEvent
  | ExecutionMessageDeltaEvent
  | ExecutionMessageFinalEvent
  | ExecutionThinkingDeltaEvent
  | ExecutionToolCallEvent
  | ExecutionToolResultEvent
  | ExecutionApprovalRequestedEvent
  | ExecutionApprovalResolvedEvent
  | ExecutionErrorEvent
  | ExecutionCompletedEvent
  | ExecutionCancelledEvent
  | ExecutionLifecycleEvent
  | ExecutionChildSpawnedEvent
  | ExecutionStatusChangeEvent;

// ── Event Stream ──

export interface ExecutionEventSubscription {
  unsubscribe(): void;
}

export type ExecutionEventCallback = (event: ExecutionEvent) => void;

// ── Execution Input ──

export interface ExecutionInput {
  message: string;
  attachments?: Array<{
    mimeType: string;
    fileName: string;
    content: string;
  }>;
  idempotencyKey?: string;
}

// ── Runtime Info ──

export interface RuntimeInfo {
  id: string;
  name: string;
  version?: string;
  connected: boolean;
  serverVersion?: string;
}

// ── RuntimeAdapter Interface ──

export interface RuntimeAdapter {
  /** Get basic info about this runtime */
  getRuntimeInfo(): RuntimeInfo;

  /** Get runtime capabilities */
  getCapabilities(): RuntimeCapabilities;

  /** Create a new execution */
  createExecution(params: {
    agentId: string;
    executionId: string;
    sessionKey: string;
    initialMessage?: string;
  }): Promise<ExecutionRef>;

  /** Send user input to an active execution */
  sendInput(executionRef: ExecutionRef, input: ExecutionInput): Promise<void>;

  /** Cancel an active execution */
  cancelExecution(executionRef: ExecutionRef): Promise<void>;

  /** Resume a paused execution (approval pending, etc.) */
  resumeExecution?(executionRef: ExecutionRef): Promise<void>;

  /** Subscribe to execution events */
  onExecutionEvent(callback: ExecutionEventCallback): ExecutionEventSubscription;

  /** List child executions (subagent sessions) */
  listChildren?(executionRef: ExecutionRef): Promise<ExecutionRef[]>;

  /** List pending approvals */
  listApprovals?(): Promise<Array<{ id: string; request: Record<string, unknown> }>>;

  /** Resolve an approval request */
  resolveApproval?(id: string, decision: 'allow-once' | 'allow-always' | 'deny'): Promise<void>;

  /** List artifacts produced by an execution */
  listArtifacts?(
    executionRef: ExecutionRef,
  ): Promise<Array<{ id: string; name: string; mimeType: string; filePath: string }>>;

  /** Get usage/cost info */
  getUsage?(): Promise<Record<string, unknown>>;

  /** Get health status */
  getHealth(): Promise<{ ok: boolean; error?: string }>;

  /** Get execution info by ref */
  getExecutionInfo?(executionRef: ExecutionRef): Promise<ExecutionInfo>;

  /** Get chat history for an execution */
  getChatHistory?(
    executionRef: ExecutionRef,
    limit?: number,
  ): Promise<{ messages: Array<{ role: string; content: string; timestamp: string }> }>;

  /** List models available on this runtime */
  listModels?(): Promise<Array<{ id: string; name?: string; provider?: string }>>;

  /** List agents available on this runtime */
  listAgents?(): Promise<Array<{ id: string; name?: string }>>;

  /** Delete a session/execution */
  deleteExecution?(executionRef: ExecutionRef): Promise<void>;
}

// ── Execution Registry ──

export interface ExecutionRegistryEntry {
  taskId: string;
  executionRef: ExecutionRef;
  status: ExecutionStatus;
  createdAt: number;
  updatedAt: number;
  agentId?: string;
}

export interface ExecutionRegistry {
  entries: Map<string, ExecutionRegistryEntry>;
  addEntry(taskId: string, entry: ExecutionRegistryEntry): void;
  getEntry(executionId: string): ExecutionRegistryEntry | undefined;
  updateStatus(executionId: string, status: ExecutionStatus): void;
  getEntriesForTask(taskId: string): ExecutionRegistryEntry[];
}
