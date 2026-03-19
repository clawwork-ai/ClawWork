import { ipcMain, BrowserWindow, net } from 'electron';
import { readFileSync } from 'fs';
import { resolve, sep } from 'path';
import { eq } from 'drizzle-orm';
import { getDb, getSqlite } from '../db/index.js';
import { artifacts } from '../db/schema.js';
import { saveArtifact, saveArtifactFromBuffer } from '../artifact/save.js';
import { commitArtifact } from '../artifact/git.js';
import { getWorkspacePath } from '../workspace/config.js';
import { searchArtifacts } from '../db/search.js';

interface SaveParams {
  taskId: string;
  sourcePath: string;
  messageId: string;
  fileName?: string;
  mediaType?: string;
}

export function registerArtifactHandlers(): void {
  ipcMain.handle('artifact:save', async (_event, params: SaveParams) => {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) {
      return { ok: false, error: 'workspace not configured' };
    }
    try {
      const artifact = await saveArtifact({
        workspacePath,
        taskId: params.taskId,
        sourcePath: params.sourcePath,
        messageId: params.messageId,
        fileName: params.fileName,
        mediaType: params.mediaType,
      });

      const sha = await commitArtifact(workspacePath, artifact.localPath);
      if (sha) {
        const db = getDb();
        db.update(artifacts).set({ gitSha: sha }).where(eq(artifacts.id, artifact.id)).run();
        artifact.gitSha = sha;
      }

      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        win.webContents.send('artifact:saved', artifact);
      }

      return { ok: true, result: artifact };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle('artifact:list', async (_event, params: { taskId?: string }) => {
    try {
      const db = getDb();
      const rows = params.taskId
        ? db.select().from(artifacts).where(eq(artifacts.taskId, params.taskId)).all()
        : db.select().from(artifacts).all();
      return { ok: true, result: rows };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle('artifact:get', async (_event, params: { id: string }) => {
    try {
      const db = getDb();
      const rows = db.select().from(artifacts).where(eq(artifacts.id, params.id)).all();
      if (rows.length === 0) {
        return { ok: false, error: 'artifact not found' };
      }
      return { ok: true, result: rows[0] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle('artifact:read-file', async (_event, params: { localPath: string }) => {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return { ok: false, error: 'workspace not configured' };
    try {
      const normalizedBase = resolve(workspacePath);
      const fullPath = resolve(normalizedBase, params.localPath);
      if (!fullPath.startsWith(normalizedBase + sep) && fullPath !== normalizedBase) {
        return { ok: false, error: 'invalid path' };
      }
      const encoding = isTextFile(params.localPath) ? 'utf-8' : 'base64';
      const content = readFileSync(fullPath, encoding);
      return { ok: true, result: { content, encoding } };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle(
    'artifact:save-content',
    async (
      _event,
      params: { taskId: string; messageId: string; content: string; language?: string; fileName?: string },
    ) => {
      const workspacePath = getWorkspacePath();
      if (!workspacePath) return { ok: false, error: 'workspace not configured' };
      try {
        const LANG_EXT: Record<string, string> = {
          typescript: 'ts',
          javascript: 'js',
          python: 'py',
          rust: 'rs',
          go: 'go',
          java: 'java',
          md: 'md',
          markdown: 'md',
          tsx: 'tsx',
          jsx: 'jsx',
          json: 'json',
          css: 'css',
          html: 'html',
          sh: 'sh',
          bash: 'sh',
          sql: 'sql',
          yaml: 'yml',
          yml: 'yml',
        };
        const fileName =
          params.fileName ??
          (() => {
            const ext = (params.language && LANG_EXT[params.language.toLowerCase()]) ?? params.language ?? 'txt';
            return `snippet.${ext}`;
          })();
        const buffer = Buffer.from(params.content, 'utf-8');
        const artifact = await saveArtifactFromBuffer({
          workspacePath,
          taskId: params.taskId,
          messageId: params.messageId,
          fileName,
          buffer,
          artifactType: 'code',
          contentText: params.content,
        });
        const sha = await commitArtifact(workspacePath, artifact.localPath, `save: ${artifact.name}`);
        if (sha) {
          const db = getDb();
          db.update(artifacts).set({ gitSha: sha }).where(eq(artifacts.id, artifact.id)).run();
          artifact.gitSha = sha;
        }
        const win = BrowserWindow.getAllWindows()[0];
        if (win) win.webContents.send('artifact:saved', artifact);
        return { ok: true, result: artifact };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
      }
    },
  );

  ipcMain.handle(
    'artifact:save-image-url',
    async (_event, params: { taskId: string; messageId: string; url: string; alt?: string }) => {
      const workspacePath = getWorkspacePath();
      if (!workspacePath) return { ok: false, error: 'workspace not configured' };
      try {
        let buffer: Buffer;
        const url = params.url;
        if (/^https?:\/\//.test(url)) {
          const res = await net.fetch(url);
          if (!res.ok) return { ok: false, error: `fetch failed: ${res.status}` };
          buffer = Buffer.from(await res.arrayBuffer());
        } else if (url.startsWith('file://')) {
          const filePath = resolve(url.replace('file://', ''));
          if (!filePath.startsWith(resolve(workspacePath) + sep)) {
            return { ok: false, error: 'file path outside workspace' };
          }
          buffer = readFileSync(filePath);
        } else {
          return { ok: false, error: 'unsupported url scheme' };
        }
        const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'png';
        const baseName = params.alt ? `${params.alt.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}` : `image.${ext}`;
        const artifact = await saveArtifactFromBuffer({
          workspacePath,
          taskId: params.taskId,
          messageId: params.messageId,
          fileName: baseName,
          buffer,
          artifactType: 'image',
        });
        const sha = await commitArtifact(workspacePath, artifact.localPath, `save: ${artifact.name}`);
        if (sha) {
          const db = getDb();
          db.update(artifacts).set({ gitSha: sha }).where(eq(artifacts.id, artifact.id)).run();
          artifact.gitSha = sha;
        }
        const win = BrowserWindow.getAllWindows()[0];
        if (win) win.webContents.send('artifact:saved', artifact);
        return { ok: true, result: artifact };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
      }
    },
  );

  ipcMain.handle('artifact:search', async (_event, params: { query: string }) => {
    const sqlite = getSqlite();
    if (!sqlite) return { ok: false, error: 'db not ready' };
    try {
      const results = searchArtifacts(sqlite, params.query);
      return { ok: true, result: results };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
    }
  });
}

const TEXT_EXTS = new Set([
  '.md',
  '.txt',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.html',
  '.css',
  '.sql',
  '.yaml',
  '.yml',
  '.xml',
  '.csv',
  '.sh',
  '.py',
  '.rb',
  '.go',
  '.rs',
  '.java',
  '.toml',
  '.env',
]);

function isTextFile(localPath: string): boolean {
  const dot = localPath.lastIndexOf('.');
  if (dot === -1) return true;
  return TEXT_EXTS.has(localPath.slice(dot).toLowerCase());
}
