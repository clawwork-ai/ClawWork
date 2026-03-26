import type { PersistencePort } from '@clawwork/core';
import {
  listTasks,
  listMessages,
  saveTask,
  updateTask,
  deleteTaskAndMessages,
  saveMessage,
} from '../persistence/db.js';
import type { StoredTask, StoredMessage } from '../persistence/db.js';

export function createBrowserPersistence(): PersistencePort {
  return {
    async loadTasks() {
      try {
        const rows = await listTasks();
        return { ok: true, rows };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'loadTasks failed' };
      }
    },

    async loadMessages(taskId) {
      try {
        const rows = await listMessages(taskId);
        return { ok: true, rows };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'loadMessages failed' };
      }
    },

    async persistTask(task) {
      try {
        await saveTask(task as StoredTask);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'persistTask failed' };
      }
    },

    async persistTaskUpdate({ id, ...updates }) {
      try {
        await updateTask(id, updates);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'persistTaskUpdate failed' };
      }
    },

    async persistMessage(msg) {
      try {
        await saveMessage(msg as StoredMessage);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'persistMessage failed' };
      }
    },

    async deleteTask(taskId) {
      try {
        await deleteTaskAndMessages(taskId);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'deleteTask failed' };
      }
    },
  };
}
