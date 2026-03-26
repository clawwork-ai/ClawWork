import type { Message, MessageImageAttachment, IpcResult, ErrorStage } from '@clawwork/shared';
import type { GatewayTransportPort, ChatAttachment } from '../ports/gateway-transport.js';
import { buildAppError, formatErrorForUser, formatErrorForToast } from './error-classify.js';
import type { TranslateFn } from './error-classify.js';

interface TaskRef {
  id: string;
  gatewayId: string;
  sessionKey: string;
  title: string;
}

export interface ChatComposerDeps {
  gateway: Pick<GatewayTransportPort, 'sendMessage' | 'abortChat'>;

  getTaskStore: () => {
    tasks: TaskRef[];
    commitPendingTask: () => TaskRef;
    updateTaskTitle: (id: string, title: string) => void;
    updateTaskMetadata: (id: string, meta: { model?: string; modelProvider?: string; thinkingLevel?: string }) => void;
  };

  getMessageStore: () => {
    addMessage: (
      taskId: string,
      role: 'user' | 'system',
      content: string,
      imageAttachments?: MessageImageAttachment[],
      options?: { persist?: boolean },
    ) => Message;
    setProcessing: (taskId: string, processing: boolean) => void;
    clearMessages: (taskId: string) => void;
    processingTasks: Set<string>;
    activeTurnByTask: Record<string, { streamingText: string; streamingThinking: string }>;
  };

  persistMessage: (msg: {
    id: string;
    taskId: string;
    role: string;
    content: string;
    timestamp: string;
    imageAttachments?: unknown[];
    toolCalls?: unknown[];
  }) => Promise<unknown>;

  markAbortedByUser: (taskId: string) => void;

  compactSession: (gatewayId: string, sessionKey: string) => Promise<IpcResult>;
  resetSession: (gatewayId: string, sessionKey: string, mode: string) => Promise<IpcResult>;

  getModelProvider?: (gatewayId: string, modelId: string) => string | undefined;

  translate: TranslateFn;
  onError?: (toast: { title: string; description: string }) => void;
}

export interface SendOptions {
  content: string;
  attachments?: ChatAttachment[];
  imageAttachments?: MessageImageAttachment[];
  presetModel?: string;
  presetThinking?: string;
  titleHint?: string;
}

const SEND_TIMEOUT_MS = 30_000;

export function createChatComposer(deps: ChatComposerDeps) {
  const responseTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function resolveTask(taskId?: string): TaskRef | null {
    if (taskId) {
      return deps.getTaskStore().tasks.find((t) => t.id === taskId) ?? null;
    }
    try {
      return deps.getTaskStore().commitPendingTask();
    } catch {
      return null;
    }
  }

  function emitError(
    taskId: string,
    source: 'gateway' | 'local',
    stage: ErrorStage,
    rawMessage: string,
    code?: string,
    details?: Record<string, unknown>,
  ): void {
    const store = deps.getMessageStore();
    const appError = buildAppError({ source, stage, rawMessage, code, details });
    store.addMessage(taskId, 'system', formatErrorForUser(appError, deps.translate));
    const toast = formatErrorForToast(appError, deps.translate);
    deps.onError?.(toast);
  }

  function clearTimer(taskId: string): void {
    const timer = responseTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      responseTimers.delete(taskId);
    }
  }

  async function send(taskId: string | undefined, options: SendOptions): Promise<{ ok: boolean; taskId?: string }> {
    const task = resolveTask(taskId);
    if (!task) {
      deps.onError?.({
        title: deps.translate('errors.stage.send'),
        description: deps.translate('errors.agentNotResponding'),
      });
      return { ok: false };
    }

    const store = deps.getMessageStore();
    const pendingUserMessage = store.addMessage(task.id, 'user', options.content, options.imageAttachments, {
      persist: false,
    });
    store.setProcessing(task.id, true);

    if (!task.title && options.titleHint) {
      const title = options.titleHint.slice(0, 30).replace(/\n/g, ' ').trim();
      deps.getTaskStore().updateTaskTitle(task.id, title + (options.titleHint.length > 30 ? '\u2026' : ''));
    }

    try {
      if (options.presetModel) {
        await deps.gateway.sendMessage(task.gatewayId, task.sessionKey, `/model ${options.presetModel}`);
        deps.getTaskStore().updateTaskMetadata(task.id, {
          model: options.presetModel,
          modelProvider: deps.getModelProvider?.(task.gatewayId, options.presetModel),
        });
      }
      if (options.presetThinking && options.presetThinking !== 'off') {
        await deps.gateway.sendMessage(task.gatewayId, task.sessionKey, `/think ${options.presetThinking}`);
        deps.getTaskStore().updateTaskMetadata(task.id, { thinkingLevel: options.presetThinking });
      }

      const result = await deps.gateway.sendMessage(
        task.gatewayId,
        task.sessionKey,
        options.content,
        options.attachments?.length ? options.attachments : undefined,
      );

      if (result && !result.ok) {
        store.setProcessing(task.id, false);
        emitError(
          task.id,
          'gateway',
          'send',
          result.error || deps.translate('errors.sendFailed'),
          result.errorCode,
          result.errorDetails,
        );
        return { ok: false, taskId: task.id };
      }

      clearTimer(task.id);
      responseTimers.set(
        task.id,
        setTimeout(() => {
          responseTimers.delete(task.id);
          const s = deps.getMessageStore();
          const turn = s.activeTurnByTask[task.id];
          if (s.processingTasks.has(task.id) && (!turn || (!turn.streamingText && !turn.streamingThinking))) {
            s.setProcessing(task.id, false);
            const appError = buildAppError({
              source: 'gateway',
              stage: 'lifecycle',
              rawMessage: deps.translate('errors.agentNotResponding'),
            });
            s.addMessage(task.id, 'system', formatErrorForUser(appError, deps.translate));
          }
        }, SEND_TIMEOUT_MS),
      );

      deps
        .persistMessage({
          id: pendingUserMessage.id,
          taskId: pendingUserMessage.taskId,
          role: pendingUserMessage.role,
          content: pendingUserMessage.content,
          timestamp: pendingUserMessage.timestamp,
          imageAttachments: pendingUserMessage.imageAttachments as unknown[] | undefined,
          toolCalls: pendingUserMessage.toolCalls,
        })
        .catch(() => {});

      return { ok: true, taskId: task.id };
    } catch (err) {
      store.setProcessing(task.id, false);
      emitError(task.id, 'local', 'send', err instanceof Error ? err.message : String(err));
      return { ok: false, taskId: task.id };
    }
  }

  async function abort(taskId: string): Promise<void> {
    const task = deps.getTaskStore().tasks.find((t) => t.id === taskId);
    if (!task) return;

    deps.markAbortedByUser(taskId);
    clearTimer(taskId);

    await deps.gateway.abortChat(task.gatewayId, task.sessionKey);
  }

  async function applySlashCommand(
    taskId: string,
    command: 'compact' | 'reset' | 'model' | 'think',
    arg?: string,
  ): Promise<{ ok: boolean; message?: string }> {
    const task = deps.getTaskStore().tasks.find((t) => t.id === taskId);
    if (!task) return { ok: false };

    const store = deps.getMessageStore();

    switch (command) {
      case 'compact': {
        const res = await deps.compactSession(task.gatewayId, task.sessionKey);
        if (res.ok) {
          const msg = deps.translate('session.contextCompacted');
          store.addMessage(taskId, 'system', msg);
          return { ok: true, message: msg };
        }
        return { ok: false };
      }
      case 'reset': {
        const res = await deps.resetSession(task.gatewayId, task.sessionKey, 'reset');
        if (res.ok) {
          store.clearMessages(taskId);
          const msg = deps.translate('session.contextReset');
          store.addMessage(taskId, 'system', msg);
          return { ok: true, message: msg };
        }
        return { ok: false };
      }
      case 'model': {
        if (!arg) return { ok: false };
        await deps.gateway.sendMessage(task.gatewayId, task.sessionKey, `/model ${arg}`);
        deps.getTaskStore().updateTaskMetadata(taskId, {
          model: arg,
          modelProvider: deps.getModelProvider?.(task.gatewayId, arg),
        });
        return { ok: true };
      }
      case 'think': {
        if (!arg) return { ok: false };
        await deps.gateway.sendMessage(task.gatewayId, task.sessionKey, `/think ${arg}`);
        deps.getTaskStore().updateTaskMetadata(taskId, { thinkingLevel: arg });
        return { ok: true };
      }
    }
  }

  function dispose(): void {
    for (const timer of responseTimers.values()) clearTimeout(timer);
    responseTimers.clear();
  }

  return { send, abort, applySlashCommand, clearTimer, dispose };
}

export type ChatComposer = ReturnType<typeof createChatComposer>;
