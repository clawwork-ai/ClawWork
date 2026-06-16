import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSessionKey } from '@clawwork/shared';
import { createTaskStore, type TaskStoreDeps } from '../src/stores/task-store';

function createDeps(overrides: Partial<TaskStoreDeps> = {}): TaskStoreDeps {
  return {
    persistTask: vi.fn(async () => ({ ok: true })),
    persistTaskUpdate: vi.fn(async () => ({ ok: true })),
    deleteTask: vi.fn(async () => ({ ok: true })),
    loadTasks: vi.fn(async () => ({ ok: true, rows: [] })),
    patchSession: vi.fn(async () => ({ ok: true })),
    getDeviceId: vi.fn(async () => 'device-abc'),
    getDefaultGatewayId: () => 'gw-1',
    getAgentCatalog: () => ({ agents: [], defaultId: 'main' }),
    ...overrides,
  };
}

describe('task-store hydrate', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
  });

  it('serializes concurrent hydrate calls and resolves deviceId once', async () => {
    let resolveDeviceId!: (id: string) => void;
    const getDeviceId = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveDeviceId = resolve;
        }),
    );
    let resolveLoadTasks!: (value: Awaited<ReturnType<TaskStoreDeps['loadTasks']>>) => void;
    const loadTasksPromise = new Promise<Awaited<ReturnType<TaskStoreDeps['loadTasks']>>>((resolve) => {
      resolveLoadTasks = resolve;
    });
    const loadTasks = vi.fn(() => loadTasksPromise);
    const deps = createDeps({ getDeviceId, loadTasks });
    const store = createTaskStore(deps);

    const hydrate1 = store.getState().hydrate();
    const hydrate2 = store.getState().hydrate();

    expect(getDeviceId).toHaveBeenCalledTimes(1);
    expect(loadTasks).not.toHaveBeenCalled();

    resolveDeviceId('device-abc');
    await vi.waitFor(() => expect(loadTasks).toHaveBeenCalledTimes(1));

    resolveLoadTasks({
      ok: true,
      rows: [
        {
          id: 'task-1',
          sessionKey: buildSessionKey('task-1', 'main', 'device-abc'),
          sessionId: 'session-1',
          title: 'Existing task',
          status: 'active',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          tags: [],
          artifactDir: 'tasks/task-1',
          gatewayId: 'gw-1',
        },
      ],
    });

    await Promise.all([hydrate1, hydrate2]);

    expect(loadTasks).toHaveBeenCalledTimes(1);
    expect(store.getState().hydrated).toBe(true);
    expect(store.getState().tasks).toHaveLength(1);
  });

  it('includes deviceId in session keys created after store init', async () => {
    let resolveDeviceId!: (id: string) => void;
    const getDeviceId = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveDeviceId = resolve;
        }),
    );
    const deps = createDeps({ getDeviceId });
    const store = createTaskStore(deps);

    resolveDeviceId('device-abc');
    await Promise.resolve();

    const task = store.getState().createTask({ gatewayId: 'gw-1', agentId: 'main' });

    expect(task.sessionKey).toBe(buildSessionKey('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'main', 'device-abc'));
  });
});
