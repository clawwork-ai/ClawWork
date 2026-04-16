import { ipcMain, shell } from 'electron';
import { saveInboxAttachment } from '../inbox/save.js';
import { readInboxFile, resolveInboxPath } from '../inbox/resolve.js';
import { getWorkspacePath } from '../workspace/config.js';

export function registerInboxHandlers(): void {
  ipcMain.handle('inbox:save', async (_event, params: { taskId: string; fileName: string; base64: string }) => {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return { ok: false, error: 'workspace not configured' };
    try {
      const buffer = Buffer.from(params.base64, 'base64');
      const result = await saveInboxAttachment({
        workspacePath,
        taskId: params.taskId,
        fileName: params.fileName,
        buffer,
      });
      return { ok: true, result };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
    }
  });

  ipcMain.handle('inbox:read-file', async (_event, params: { localPath: string }) => {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return { ok: false, error: 'workspace not configured' };
    try {
      const content = await readInboxFile(workspacePath, params.localPath);
      if (!content) return { ok: false, error: 'invalid path' };
      return { ok: true, result: { content, encoding: 'base64' as const } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
    }
  });

  ipcMain.handle('inbox:open', async (_event, params: { localPath: string }) => {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return { ok: false, error: 'workspace not configured' };
    try {
      const fullPath = await resolveInboxPath(workspacePath, params.localPath);
      if (!fullPath) return { ok: false, error: 'invalid path' };
      const result = await shell.openPath(fullPath);
      if (result) return { ok: false, error: result };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
    }
  });

  ipcMain.handle('inbox:show-in-folder', async (_event, params: { localPath: string }) => {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return { ok: false, error: 'workspace not configured' };
    try {
      const fullPath = await resolveInboxPath(workspacePath, params.localPath);
      if (!fullPath) return { ok: false, error: 'invalid path' };
      shell.showItemInFolder(fullPath);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
    }
  });
}
