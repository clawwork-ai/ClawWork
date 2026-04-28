import { ipcMain } from 'electron';
import { readOpenClawMediaFile } from '../media/resolve.js';

export function registerMediaHandlers(): void {
  ipcMain.handle('media:read-file', async (_event, params: { sourcePath: string }) => {
    try {
      const content = await readOpenClawMediaFile(params.sourcePath);
      if (!content) return { ok: false, error: 'invalid path' };
      return { ok: true, result: { content, encoding: 'base64' as const } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
    }
  });
}
