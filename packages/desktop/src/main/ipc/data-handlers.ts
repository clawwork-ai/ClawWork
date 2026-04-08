import { ipcMain } from 'electron';
import { eq, desc } from 'drizzle-orm';
import { getDb, isDbReady } from '../db/index.js';
import { tasks, messages, artifacts, taskRooms, taskRoomSessions, teams, teamAgents } from '../db/schema.js';
import { autoExtractArtifacts } from '../artifact/auto-extract.js';
import { getWorkspacePath } from '../workspace/config.js';

function ipcError(err: unknown): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
}

export function registerDataHandlers(): void {
  ipcMain.handle(
    'data:create-task',
    (
      _event,
      task: {
        id: string;
        sessionKey: string;
        sessionId: string;
        title: string;
        status: string;
        ensemble?: boolean;
        model?: string;
        modelProvider?: string;
        thinkingLevel?: string;
        inputTokens?: number;
        outputTokens?: number;
        contextTokens?: number;
        teamId?: string;
        createdAt: string;
        updatedAt: string;
        tags: string[];
        artifactDir: string;
        gatewayId: string;
      },
    ) => {
      if (!isDbReady()) return ipcError(new Error('database not ready'));
      try {
        const db = getDb();
        db.insert(tasks)
          .values({
            id: task.id,
            sessionKey: task.sessionKey,
            sessionId: task.sessionId,
            title: task.title,
            status: task.status,
            ensemble: task.ensemble ?? false,
            model: task.model,
            modelProvider: task.modelProvider,
            thinkingLevel: task.thinkingLevel,
            inputTokens: task.inputTokens,
            outputTokens: task.outputTokens,
            contextTokens: task.contextTokens,
            teamId: task.teamId ?? null,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            tags: JSON.stringify(task.tags),
            artifactDir: task.artifactDir,
            gatewayId: task.gatewayId,
          })
          .run();
        return { ok: true };
      } catch (err) {
        console.error('[data] create-task failed:', err);
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'data:update-task',
    (
      _event,
      params: {
        id: string;
        title?: string;
        status?: string;
        ensemble?: boolean;
        model?: string;
        modelProvider?: string;
        thinkingLevel?: string;
        inputTokens?: number;
        outputTokens?: number;
        contextTokens?: number;
        teamId?: string | null;
        updatedAt: string;
      },
    ) => {
      if (!isDbReady()) return ipcError(new Error('database not ready'));
      try {
        const db = getDb();
        const updates: Record<string, string | number | boolean | null | undefined> = { updatedAt: params.updatedAt };
        if (params.title !== undefined) updates.title = params.title;
        if (params.status !== undefined) updates.status = params.status;
        if (params.ensemble !== undefined) updates.ensemble = params.ensemble;
        if (params.model !== undefined) updates.model = params.model;
        if (params.modelProvider !== undefined) updates.modelProvider = params.modelProvider;
        if (params.thinkingLevel !== undefined) updates.thinkingLevel = params.thinkingLevel;
        if (params.inputTokens !== undefined) updates.inputTokens = params.inputTokens;
        if (params.outputTokens !== undefined) updates.outputTokens = params.outputTokens;
        if (params.contextTokens !== undefined) updates.contextTokens = params.contextTokens;
        if (params.teamId !== undefined) updates.teamId = params.teamId;
        db.update(tasks).set(updates).where(eq(tasks.id, params.id)).run();
        return { ok: true };
      } catch (err) {
        console.error('[data] update-task failed:', err);
        return ipcError(err);
      }
    },
  );

  ipcMain.handle(
    'data:create-message',
    (
      _event,
      msg: {
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
      },
    ) => {
      if (!isDbReady()) return ipcError(new Error('database not ready'));
      try {
        const db = getDb();
        let resolvedSessionKey = msg.sessionKey;
        if (!resolvedSessionKey) {
          const task = db.select({ sk: tasks.sessionKey }).from(tasks).where(eq(tasks.id, msg.taskId)).get();
          resolvedSessionKey = task?.sk ?? '';
        }
        db.insert(messages)
          .values({
            id: msg.id,
            taskId: msg.taskId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            sessionKey: resolvedSessionKey,
            agentId: msg.agentId ?? null,
            runId: msg.runId ?? null,
            imageAttachments: msg.imageAttachments?.length ? JSON.stringify(msg.imageAttachments) : null,
            toolCalls: msg.toolCalls?.length ? JSON.stringify(msg.toolCalls) : null,
          })
          .onConflictDoUpdate({
            target: [messages.taskId, messages.sessionKey, messages.role, messages.timestamp],
            set: {
              content: msg.content,
              agentId: msg.agentId ?? null,
              runId: msg.runId ?? null,
              imageAttachments: msg.imageAttachments?.length ? JSON.stringify(msg.imageAttachments) : null,
              toolCalls: msg.toolCalls?.length ? JSON.stringify(msg.toolCalls) : null,
            },
          })
          .run();
        if (msg.role === 'assistant' && msg.content.length > 0) {
          const workspacePath = getWorkspacePath();
          if (workspacePath) {
            autoExtractArtifacts({ workspacePath, taskId: msg.taskId, messageId: msg.id, content: msg.content }).catch(
              (err: unknown) => console.error('[auto-extract]', err),
            );
          }
        }
        return { ok: true };
      } catch (err) {
        console.error('[data] create-message failed:', err);
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('data:delete-task', (_event, params: { id: string }) => {
    if (!isDbReady()) return ipcError(new Error('database not ready'));
    try {
      const db = getDb();
      db.delete(taskRoomSessions).where(eq(taskRoomSessions.taskId, params.id)).run();
      db.delete(taskRooms).where(eq(taskRooms.taskId, params.id)).run();
      db.delete(artifacts).where(eq(artifacts.taskId, params.id)).run();
      db.delete(messages).where(eq(messages.taskId, params.id)).run();
      db.delete(tasks).where(eq(tasks.id, params.id)).run();
      return { ok: true };
    } catch (err) {
      console.error('[data] delete-task failed:', err);
      return ipcError(err);
    }
  });

  ipcMain.handle('data:list-tasks', () => {
    if (!isDbReady()) return { ok: true, rows: [] };
    try {
      const db = getDb();
      const rows = db.select().from(tasks).orderBy(desc(tasks.createdAt)).all();
      return {
        ok: true,
        rows: rows.map((r) => {
          let tags: string[] = [];
          try {
            tags = JSON.parse(r.tags as string);
          } catch {}
          return { ...r, tags };
        }),
      };
    } catch (err) {
      console.error('[data] list-tasks failed:', err);
      return ipcError(err);
    }
  });

  ipcMain.handle('data:list-messages', (_event, params: { taskId: string }) => {
    if (!isDbReady()) return { ok: true, rows: [] };
    try {
      const db = getDb();
      const rows = db
        .select()
        .from(messages)
        .where(eq(messages.taskId, params.taskId))
        .orderBy(messages.timestamp)
        .all();
      return {
        ok: true,
        rows: rows.map((r) => {
          let imageAttachments: unknown[] | undefined;
          let toolCalls: unknown[] | undefined;
          if (r.imageAttachments) {
            try {
              imageAttachments = JSON.parse(r.imageAttachments as string);
            } catch {}
          }
          if (r.toolCalls) {
            try {
              toolCalls = JSON.parse(r.toolCalls as string);
            } catch {}
          }
          return { ...r, imageAttachments, toolCalls };
        }),
      };
    } catch (err) {
      console.error('[data] list-messages failed:', err);
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'data:persist-room',
    (
      _event,
      params: {
        taskId: string;
        status: string;
        conductorReady: boolean;
      },
    ) => {
      if (!isDbReady()) return ipcError(new Error('database not ready'));
      try {
        const db = getDb();
        db.insert(taskRooms)
          .values({
            taskId: params.taskId,
            status: params.status,
            conductorReady: params.conductorReady,
          })
          .onConflictDoUpdate({
            target: [taskRooms.taskId],
            set: {
              status: params.status,
              conductorReady: params.conductorReady,
            },
          })
          .run();
        return { ok: true };
      } catch (err) {
        console.error('[data] persist-room failed:', err);
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('data:load-room', (_event, params: { taskId: string }) => {
    if (!isDbReady()) return { ok: true, room: null, performers: [] };
    try {
      const db = getDb();
      const room = db.select().from(taskRooms).where(eq(taskRooms.taskId, params.taskId)).get();
      const performers = db.select().from(taskRoomSessions).where(eq(taskRoomSessions.taskId, params.taskId)).all();
      return { ok: true, room: room ?? null, performers };
    } catch (err) {
      console.error('[data] load-room failed:', err);
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'data:persist-performer',
    (
      _event,
      params: {
        taskId: string;
        sessionKey: string;
        agentId: string;
        agentName: string;
        emoji?: string;
        verifiedAt: string;
      },
    ) => {
      if (!isDbReady()) return ipcError(new Error('database not ready'));
      try {
        const db = getDb();
        db.insert(taskRoomSessions)
          .values({
            sessionKey: params.sessionKey,
            taskId: params.taskId,
            agentId: params.agentId,
            agentName: params.agentName,
            emoji: params.emoji ?? null,
            verifiedAt: params.verifiedAt,
          })
          .onConflictDoUpdate({
            target: [taskRoomSessions.sessionKey],
            set: {
              agentId: params.agentId,
              agentName: params.agentName,
              emoji: params.emoji ?? null,
              verifiedAt: params.verifiedAt,
            },
          })
          .run();
        return { ok: true };
      } catch (err) {
        console.error('[data] persist-performer failed:', err);
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('data:delete-room', (_event, params: { taskId: string }) => {
    if (!isDbReady()) return ipcError(new Error('database not ready'));
    try {
      const db = getDb();
      db.delete(taskRoomSessions).where(eq(taskRoomSessions.taskId, params.taskId)).run();
      db.delete(taskRooms).where(eq(taskRooms.taskId, params.taskId)).run();
      return { ok: true };
    } catch (err) {
      console.error('[data] delete-room failed:', err);
      return ipcError(err);
    }
  });

  ipcMain.handle('data:teams-list', () => {
    if (!isDbReady()) return { ok: true, result: [] };
    try {
      const db = getDb();
      const rows = db.select().from(teams).orderBy(desc(teams.createdAt)).all();
      const agentRows = db.select().from(teamAgents).all();
      const agentsByTeam = new Map<
        string,
        Array<{ agentId: string; role: string | null; isManager: boolean | null }>
      >();
      for (const a of agentRows) {
        let list = agentsByTeam.get(a.teamId);
        if (!list) {
          list = [];
          agentsByTeam.set(a.teamId, list);
        }
        list.push({ agentId: a.agentId, role: a.role, isManager: a.isManager });
      }
      return {
        ok: true,
        result: rows.map((r) => ({
          ...r,
          agents: (agentsByTeam.get(r.id) ?? []).map((a) => ({
            agentId: a.agentId,
            role: a.role ?? '',
            isManager: a.isManager ?? false,
          })),
        })),
      };
    } catch (err) {
      console.error('[data] teams-list failed:', err);
      return ipcError(err);
    }
  });

  ipcMain.handle('data:team-get', (_event, params: { id: string }) => {
    if (!isDbReady()) return ipcError(new Error('database not ready'));
    try {
      const db = getDb();
      const row = db.select().from(teams).where(eq(teams.id, params.id)).get();
      if (!row) return { ok: true, result: null };
      const agents = db
        .select()
        .from(teamAgents)
        .where(eq(teamAgents.teamId, params.id))
        .all()
        .map((a) => ({ agentId: a.agentId, role: a.role ?? '', isManager: a.isManager ?? false }));
      return { ok: true, result: { ...row, agents } };
    } catch (err) {
      console.error('[data] team-get failed:', err);
      return ipcError(err);
    }
  });

  ipcMain.handle(
    'data:team-persist',
    (
      _event,
      params: {
        id: string;
        name: string;
        emoji?: string;
        description?: string;
        gatewayId: string;
        source?: string;
        version?: string;
        hubSlug?: string;
        agents: Array<{ agentId: string; role?: string; isManager?: boolean }>;
        createdAt: string;
        updatedAt: string;
      },
    ) => {
      if (!isDbReady()) return ipcError(new Error('database not ready'));
      try {
        const db = getDb();
        db.transaction((tx) => {
          tx.insert(teams)
            .values({
              id: params.id,
              name: params.name,
              emoji: params.emoji ?? '',
              description: params.description ?? '',
              gatewayId: params.gatewayId,
              source: params.source ?? 'local',
              version: params.version ?? '',
              hubSlug: params.hubSlug ?? '',
              createdAt: params.createdAt,
              updatedAt: params.updatedAt,
            })
            .onConflictDoUpdate({
              target: [teams.id],
              set: {
                name: params.name,
                emoji: params.emoji ?? '',
                description: params.description ?? '',
                gatewayId: params.gatewayId,
                source: params.source ?? 'local',
                version: params.version ?? '',
                hubSlug: params.hubSlug ?? '',
                updatedAt: params.updatedAt,
              },
            })
            .run();
          tx.delete(teamAgents).where(eq(teamAgents.teamId, params.id)).run();
          for (const agent of params.agents) {
            tx.insert(teamAgents)
              .values({
                teamId: params.id,
                agentId: agent.agentId,
                role: agent.role ?? '',
                isManager: agent.isManager ?? false,
              })
              .run();
          }
        });
        return { ok: true };
      } catch (err) {
        console.error('[data] team-persist failed:', err);
        return ipcError(err);
      }
    },
  );

  ipcMain.handle('data:team-delete', (_event, params: { id: string }) => {
    if (!isDbReady()) return ipcError(new Error('database not ready'));
    try {
      const db = getDb();
      db.transaction((tx) => {
        tx.delete(teamAgents).where(eq(teamAgents.teamId, params.id)).run();
        tx.delete(teams).where(eq(teams.id, params.id)).run();
      });
      return { ok: true };
    } catch (err) {
      console.error('[data] team-delete failed:', err);
      return ipcError(err);
    }
  });
}
