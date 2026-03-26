import type { IpcResult } from '@clawwork/shared';

export interface PersistedTask {
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
  model?: string;
  modelProvider?: string;
  thinkingLevel?: string;
  inputTokens?: number;
  outputTokens?: number;
  contextTokens?: number;
}

export interface PersistedMessage {
  id: string;
  taskId: string;
  role: string;
  content: string;
  timestamp: string;
  imageAttachments?: unknown[];
  toolCalls?: unknown[];
}

export interface ListResult<T> {
  ok: boolean;
  rows?: T[];
  error?: string;
}

export interface PersistencePort {
  loadTasks: () => Promise<ListResult<PersistedTask>>;
  loadMessages: (taskId: string) => Promise<ListResult<PersistedMessage>>;
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
    toolCalls?: unknown[];
  }) => Promise<IpcResult>;
  deleteTask: (taskId: string) => Promise<IpcResult>;
}
