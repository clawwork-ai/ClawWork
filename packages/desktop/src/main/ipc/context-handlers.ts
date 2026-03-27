import { ipcMain, dialog, BrowserWindow } from 'electron';
import { scanFolder } from '../context/file-index.js';
import { readContextFile } from '../context/file-reader.js';
import { watchFolder, unwatchFolder } from '../context/file-watcher.js';

export function registerContextHandlers(): void {
  ipcMain.handle('context:select-folder', async () => {
    try {
      const win = BrowserWindow.getAllWindows()[0];
      if (!win) return { ok: false, error: 'no window' };

      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
        title: 'Select Context Folder',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { ok: true, result: null };
      }

      return { ok: true, result: result.filePaths[0] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle('context:list-files', (_event, params: { folders: string[]; query?: string }) => {
    try {
      const folders = params?.folders ?? [];
      const allFiles = [];
      for (const folder of folders) {
        try {
          allFiles.push(...scanFolder(folder, { query: params?.query }));
        } catch {
          continue;
        }
      }

      return { ok: true, result: allFiles.slice(0, 100) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle('context:watch-folder', (_event, folderPath: string) => {
    watchFolder(folderPath);
    return { ok: true };
  });

  ipcMain.handle('context:unwatch-folder', (_event, folderPath: string) => {
    unwatchFolder(folderPath);
    return { ok: true };
  });

  ipcMain.handle('context:read-file', (_event, params: { absolutePath: string; folders: string[] }) => {
    try {
      const result = readContextFile(params.absolutePath, params?.folders ?? []);
      return { ok: true, result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });
}
