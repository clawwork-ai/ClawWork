import { createStore } from 'zustand/vanilla';
import type { RoomStatus, TaskRoom, RoomPerformer, IpcResult } from '@clawwork/shared';
import { buildConductorPrompt, parseAgentIdFromSessionKey, isSubagentSession } from '@clawwork/shared';

export interface PerformerAgent {
  agentId: string;
  agentName: string;
  emoji?: string;
}

export interface RoomStoreDeps {
  createSession: (
    gatewayId: string,
    params: { key: string; agentId: string; message?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  abortChat: (gatewayId: string, sessionKey: string) => Promise<unknown>;
  listSessionsBySpawner: (gatewayId: string, spawnerKey: string) => Promise<IpcResult>;
  persistRoom: (params: { taskId: string; status: string; conductorReady: boolean }) => Promise<unknown>;
  persistPerformer: (params: {
    taskId: string;
    sessionKey: string;
    agentId: string;
    agentName: string;
    emoji?: string;
    verifiedAt: string;
  }) => Promise<unknown>;
  loadRoom: (taskId: string) => Promise<{
    ok: boolean;
    room: { status: string; conductorReady: boolean } | null;
    performers: Array<{
      sessionKey: string;
      taskId: string;
      agentId: string;
      agentName: string;
      emoji: string | null;
      verifiedAt: string;
    }>;
  }>;
}

export interface RoomState {
  rooms: Record<string, TaskRoom>;
  subagentKeyMap: Record<string, string>;

  initConductor: (
    taskId: string,
    gatewayId: string,
    conductorSessionKey: string,
    agentCatalog: string,
    userMessage?: string,
  ) => Promise<boolean>;
  hydrateRoom: (taskId: string, conductorSessionKey: string) => Promise<void>;
  setRoomStatus: (taskId: string, status: RoomStatus) => void;
  getRoom: (taskId: string) => TaskRoom | undefined;
  lookupTaskIdBySubagentKey: (subagentKey: string) => string | undefined;
  registerPerformerKey: (taskId: string, subagentKey: string, agentId: string, agentName: string) => void;
  verifyCandidates: (taskId: string, gatewayId: string) => Promise<void>;
}

const VERIFY_COOLDOWN_MS = 2000;

export function createRoomStore(deps: RoomStoreDeps) {
  const taskGateways = new Map<string, string>();
  const verifyInFlight = new Set<string>();

  function updateRoom(
    taskId: string,
    patch: Partial<TaskRoom>,
    set: (fn: (s: RoomState) => Partial<RoomState>) => void,
  ) {
    set((s) => {
      const existing = s.rooms[taskId];
      if (!existing) return s;
      return { rooms: { ...s.rooms, [taskId]: { ...existing, ...patch } } };
    });
  }

  const store = createStore<RoomState>((set, get) => ({
    rooms: {},
    subagentKeyMap: {},

    initConductor: async (taskId, gatewayId, conductorSessionKey, agentCatalog, userMessage?) => {
      const room: TaskRoom = {
        taskId,
        conductorSessionKey,
        conductorReady: false,
        status: 'active',
        performers: [],
      };
      set((s) => ({ rooms: { ...s.rooms, [taskId]: room } }));
      taskGateways.set(taskId, gatewayId);

      try {
        let prompt = buildConductorPrompt(agentCatalog);
        if (userMessage) {
          prompt += `\n\n---\nUser task:\n${userMessage}`;
        }

        const res = await deps.createSession(gatewayId, {
          key: conductorSessionKey,
          agentId: parseAgentIdFromSessionKey(conductorSessionKey),
          message: prompt,
        });
        if (!res.ok) {
          return false;
        }

        updateRoom(taskId, { conductorReady: true }, set);
        deps.persistRoom({ taskId, status: 'active', conductorReady: true }).catch(() => {});
        return true;
      } catch (err) {
        console.warn('[room-store] initConductor failed:', err);
        return false;
      }
    },

    hydrateRoom: async (taskId, conductorSessionKey) => {
      try {
        const res = await deps.loadRoom(taskId);
        if (!res.ok || !res.room) return;
        const performers = res.performers.map((p) => ({
          sessionKey: p.sessionKey,
          agentId: p.agentId,
          agentName: p.agentName,
          emoji: p.emoji ?? undefined,
          verifiedAt: p.verifiedAt,
        }));
        const room: TaskRoom = {
          taskId,
          conductorSessionKey,
          conductorReady: res.room.conductorReady,
          status: res.room.status as RoomStatus,
          performers,
        };
        const keyMap: Record<string, string> = {};
        for (const p of performers) {
          if (isSubagentSession(p.sessionKey)) {
            keyMap[p.sessionKey] = taskId;
          }
        }
        set((s) => ({
          rooms: { ...s.rooms, [taskId]: room },
          subagentKeyMap: { ...s.subagentKeyMap, ...keyMap },
        }));
      } catch {
        console.warn('[room-store] hydrateRoom failed for', taskId);
      }
    },

    setRoomStatus: (taskId, status) => {
      updateRoom(taskId, { status }, set);
      const room = get().rooms[taskId];
      if (room) {
        deps.persistRoom({ taskId, status, conductorReady: room.conductorReady }).catch(() => {});
      }
    },

    getRoom: (taskId) => get().rooms[taskId],

    lookupTaskIdBySubagentKey: (subagentKey) => get().subagentKeyMap[subagentKey],

    registerPerformerKey: (taskId, subagentKey, agentId, agentName) => {
      const room = get().rooms[taskId];
      if (!room) return;

      const already = room.performers.some((p) => p.sessionKey === subagentKey);
      if (already) return;

      const performer: RoomPerformer = {
        sessionKey: subagentKey,
        agentId,
        agentName,
        verifiedAt: new Date().toISOString(),
      };

      set((s) => {
        const existing = s.rooms[taskId];
        if (!existing) return s;
        return {
          rooms: { ...s.rooms, [taskId]: { ...existing, performers: [...existing.performers, performer] } },
          subagentKeyMap: { ...s.subagentKeyMap, [subagentKey]: taskId },
        };
      });
      deps.persistPerformer({ taskId, ...performer }).catch(() => {});
    },

    verifyCandidates: async (taskId, gatewayId) => {
      if (verifyInFlight.has(taskId)) return;
      verifyInFlight.add(taskId);

      try {
        const room = get().rooms[taskId];
        if (!room) return;

        const raw = await deps.listSessionsBySpawner(gatewayId, room.conductorSessionKey);
        if (!raw.ok) return;
        const payload = raw.result as { sessions?: Array<{ key: string; agentId?: string }> } | undefined;
        const sessions = payload?.sessions;
        if (!Array.isArray(sessions)) return;

        for (const sess of sessions) {
          if (!isSubagentSession(sess.key)) continue;
          const agentId = sess.agentId ?? parseAgentIdFromSessionKey(sess.key);
          get().registerPerformerKey(taskId, sess.key, agentId, agentId);
        }
      } catch (err) {
        console.warn('[room-store] verifyCandidates failed:', err);
      } finally {
        setTimeout(() => verifyInFlight.delete(taskId), VERIFY_COOLDOWN_MS);
      }
    },
  }));

  return store;
}
