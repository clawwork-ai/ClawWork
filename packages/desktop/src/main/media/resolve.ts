import type { Stats } from 'fs';
import { realpathSync } from 'fs';
import { open, realpath, stat } from 'fs/promises';
import { homedir } from 'os';
import { isAbsolute, join, resolve, sep } from 'path';

const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif)$/i;

function isWithin(parent: string, child: string): boolean {
  return child === parent || child.startsWith(`${parent}${sep}`);
}

function mediaRoots(): string[] {
  const stateDir = process.env.OPENCLAW_STATE_DIR
    ? resolve(process.env.OPENCLAW_STATE_DIR)
    : join(homedir(), '.openclaw');
  return [resolve(stateDir, 'media')];
}

function isSameFile(left: Stats, right: Stats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function isLexicallyAllowedMediaPath(sourcePath: string): boolean {
  if (!sourcePath || sourcePath.includes('\0') || !isAbsolute(sourcePath)) return false;
  const requested = resolve(sourcePath);
  if (!IMAGE_EXT_RE.test(requested)) return false;
  return mediaRoots().some((root) => isWithin(root, requested));
}

async function resolveAllowedMediaPath(sourcePath: string, fd: number, openedStat: Stats): Promise<string | null> {
  const requested = resolve(sourcePath);
  const roots = await Promise.all(
    mediaRoots().map((root) =>
      realpath(root).catch(() => {
        return null;
      }),
    ),
  );
  const fdTarget =
    process.platform === 'win32'
      ? null
      : (() => {
          try {
            const target = realpathSync(`/dev/fd/${fd}`);
            return target.startsWith('/dev/fd/') ? null : target;
          } catch {
            return null;
          }
        })();
  const realTarget = fdTarget ?? (await realpath(requested).catch(() => null));
  if (!realTarget) return null;
  if (!roots.some((root) => root !== null && isWithin(root, realTarget))) return null;
  const targetStat = await stat(realTarget).catch(() => null);
  if (!targetStat || !isSameFile(openedStat, targetStat)) return null;
  return realTarget;
}

export async function readOpenClawMediaFile(sourcePath: string): Promise<string | null> {
  if (!isLexicallyAllowedMediaPath(sourcePath)) return null;
  const handle = await open(sourcePath, 'r').catch(() => null);
  if (!handle) return null;
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > MAX_MEDIA_BYTES) return null;
    const realTarget = await resolveAllowedMediaPath(sourcePath, handle.fd, stat);
    if (!realTarget) return null;
    return await handle.readFile({ encoding: 'base64' });
  } finally {
    await handle.close();
  }
}
