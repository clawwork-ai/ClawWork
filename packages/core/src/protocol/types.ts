import type { ToolCall } from '@clawwork/shared';

export interface ChatMessage {
  role?: string;
  content?: ChatContentBlock[];
  timestamp?: number;
}

export interface ChatEventPayload {
  sessionKey: string;
  runId?: string;
  state?: 'delta' | 'final' | 'aborted' | 'error';
  message?: ChatMessage;
  content?: ChatContentBlock[];
  text?: string;
  errorMessage?: string;
  errorCode?: string;
  error?: { code?: string; message?: string; details?: Record<string, unknown> };
}

export interface RawContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  arguments?: Record<string, unknown> | string;
  result?: unknown;
}

export type ChatContentBlock = RawContentBlock & {
  thinking?: string;
};

export interface RawHistoryMessage {
  role: string;
  content?: RawContentBlock[];
  timestamp?: number;
}

export interface NormalizedAssistantTurn {
  content: string;
  toolCalls: ToolCall[];
  timestamp: string;
}

export interface DiscoveredMessageShape {
  role: string;
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
}
