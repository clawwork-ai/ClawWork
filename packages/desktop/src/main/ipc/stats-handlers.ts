import { ipcMain } from 'electron';
import { getSqlite } from '../db/index.js';
import { collectProfileData } from '../stats/aggregate.js';

export function registerStatsHandlers(): void {
  ipcMain.handle('stats:get-profile', () => {
    const db = getSqlite();
    if (!db) return { ok: false, error: 'database not initialized' };
    try {
      const result = collectProfileData(db);
      return { ok: true, result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'stats failed';
      console.error('[stats] get-profile failed:', err);
      return { ok: false, error: msg };
    }
  });
}
