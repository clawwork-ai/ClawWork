import { ipcMain, shell } from 'electron';
import { saveInboxAttachment } from '../inbox/save.js';
import { readInboxFile, resolveInboxPath } from '../inbox/resolve.js';
import { getWorkspacePath } from '../workspace/config.js';

const MAX_INBOX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export function registerInboxHandlers(): void {
  ipcMain.handle('inbox:save', async (_event, params: { taskId: string; fileName: string; base64: string }) => {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return { ok: false, error: 'workspace not configured' };
    try {
      const base64 = params.base64.trim();
      const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
      const estimatedBytes = Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
      if (estimatedBytes > MAX_INBOX_ATTACHMENT_BYTES) return { ok: false, error: 'attachment too large' };

      const buffer = Buffer.from(base64, 'base64');
      if (buffer.length > MAX_INBOX_ATTACHMENT_BYTES) return { ok: false, error: 'attachment too large' };

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
