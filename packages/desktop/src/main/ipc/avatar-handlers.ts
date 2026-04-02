import { app, ipcMain, net, protocol } from 'electron';
import { join, extname } from 'path';
import { mkdir, writeFile, readdir, unlink } from 'fs/promises';
import { pathToFileURL } from 'url';
import { getDebugLogger } from '../debug/index.js';

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

const VALID_EXT = new Set(Object.values(MIME_TO_EXT));

const ID_PATTERN = /^[\w][\w.:-]*$/;

function avatarsDir(): string {
  return join(app.getPath('userData'), 'avatars');
}

function gatewayDir(gatewayId: string): string {
  return join(avatarsDir(), gatewayId);
}

function validateId(value: string): boolean {
  return ID_PATTERN.test(value) && !value.includes('..');
}

async function findAvatarFile(gatewayId: string, agentId: string): Promise<string | null> {
  const dir = gatewayDir(gatewayId);
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return null;
  }
  const prefix = `${agentId}.`;
  const match = entries.find((f) => f.startsWith(prefix) && VALID_EXT.has(extname(f)));
  return match ? join(dir, match) : null;
}

async function removeExisting(gatewayId: string, agentId: string): Promise<void> {
  const existing = await findAvatarFile(gatewayId, agentId);
  if (existing) await unlink(existing);
}

export function registerAvatarProtocol(): void {
  protocol.handle('clawwork-avatar', async (request) => {
    try {
      const url = new URL(request.url);
      const gatewayId = decodeURIComponent(url.hostname);
      const agentId = decodeURIComponent(url.pathname.slice(1));
      if (!validateId(gatewayId) || !validateId(agentId)) {
        return new Response('invalid id', { status: 400 });
      }
      const filePath = await findAvatarFile(gatewayId, agentId);
      if (!filePath) return new Response('not found', { status: 404 });
      return net.fetch(pathToFileURL(filePath).toString());
    } catch {
      return new Response('error', { status: 500 });
    }
  });
}

export function registerAvatarHandlers(): void {
  ipcMain.handle('avatar:save', async (_event, payload: { gatewayId: string; agentId: string; dataUrl: string }) => {
    const { gatewayId, agentId, dataUrl } = payload;
    if (!validateId(gatewayId) || !validateId(agentId)) {
      return { ok: false, error: 'invalid id' };
    }
    const mimeMatch = dataUrl.match(/^data:(image\/[\w+.-]+);base64,/);
    if (!mimeMatch) return { ok: false, error: 'invalid data URL' };
    const mime = mimeMatch[1];
    const ext = MIME_TO_EXT[mime];
    if (!ext) return { ok: false, error: `unsupported MIME type: ${mime}` };
    const base64 = dataUrl.slice(mimeMatch[0].length);
    const buffer = Buffer.from(base64, 'base64');
    const dir = gatewayDir(gatewayId);
    await mkdir(dir, { recursive: true });
    await removeExisting(gatewayId, agentId);
    const filePath = join(dir, `${agentId}${ext}`);
    await writeFile(filePath, buffer);
    getDebugLogger().info({
      domain: 'avatar',
      event: 'avatar.saved',
      data: { gatewayId, agentId, size: buffer.length },
    });
    return { ok: true };
  });

  ipcMain.handle('avatar:delete', async (_event, payload: { gatewayId: string; agentId: string }) => {
    const { gatewayId, agentId } = payload;
    if (!validateId(gatewayId) || !validateId(agentId)) {
      return { ok: false, error: 'invalid id' };
    }
    try {
      await removeExisting(gatewayId, agentId);
      return { ok: true };
    } catch {
      return { ok: true };
    }
  });

  ipcMain.handle('avatar:list-local', async (_event, payload: { gatewayId: string }) => {
    const { gatewayId } = payload;
    if (!validateId(gatewayId)) return { ok: true, result: [] };
    const dir = gatewayDir(gatewayId);
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return { ok: true, result: [] };
    }
    const agentIds = entries
      .filter((f) => VALID_EXT.has(extname(f)))
      .map((f) => f.slice(0, f.length - extname(f).length));
    return { ok: true, result: agentIds };
  });
}
