import { openSync, readSync, closeSync, readFileSync, realpathSync, statSync } from 'fs';
import { extname, sep } from 'path';
import type { FileReadResult } from '@clawwork/shared';
import { classifyTier, getMimeType } from './file-types.js';

const MAX_TEXT_SIZE = 100 * 1024;

export function validatePathSecurity(absolutePath: string, contextFolders: string[]): boolean {
  const realPath = realpathSync(absolutePath);
  return contextFolders.some((folder) => {
    const realFolder = realpathSync(folder);
    return realPath.startsWith(realFolder + sep) || realPath === realFolder;
  });
}

export function readContextFile(absolutePath: string): FileReadResult {
  const ext = extname(absolutePath).toLowerCase();
  const tier = classifyTier(ext);
  if (tier === 'unsupported') {
    throw new Error(`unsupported file type: ${ext}`);
  }
  const stat = statSync(absolutePath);

  if (tier === 'text') {
    const buf = Buffer.alloc(Math.min(stat.size, MAX_TEXT_SIZE));
    const fd = openSync(absolutePath, 'r');
    try {
      readSync(fd, buf, 0, buf.length, 0);
    } finally {
      closeSync(fd);
    }
    let content = buf.toString('utf-8');
    const truncated = stat.size > MAX_TEXT_SIZE;
    if (truncated) {
      content += '\n[truncated at 100KB]';
    }
    return { content, mimeType: getMimeType(ext), size: stat.size, truncated, tier };
  }

  const raw = readFileSync(absolutePath);
  return {
    content: raw.toString('base64'),
    mimeType: getMimeType(ext),
    size: stat.size,
    truncated: false,
    tier,
  };
}
