import { createStore } from 'zustand/vanilla';
import { mergeGatewayStreamText, parseAgentIdFromSessionKey, parseTaskIdFromSessionKey } from '@clawwork/shared';
import type { Message, MessageRole, MessageImageAttachment, ToolCall, IpcResult } from '@clawwork/shared';

const EMPTY_MESSAGES: Message[] = [];

export interface ActiveTurn {
  id: string;
  streamingText: string;
  streamingThinking: string;
  toolCalls: ToolCall[];
  finalized: boolean;
  content: string;
  thinkingContent?: string;
  runId?: string;
  timestamp: string;
}

export interface MessageState {
  messagesByTask: Record<string, Message[]>;
  activeTurnBySession: Record<string, ActiveTurn>;
  processingBySession: Set<string>;
  highlightedMessageId: string | null;

  addMessage: (
    taskId: string,
    role: MessageRole,
    content: string,
    imageAttachments?: MessageImageAttachment[],
    options?: { persist?: boolean },
  ) => Message;
  upsertToolCall: (sessionKey: string, taskId: string, tc: ToolCall) => void;
  bulkLoad: (taskId: string, msgs: Message[]) => void;
  appendStreamDelta: (sessionKey: string, delta: string) => void;
  appendThinkingDelta: (sessionKey: string, delta: string) => void;
  finalizeStream: (sessionKey: string, meta?: { runId?: string }) => void;
  promoteActiveTurn: (sessionKey: string, taskId: string, canonical: Message) => void;
  clearActiveTurn: (sessionKey: string) => void;
  clearMessages: (taskId: string) => void;
  setHighlightedMessage: (id: string | null) => void;
  setProcessing: (sessionKey: string, processing: boolean) => void;
}

export interface MessageStoreDeps {
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
}

function generateId(): string {
  return crypto.randomUUID();
}

function newActiveTurn(): ActiveTurn {
  return {
    id: generateId(),
    streamingText: '',
    streamingThinking: '',
    toolCalls: [],
    finalized: false,
    content: '',
    timestamp: new Date().toISOString(),
  };
}

function toolStatusRank(status: ToolCall['status']): number {
  switch (status) {
    case 'error':
      return 3;
    case 'done':
      return 2;
    case 'running':
      return 1;
  }
}

function mergeToolCallState(existing: ToolCall | undefined, incoming: ToolCall): ToolCall {
  if (!existing) return incoming;

  const preferIncoming = toolStatusRank(incoming.status) >= toolStatusRank(existing.status);
  return {
    ...existing,
    ...incoming,
    status: preferIncoming ? incoming.status : existing.status,
    args: incoming.args ?? existing.args,
    result: incoming.result ?? existing.result,
    startedAt: existing.startedAt || incoming.startedAt,
    completedAt: incoming.completedAt ?? existing.completedAt,
  };
}

function mergeToolCalls(canonical: ToolCall[], turn: ToolCall[]): ToolCall[] {
  const merged = new Map<string, ToolCall>();
  for (const toolCall of canonical) {
    merged.set(toolCall.id, toolCall);
  }
  for (const toolCall of turn) {
    merged.set(toolCall.id, mergeToolCallState(merged.get(toolCall.id), toolCall));
  }
  return Array.from(merged.values());
}

export function mergeCanonicalMessageWithActiveTurn(canonical: Message, turn?: ActiveTurn): Message {
  return {
    ...canonical,
    thinkingContent: turn?.thinkingContent ?? canonical.thinkingContent,
    toolCalls: mergeToolCalls(canonical.toolCalls, turn?.toolCalls ?? []),
    runId: turn?.runId ?? canonical.runId,
  };
}

export function activeTurnToMessage(turn: ActiveTurn, taskId: string, sessionKey?: string): Message {
  return {
    id: turn.id,
    taskId,
    role: 'assistant',
    content: turn.content,
    thinkingContent: turn.thinkingContent,
    artifacts: [],
    toolCalls: turn.toolCalls,
    sessionKey,
    agentId: sessionKey ? parseAgentIdFromSessionKey(sessionKey) : undefined,
    runId: turn.runId,
    timestamp: turn.timestamp,
  };
}

function persistMessageUpdate(deps: MessageStoreDeps, msg: Message): void {
  deps
    .persistMessage({
      id: msg.id,
      taskId: msg.taskId,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      sessionKey: msg.sessionKey,
      agentId: msg.agentId,
      runId: msg.runId,
      imageAttachments: msg.imageAttachments as unknown[] | undefined,
      toolCalls: msg.toolCalls,
    })
    .catch(() => {});
}

export { EMPTY_MESSAGES };

export function createMessageStore(deps: MessageStoreDeps) {
  return createStore<MessageState>((set, _get) => ({
    messagesByTask: {},
    activeTurnBySession: {},
    processingBySession: new Set(),
    highlightedMessageId: null,

    addMessage: (taskId, role, content, imageAttachments?, options?) => {
      const msg: Message = {
        id: generateId(),
        taskId,
        role,
        content,
        artifacts: [],
        toolCalls: [],
        imageAttachments: imageAttachments?.length ? imageAttachments : undefined,
        timestamp: new Date().toISOString(),
      };
      set((s) => ({
        messagesByTask: {
          ...s.messagesByTask,
          [taskId]: [...(s.messagesByTask[taskId] ?? []), msg],
        },
      }));
      if (options?.persist !== false) {
        persistMessageUpdate(deps, msg);
      }
      return msg;
    },

    upsertToolCall: (sessionKey, taskId, tc) => {
      let persistedMessage: Message | null = null;

      set((s) => {
        const turn = s.activeTurnBySession[sessionKey];
        if (turn) {
          const idx = turn.toolCalls.findIndex((t) => t.id === tc.id);
          const next = [...turn.toolCalls];
          if (idx >= 0) next[idx] = mergeToolCallState(next[idx], tc);
          else next.push(tc);
          return {
            activeTurnBySession: {
              ...s.activeTurnBySession,
              [sessionKey]: { ...turn, toolCalls: next },
            },
          };
        }

        const msgs = s.messagesByTask[taskId] ?? [];
        let lastAssistantIdx = -1;
        let lastUserIdx = -1;
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (lastAssistantIdx < 0 && msgs[i].role === 'assistant') lastAssistantIdx = i;
          if (lastUserIdx < 0 && msgs[i].role === 'user') lastUserIdx = i;
          if (lastAssistantIdx >= 0 && lastUserIdx >= 0) break;
        }

        const targetIdx = lastAssistantIdx >= 0 && lastAssistantIdx > lastUserIdx ? lastAssistantIdx : -1;
        if (targetIdx >= 0) {
          const updatedMsgs = [...msgs];
          const target = updatedMsgs[targetIdx];
          const idx = target.toolCalls.findIndex((t) => t.id === tc.id);
          const next = [...target.toolCalls];
          if (idx >= 0) next[idx] = mergeToolCallState(next[idx], tc);
          else next.push(tc);
          updatedMsgs[targetIdx] = { ...target, toolCalls: next };
          persistedMessage = updatedMsgs[targetIdx];
          return { messagesByTask: { ...s.messagesByTask, [taskId]: updatedMsgs } };
        }

        return {
          activeTurnBySession: {
            ...s.activeTurnBySession,
            [sessionKey]: { ...newActiveTurn(), toolCalls: [tc] },
          },
        };
      });

      if (persistedMessage) {
        persistMessageUpdate(deps, persistedMessage);
      }
    },

    bulkLoad: (taskId, msgs) =>
      set((s) => ({
        messagesByTask: {
          ...s.messagesByTask,
          [taskId]: msgs,
        },
      })),

    appendStreamDelta: (sessionKey, delta) =>
      set((s) => {
        const turn = s.activeTurnBySession[sessionKey] ?? newActiveTurn();
        return {
          activeTurnBySession: {
            ...s.activeTurnBySession,
            [sessionKey]: {
              ...turn,
              streamingText: mergeGatewayStreamText(turn.streamingText, delta),
            },
          },
        };
      }),

    appendThinkingDelta: (sessionKey, delta) =>
      set((s) => {
        const turn = s.activeTurnBySession[sessionKey] ?? newActiveTurn();
        return {
          activeTurnBySession: {
            ...s.activeTurnBySession,
            [sessionKey]: {
              ...turn,
              streamingThinking: mergeGatewayStreamText(turn.streamingThinking, delta),
            },
          },
        };
      }),

    finalizeStream: (sessionKey, meta?) => {
      set((s) => {
        const turn = s.activeTurnBySession[sessionKey];
        if (!turn) return s;

        const content = turn.streamingText;
        const thinkingContent = turn.streamingThinking || undefined;

        if (!content && !thinkingContent) {
          return {
            activeTurnBySession: {
              ...s.activeTurnBySession,
              [sessionKey]: { ...turn, streamingText: '', streamingThinking: '' },
            },
          };
        }

        return {
          activeTurnBySession: {
            ...s.activeTurnBySession,
            [sessionKey]: {
              ...turn,
              finalized: true,
              content,
              thinkingContent,
              streamingText: '',
              streamingThinking: '',
              runId: meta?.runId ?? turn.runId,
            },
          },
        };
      });
    },

    promoteActiveTurn: (sessionKey, taskId, canonical) =>
      set((s) => {
        const turn = s.activeTurnBySession[sessionKey];
        const merged = mergeCanonicalMessageWithActiveTurn(canonical, turn);
        const nextTurns = { ...s.activeTurnBySession };
        delete nextTurns[sessionKey];
        return {
          messagesByTask: {
            ...s.messagesByTask,
            [taskId]: [...(s.messagesByTask[taskId] ?? []), merged],
          },
          activeTurnBySession: nextTurns,
        };
      }),

    clearActiveTurn: (sessionKey) =>
      set((s) => {
        if (!s.activeTurnBySession[sessionKey]) return s;
        const next = { ...s.activeTurnBySession };
        delete next[sessionKey];
        return { activeTurnBySession: next };
      }),

    clearMessages: (taskId) =>
      set((s) => {
        const nextMessages = { ...s.messagesByTask };
        const nextTurns = { ...s.activeTurnBySession };
        const nextProcessing = new Set(s.processingBySession);

        delete nextMessages[taskId];
        for (const key of Object.keys(nextTurns)) {
          if (parseTaskIdFromSessionKey(key) === taskId) delete nextTurns[key];
        }
        for (const key of nextProcessing) {
          if (parseTaskIdFromSessionKey(key) === taskId) nextProcessing.delete(key);
        }

        return {
          messagesByTask: nextMessages,
          activeTurnBySession: nextTurns,
          processingBySession: nextProcessing,
        };
      }),

    setHighlightedMessage: (id) => set({ highlightedMessageId: id }),

    setProcessing: (sessionKey, processing) =>
      set((s) => {
        const next = new Set(s.processingBySession);
        if (processing) next.add(sessionKey);
        else next.delete(sessionKey);
        return { processingBySession: next };
      }),
  }));
}
