import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import {
  getWorkspacePath,
  writeConfig,
  updateConfig,
  isWorkspaceConfigured,
  getDefaultWorkspacePath,
} from '../workspace/config.js';
import { initWorkspace, migrateWorkspace } from '../workspace/init.js';
import { initDatabase, reinitDatabase, closeDatabase } from '../db/index.js';

export function registerWorkspaceHandlers(): void {
  ipcMain.handle('workspace:open-folder', () => {
    const p = getWorkspacePath();
    if (p) shell.openPath(p);
  });

  ipcMain.handle('workspace:is-configured', isWorkspaceConfigured);
  ipcMain.handle('workspace:get-path', getWorkspacePath);
  ipcMain.handle('workspace:get-default', getDefaultWorkspacePath);

  ipcMain.handle('workspace:browse', async () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Workspace Directory',
      defaultPath: getDefaultWorkspacePath(),
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('workspace:setup', async (_event, workspacePath: string) => {
    try {
      await initWorkspace(workspacePath);
      initDatabase(workspacePath);
      writeConfig({ workspacePath, gateways: [] });
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'setup failed';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle('workspace:change', async (_event, newWorkspacePath: string) => {
    const oldPath = getWorkspacePath();
    if (!oldPath) return { ok: false, error: 'no current workspace' };
    if (oldPath === newWorkspacePath) return { ok: true };
    try {
      await migrateWorkspace(oldPath, newWorkspacePath);
      closeDatabase();
      reinitDatabase(newWorkspacePath);
      updateConfig({ workspacePath: newWorkspacePath });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'migration failed' };
    }
  });
}
