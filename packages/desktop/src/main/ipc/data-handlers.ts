import { ipcMain } from 'electron';
import { eq, desc } from 'drizzle-orm';
import { getDb, isDbReady } from '../db/index.js';
import { tasks, messages, artifacts } from '../db/schema.js';

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
        model?: string;
        modelProvider?: string;
        thinkingLevel?: string;
        inputTokens?: number;
        outputTokens?: number;
        contextTokens?: number;
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
            model: task.model,
            modelProvider: task.modelProvider,
            thinkingLevel: task.thinkingLevel,
            inputTokens: task.inputTokens,
            outputTokens: task.outputTokens,
            contextTokens: task.contextTokens,
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
        model?: string;
        modelProvider?: string;
        thinkingLevel?: string;
        inputTokens?: number;
        outputTokens?: number;
        contextTokens?: number;
        updatedAt: string;
      },
    ) => {
      if (!isDbReady()) return ipcError(new Error('database not ready'));
      try {
        const db = getDb();
        const updates: Record<string, string | number | null | undefined> = { updatedAt: params.updatedAt };
        if (params.title !== undefined) updates.title = params.title;
        if (params.status !== undefined) updates.status = params.status;
        if (params.model !== undefined) updates.model = params.model;
        if (params.modelProvider !== undefined) updates.modelProvider = params.modelProvider;
        if (params.thinkingLevel !== undefined) updates.thinkingLevel = params.thinkingLevel;
        if (params.inputTokens !== undefined) updates.inputTokens = params.inputTokens;
        if (params.outputTokens !== undefined) updates.outputTokens = params.outputTokens;
        if (params.contextTokens !== undefined) updates.contextTokens = params.contextTokens;
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
        imageAttachments?: unknown[];
      },
    ) => {
      if (!isDbReady()) return ipcError(new Error('database not ready'));
      try {
        const db = getDb();
        db.insert(messages)
          .values({
            id: msg.id,
            taskId: msg.taskId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            imageAttachments: msg.imageAttachments?.length ? JSON.stringify(msg.imageAttachments) : null,
          })
          .run();
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
          if (r.imageAttachments) {
            try {
              imageAttachments = JSON.parse(r.imageAttachments as string);
            } catch {}
          }
          return { ...r, imageAttachments };
        }),
      };
    } catch (err) {
      console.error('[data] list-messages failed:', err);
      return ipcError(err);
    }
  });
}
