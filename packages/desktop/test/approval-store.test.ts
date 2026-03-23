import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '@clawwork/shared';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

async function loadStores() {
  vi.resetModules();
  const [approvalStore, taskStore, uiStore] = await Promise.all([
    import('../src/renderer/stores/approvalStore'),
    import('../src/renderer/stores/taskStore'),
    import('../src/renderer/stores/uiStore'),
  ]);
  return { approvalStore, taskStore, uiStore };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('approval store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const windowWithClawwork = (globalThis.window ??= {} as typeof globalThis.window) as Window & {
      clawwork: {
        resolveExecApproval: ReturnType<typeof vi.fn>;
        updateSettings: ReturnType<typeof vi.fn>;
      };
    };
    windowWithClawwork.clawwork = {
      resolveExecApproval: vi.fn().mockResolvedValue({ ok: true }),
      updateSettings: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as typeof windowWithClawwork.clawwork;
    const storage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    vi.stubGlobal('localStorage', storage);
  });

  it('associates approvals with the matching task and marks inactive tasks unread', async () => {
    const { approvalStore, taskStore, uiStore } = await loadStores();

    const task: Task = {
      id: 'task-1',
      sessionKey: 'agent:main:clawwork:task:task-1',
      sessionId: '',
      title: 'Task 1',
      status: 'active',
      createdAt: '2026-03-23T00:00:00.000Z',
      updatedAt: '2026-03-23T00:00:00.000Z',
      tags: [],
      artifactDir: '',
      gatewayId: 'gw-1',
      agentId: 'main',
    };

    taskStore.useTaskStore.setState({
      tasks: [task],
      activeTaskId: 'another-task',
      hydrated: true,
      pendingNewTask: null,
    });

    approvalStore.useApprovalStore.getState().addApproval('gw-1', {
      id: 'approval-1',
      request: {
        command: 'rm -rf tmp',
        sessionKey: 'agent:main:clawwork:task:task-1',
      },
      createdAtMs: Date.now(),
      expiresAtMs: Date.now() + 30_000,
    });

    const pending = approvalStore.useApprovalStore.getState().pendingApprovals;
    expect(pending).toHaveLength(1);
    expect(pending[0]?.taskId).toBe('task-1');
    expect(uiStore.useUiStore.getState().unreadTaskIds.has('task-1')).toBe(true);
  });

  it('keeps pending approval visible when resolve fails', async () => {
    const { approvalStore } = await loadStores();

    window.clawwork.resolveExecApproval.mockResolvedValueOnce({ ok: false, error: 'denied upstream' });

    approvalStore.useApprovalStore.setState({
      pendingApprovals: [
        {
          id: 'approval-1',
          gatewayId: 'gw-1',
          taskId: null,
          request: { command: 'uname -a' },
          createdAtMs: Date.now(),
          expiresAtMs: Date.now() + 30_000,
        },
      ],
    });

    approvalStore.useApprovalStore.getState().resolveApproval('approval-1', 'allow-once');
    await flushMicrotasks();

    expect(window.clawwork.resolveExecApproval).toHaveBeenCalledWith('gw-1', 'approval-1', 'allow-once');
    expect(approvalStore.useApprovalStore.getState().pendingApprovals).toHaveLength(1);
  });

  it('removes pending approval after a successful resolve', async () => {
    const { approvalStore } = await loadStores();

    approvalStore.useApprovalStore.setState({
      pendingApprovals: [
        {
          id: 'approval-1',
          gatewayId: 'gw-1',
          taskId: null,
          request: { command: 'uname -a' },
          createdAtMs: Date.now(),
          expiresAtMs: Date.now() + 30_000,
        },
      ],
    });

    approvalStore.useApprovalStore.getState().resolveApproval('approval-1', 'allow-once');
    await flushMicrotasks();

    expect(approvalStore.useApprovalStore.getState().pendingApprovals).toHaveLength(0);
  });
});
