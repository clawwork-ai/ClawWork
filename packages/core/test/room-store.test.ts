import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildSessionKey } from '@clawwork/shared';
import { createRoomStore, type RoomStoreDeps } from '../src/stores/room-store';

function createDeps(overrides: Partial<RoomStoreDeps> = {}): RoomStoreDeps {
  return {
    createSession: vi.fn(async () => ({ ok: true })),
    abortChat: vi.fn(async () => ({})),
    listSessionsBySpawner: vi.fn(async () => ({ ok: true, result: { sessions: [] } })),
    persistRoom: vi.fn(async () => ({})),
    persistPerformer: vi.fn(async () => ({})),
    loadRoom: vi.fn(async () => ({ ok: true, room: null, performers: [] })),
    ...overrides,
  };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('room-store persistence failures', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('logs when persistRoom fails in initConductor', async () => {
    const err = new Error('db locked');
    const deps = createDeps({
      persistRoom: vi.fn(async () => {
        throw err;
      }),
    });
    const store = createRoomStore(deps);
    const taskId = 'task-1';
    const sessionKey = buildSessionKey(taskId);

    const ok = await store.getState().initConductor(taskId, 'gw-1', sessionKey, '[]');
    await flushMicrotasks();

    expect(ok).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith('[room-store] persistRoom failed:', err);
    expect(store.getState().getRoom(taskId)?.conductorReady).toBe(true);
  });

  it('logs when persistRoom fails in setRoomStatus', async () => {
    const err = new Error('disk full');
    const taskId = 'task-2';
    const sessionKey = buildSessionKey(taskId);
    const deps = createDeps({
      loadRoom: vi.fn(async () => ({
        ok: true,
        room: { status: 'active', conductorReady: true },
        performers: [],
      })),
      persistRoom: vi.fn(async () => {
        throw err;
      }),
    });
    const store = createRoomStore(deps);
    await store.getState().hydrateRoom(taskId, sessionKey);

    store.getState().setRoomStatus(taskId, 'stopping');
    await flushMicrotasks();

    expect(warnSpy).toHaveBeenCalledWith('[room-store] persistRoom failed:', err);
    expect(store.getState().getRoom(taskId)?.status).toBe('stopping');
  });

  it('logs when persistPerformer fails in registerPerformerKey', async () => {
    const err = new Error('write failed');
    const taskId = 'task-3';
    const sessionKey = buildSessionKey(taskId);
    const subagentKey = 'agent:main:subagent:abc-123-def4-5678-90ab-cdef12345678';
    const deps = createDeps({
      loadRoom: vi.fn(async () => ({
        ok: true,
        room: { status: 'active', conductorReady: true },
        performers: [],
      })),
      persistPerformer: vi.fn(async () => {
        throw err;
      }),
    });
    const store = createRoomStore(deps);
    await store.getState().hydrateRoom(taskId, sessionKey);

    store.getState().registerPerformerKey(taskId, subagentKey, 'performer-1', 'Performer');
    await flushMicrotasks();

    expect(warnSpy).toHaveBeenCalledWith('[room-store] persistPerformer failed:', err);
    expect(store.getState().getRoom(taskId)?.performers).toHaveLength(1);
    expect(store.getState().lookupTaskIdBySubagentKey(subagentKey)).toBe(taskId);
  });
});

describe('room store', () => {
  it('setRoomStatus persists stopped rooms and allows re-init for the same task', async () => {
    const deps = createDeps({
      loadRoom: vi.fn(async () => ({ ok: false, room: null, performers: [] })),
    });
    const store = createRoomStore(deps);
    const sessionKey = buildSessionKey('task-1');

    const ok = await store.getState().initConductor('task-1', 'gw-1', sessionKey, '[]');
    expect(ok).toBe(true);
    expect(store.getState().getRoom('task-1')?.status).toBe('active');

    store.getState().setRoomStatus('task-1', 'stopped');
    expect(store.getState().getRoom('task-1')?.status).toBe('stopped');
    expect(deps.persistRoom).toHaveBeenCalledWith({
      taskId: 'task-1',
      status: 'stopped',
      conductorReady: true,
    });

    const okAgain = await store.getState().initConductor('task-1', 'gw-2', sessionKey, '[]');
    expect(okAgain).toBe(true);
    expect(store.getState().getRoom('task-1')?.status).toBe('active');
    expect(deps.createSession).toHaveBeenLastCalledWith('gw-2', expect.any(Object));
  });

  it('clears subagentKeyMap entries when room reaches stopped', async () => {
    const taskId = 'task-1';
    const sessionKey = buildSessionKey(taskId);
    const subagentKey = 'agent:main:subagent:abc-123-def4-5678-90ab-cdef12345678';
    const deps = createDeps({
      loadRoom: vi.fn(async () => ({
        ok: true,
        room: { status: 'active', conductorReady: true },
        performers: [],
      })),
    });
    const store = createRoomStore(deps);
    await store.getState().hydrateRoom(taskId, sessionKey);
    store.getState().registerPerformerKey(taskId, subagentKey, 'performer-1', 'Performer');

    expect(store.getState().lookupTaskIdBySubagentKey(subagentKey)).toBe(taskId);

    store.getState().setRoomStatus(taskId, 'stopped');

    expect(store.getState().lookupTaskIdBySubagentKey(subagentKey)).toBeUndefined();
  });

  it('clears subagentKeyMap entries hydrated from persisted performers when room stops', async () => {
    const taskId = 'task-1';
    const sessionKey = buildSessionKey(taskId);
    const subagentKey = 'agent:main:subagent:abc-123-def4-5678-90ab-cdef12345678';
    const deps = createDeps({
      loadRoom: vi.fn(async () => ({
        ok: true,
        room: { status: 'active', conductorReady: true },
        performers: [
          {
            sessionKey: subagentKey,
            taskId,
            agentId: 'performer-1',
            agentName: 'Performer',
            emoji: null,
            verifiedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })),
    });
    const store = createRoomStore(deps);
    await store.getState().hydrateRoom(taskId, sessionKey);

    expect(store.getState().lookupTaskIdBySubagentKey(subagentKey)).toBe(taskId);

    store.getState().setRoomStatus(taskId, 'stopped');

    expect(store.getState().lookupTaskIdBySubagentKey(subagentKey)).toBeUndefined();
  });
});
