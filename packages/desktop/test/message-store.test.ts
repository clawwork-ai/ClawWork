import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadStore() {
  vi.resetModules();
  const module = await import('../src/renderer/stores/messageStore');
  return module;
}

describe('message store tool call persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const windowWithClawwork = (globalThis.window ??= {} as typeof globalThis.window) as Window & {
      clawwork: {
        persistMessage: ReturnType<typeof vi.fn>;
      };
    };
    windowWithClawwork.clawwork = {
      persistMessage: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as typeof windowWithClawwork.clawwork;
  });

  it('persists tool status updates for the latest assistant message after promotion', async () => {
    const { useMessageStore } = await loadStore();

    useMessageStore.setState({
      messagesByTask: {
        'task-1': [
          {
            id: 'assistant-1',
            taskId: 'task-1',
            role: 'assistant',
            content: 'Done',
            artifacts: [],
            toolCalls: [
              {
                id: 'exec-1',
                name: 'exec',
                status: 'running',
                startedAt: '2026-03-16T10:00:00.000Z',
              },
            ],
            timestamp: '2026-03-16T10:00:01.000Z',
          },
        ],
      },
      activeTurnBySession: {},
      processingBySession: new Set(),
      highlightedMessageId: null,
    });

    useMessageStore.getState().upsertToolCall('agent:main:clawwork:task:task-1', 'task-1', {
      id: 'exec-1',
      name: 'exec',
      status: 'done',
      result: 'uname -a',
      startedAt: '2026-03-16T10:00:00.000Z',
      completedAt: '2026-03-16T10:00:02.000Z',
    });

    const saved = useMessageStore.getState().messagesByTask['task-1'][0];
    expect(saved.toolCalls).toEqual([expect.objectContaining({ id: 'exec-1', status: 'done', result: 'uname -a' })]);
    expect(window.clawwork.persistMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'assistant-1',
        taskId: 'task-1',
        role: 'assistant',
        toolCalls: [expect.objectContaining({ id: 'exec-1', status: 'done', result: 'uname -a' })],
      }),
    );
  });
});
