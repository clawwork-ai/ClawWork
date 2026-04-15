import { ipcMain } from 'electron';
import { getSqlite } from '../db/index.js';
import { collectDashboardData } from '../stats/aggregate.js';

export function registerStatsHandlers(): void {
  ipcMain.handle('stats:get-dashboard', async () => {
    const db = getSqlite();
    if (!db) return { ok: false, error: 'database not initialized' };
    try {
      const result = await collectDashboardData(db);
      return { ok: true, result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'stats failed';
      console.error('[stats] get-dashboard failed:', err);
      return { ok: false, error: msg };
    }
  });
}
