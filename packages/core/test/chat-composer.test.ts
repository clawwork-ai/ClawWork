import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildSessionKey } from '@clawwork/shared';
import type { Message, MessageAttachment } from '@clawwork/shared';
import { createChatComposer } from '../src/services/chat-composer';
import type { ChatComposerDeps } from '../src/services/chat-composer';

const TASK_ID = 'abc';
const SESSION_KEY = buildSessionKey(TASK_ID);
const SEND_TIMEOUT_MS = 30_000;

type AddMessageOptions = { persist?: boolean; sessionKey?: string };

function setup() {
  const addMessage = vi.fn(
    (
      _taskId: string,
      _role: 'user' | 'system',
      _content: string,
      _attachments?: MessageAttachment[],
      _options?: AddMessageOptions,
    ): Message => ({
      id: 'm1',
      taskId: TASK_ID,
      role: 'user',
      content: '',
      artifacts: [],
      toolCalls: [],
      timestamp: '',
    }),
  );

  const sendMessage = vi.fn().mockResolvedValue({ ok: true });
  const abortChat = vi.fn().mockResolvedValue({ ok: true });
  const patchSession = vi.fn().mockResolvedValue({ ok: true });
  const compactSession = vi.fn().mockResolvedValue({ ok: true });
  const resetSession = vi.fn().mockResolvedValue({ ok: true });
  const task = { id: TASK_ID, gatewayId: 'gw-1', sessionKey: SESSION_KEY, title: 'T' };

  const deps: ChatComposerDeps = {
    gateway: { sendMessage, abortChat, patchSession },
    getTaskStore: () => ({
      tasks: [task],
      commitPendingTask: () => task,
      updateTaskTitle: vi.fn(),
      updateTaskMetadata: vi.fn(),
    }),
    getMessageStore: () => ({
      addMessage,
      setProcessing: vi.fn(),
      clearMessages: vi.fn(),
    }),
    persistMessage: vi.fn().mockResolvedValue(undefined),
    markAbortedByUser: vi.fn(),
    compactSession,
    resetSession,
    translate: (key: string) => key,
    onError: vi.fn(),
  };

  const composer = createChatComposer(deps);

  function systemOptions(): (AddMessageOptions | undefined)[] {
    return addMessage.mock.calls.filter((c) => c[1] === 'system').map((c) => c[4]);
  }

  return { composer, addMessage, systemOptions, sendMessage, compactSession, resetSession };
}

describe('chat-composer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('attaches task.sessionKey to system messages from emitError, send-timeout, compact, reset', async () => {
    {
      const { composer, systemOptions, sendMessage } = setup();
      sendMessage.mockResolvedValueOnce({ ok: false });
      await composer.send(TASK_ID, { content: 'hi' });
      const system = systemOptions();
      expect(system).toHaveLength(1);
      expect(system[0]?.sessionKey).toBe(SESSION_KEY);
    }

    {
      const { composer, systemOptions, sendMessage } = setup();
      vi.useFakeTimers();
      sendMessage.mockResolvedValueOnce({ ok: true });
      await composer.send(TASK_ID, { content: 'hi' });
      await vi.advanceTimersByTimeAsync(SEND_TIMEOUT_MS);
      vi.useRealTimers();
      const system = systemOptions();
      expect(system).toHaveLength(1);
      expect(system[0]?.sessionKey).toBe(SESSION_KEY);
    }

    {
      const { composer, systemOptions, compactSession } = setup();
      compactSession.mockResolvedValueOnce({ ok: true });
      await composer.applySlashCommand(TASK_ID, 'compact');
      const system = systemOptions();
      expect(system).toHaveLength(1);
      expect(system[0]?.sessionKey).toBe(SESSION_KEY);
    }

    {
      const { composer, systemOptions, resetSession } = setup();
      resetSession.mockResolvedValueOnce({ ok: true });
      await composer.applySlashCommand(TASK_ID, 'reset');
      const system = systemOptions();
      expect(system).toHaveLength(1);
      expect(system[0]?.sessionKey).toBe(SESSION_KEY);
    }
  });
});
