import { openSync, readSync, closeSync, fstatSync, realpathSync } from 'fs';
import { extname, sep } from 'path';
import type { FileReadResult } from '@clawwork/shared';
import { classifyTier, getMimeType } from './file-types.js';

const MAX_TEXT_SIZE = 100 * 1024;

export function readContextFile(absolutePath: string, contextFolders: string[]): FileReadResult {
  const fd = openSync(absolutePath, 'r');
  try {
    const realPath = realpathSync(`/dev/fd/${fd}`);
    const allowed = contextFolders.some((folder) => {
      const realFolder = realpathSync(folder);
      return realPath.startsWith(realFolder + sep) || realPath === realFolder;
    });
    if (!allowed) throw new Error('path outside allowed context folders');

    const ext = extname(absolutePath).toLowerCase();
    const tier = classifyTier(ext);
    if (tier === 'unsupported') throw new Error(`unsupported file type: ${ext}`);

    const { size } = fstatSync(fd);

    if (tier === 'text') {
      const buf = Buffer.alloc(Math.min(size, MAX_TEXT_SIZE));
      readSync(fd, buf, 0, buf.length, 0);
      let content = buf.toString('utf-8');
      const truncated = size > MAX_TEXT_SIZE;
      if (truncated) content += '\n[truncated at 100KB]';
      return { content, mimeType: getMimeType(ext), size, truncated, tier };
    }

    const buf = Buffer.alloc(size);
    readSync(fd, buf, 0, size, 0);
    return { content: buf.toString('base64'), mimeType: getMimeType(ext), size, truncated: false, tier };
  } finally {
    closeSync(fd);
  }
}
