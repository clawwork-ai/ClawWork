import { basename, extname } from 'path';
import { randomUUID } from 'crypto';

function sanitizeFileName(name: string): string {
  if (!name || name === '.' || name === '..') throw new Error('invalid file name');
  if (name.includes('/') || name.includes('\\')) throw new Error('invalid file name');
  if (name.includes('..')) throw new Error('invalid file name');
  return basename(name);
}

export function uniqueFileName(name: string): string {
  const safe = sanitizeFileName(name);
  const ext = extname(safe);
  const base = safe.slice(0, safe.length - ext.length);
  return `${base}-${randomUUID().slice(0, 8)}${ext}`;
}
