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
