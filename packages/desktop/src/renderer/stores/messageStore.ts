import { create } from 'zustand';
import { mergeGatewayStreamText } from '@clawwork/shared';
import type { Message, MessageRole, MessageImageAttachment, ToolCall } from '@clawwork/shared';

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

interface MessageState {
  messagesByTask: Record<string, Message[]>;
  activeTurnByTask: Record<string, ActiveTurn>;
  processingTasks: Set<string>;
  highlightedMessageId: string | null;

  addMessage: (
    taskId: string,
    role: MessageRole,
    content: string,
    imageAttachments?: MessageImageAttachment[],
    options?: { persist?: boolean },
  ) => Message;
  upsertToolCall: (taskId: string, tc: ToolCall) => void;
  bulkLoad: (taskId: string, msgs: Message[]) => void;
  appendStreamDelta: (taskId: string, delta: string) => void;
  appendThinkingDelta: (taskId: string, delta: string) => void;
  finalizeStream: (taskId: string, meta?: { runId?: string }) => void;
  promoteActiveTurn: (taskId: string, canonical: Message) => void;
  clearActiveTurn: (taskId: string) => void;
  clearMessages: (taskId: string) => void;
  setHighlightedMessage: (id: string | null) => void;
  setProcessing: (taskId: string, processing: boolean) => void;
}

export { EMPTY_MESSAGES };

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

export function activeTurnToMessage(turn: ActiveTurn, taskId: string): Message {
  return {
    id: turn.id,
    taskId,
    role: 'assistant',
    content: turn.content,
    thinkingContent: turn.thinkingContent,
    artifacts: [],
    toolCalls: turn.toolCalls,
    runId: turn.runId,
    timestamp: turn.timestamp,
  };
}

function persistMessageUpdate(msg: Message): void {
  window.clawwork
    .persistMessage({
      id: msg.id,
      taskId: msg.taskId,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      imageAttachments: msg.imageAttachments as unknown[] | undefined,
      toolCalls: msg.toolCalls,
    })
    .catch(() => {});
}

export const useMessageStore = create<MessageState>((set, _get) => ({
  messagesByTask: {},
  activeTurnByTask: {},
  processingTasks: new Set(),
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
      persistMessageUpdate(msg);
    }
    return msg;
  },

  upsertToolCall: (taskId, tc) => {
    let persistedMessage: Message | null = null;

    set((s) => {
      const turn = s.activeTurnByTask[taskId];
      if (turn) {
        const idx = turn.toolCalls.findIndex((t) => t.id === tc.id);
        const next = [...turn.toolCalls];
        if (idx >= 0) next[idx] = mergeToolCallState(next[idx], tc);
        else next.push(tc);
        return {
          activeTurnByTask: {
            ...s.activeTurnByTask,
            [taskId]: { ...turn, toolCalls: next },
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
        activeTurnByTask: {
          ...s.activeTurnByTask,
          [taskId]: { ...newActiveTurn(), toolCalls: [tc] },
        },
      };
    });

    if (persistedMessage) {
      persistMessageUpdate(persistedMessage);
    }
  },

  bulkLoad: (taskId, msgs) =>
    set((s) => ({
      messagesByTask: {
        ...s.messagesByTask,
        [taskId]: msgs,
      },
    })),

  appendStreamDelta: (taskId, delta) =>
    set((s) => {
      const turn = s.activeTurnByTask[taskId] ?? newActiveTurn();
      return {
        activeTurnByTask: {
          ...s.activeTurnByTask,
          [taskId]: {
            ...turn,
            streamingText: mergeGatewayStreamText(turn.streamingText, delta),
          },
        },
      };
    }),

  appendThinkingDelta: (taskId, delta) =>
    set((s) => {
      const turn = s.activeTurnByTask[taskId] ?? newActiveTurn();
      return {
        activeTurnByTask: {
          ...s.activeTurnByTask,
          [taskId]: {
            ...turn,
            streamingThinking: mergeGatewayStreamText(turn.streamingThinking, delta),
          },
        },
      };
    }),

  finalizeStream: (taskId, meta?) => {
    set((s) => {
      const turn = s.activeTurnByTask[taskId];
      if (!turn) return s;

      const content = turn.streamingText;
      const thinkingContent = turn.streamingThinking || undefined;

      if (!content && !thinkingContent) {
        return {
          activeTurnByTask: {
            ...s.activeTurnByTask,
            [taskId]: { ...turn, streamingText: '', streamingThinking: '' },
          },
        };
      }

      return {
        activeTurnByTask: {
          ...s.activeTurnByTask,
          [taskId]: {
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

  promoteActiveTurn: (taskId, canonical) =>
    set((s) => {
      const turn = s.activeTurnByTask[taskId];
      const merged = mergeCanonicalMessageWithActiveTurn(canonical, turn);
      const nextTurns = { ...s.activeTurnByTask };
      delete nextTurns[taskId];
      return {
        messagesByTask: {
          ...s.messagesByTask,
          [taskId]: [...(s.messagesByTask[taskId] ?? []), merged],
        },
        activeTurnByTask: nextTurns,
      };
    }),

  clearActiveTurn: (taskId) =>
    set((s) => {
      if (!s.activeTurnByTask[taskId]) return s;
      const next = { ...s.activeTurnByTask };
      delete next[taskId];
      return { activeTurnByTask: next };
    }),

  clearMessages: (taskId) =>
    set((s) => {
      const nextMessages = { ...s.messagesByTask };
      const nextTurns = { ...s.activeTurnByTask };
      const nextProcessing = new Set(s.processingTasks);

      delete nextMessages[taskId];
      delete nextTurns[taskId];
      nextProcessing.delete(taskId);

      return {
        messagesByTask: nextMessages,
        activeTurnByTask: nextTurns,
        processingTasks: nextProcessing,
      };
    }),

  setHighlightedMessage: (id) => set({ highlightedMessageId: id }),

  setProcessing: (taskId, processing) =>
    set((s) => {
      const next = new Set(s.processingTasks);
      if (processing) next.add(taskId);
      else next.delete(taskId);
      return { processingTasks: next };
    }),
}));
