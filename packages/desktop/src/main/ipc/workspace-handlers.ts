import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import {
  getWorkspacePath,
  writeConfig,
  updateConfig,
  isWorkspaceConfigured,
  getDefaultWorkspacePath,
  ensureDeviceId,
} from '../workspace/config.js';
import { initWorkspace, migrateWorkspace } from '../workspace/init.js';
import { reinitDatabase, closeDatabase } from '../db/index.js';

const TEAM_WORKSPACE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
      reinitDatabase(workspacePath);
      writeConfig({ workspacePath, gateways: [] });
      ensureDeviceId();
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
      closeDatabase();
      await migrateWorkspace(oldPath, newWorkspacePath);
      reinitDatabase(newWorkspacePath);
      updateConfig({ workspacePath: newWorkspacePath });
      return { ok: true };
    } catch (err) {
      reinitDatabase(oldPath);
      return { ok: false, error: err instanceof Error ? err.message : 'migration failed' };
    }
  });

  ipcMain.handle('workspace:get-device-id', () => {
    return ensureDeviceId();
  });

  ipcMain.handle('workspace:team-path', (_event, slug: string) => {
    if (typeof slug !== 'string' || !TEAM_WORKSPACE_SLUG_RE.test(slug)) {
      throw new Error('Invalid team slug');
    }
    const base = getWorkspacePath();
    if (!base) return slug;
    return join(base, slug);
  });
}
