import { readdirSync, lstatSync } from 'fs';
import { join, extname, relative } from 'path';
import type { FileIndexEntry } from '@clawwork/shared';
import { classifyTier, getMimeType } from './file-types.js';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '__pycache__',
  '.next',
  '.venv',
  'venv',
  '.cache',
  'coverage',
  '.idea',
  '.vscode',
  '.turbo',
  '.output',
  '.nuxt',
  '.svelte-kit',
]);

const ALLOWED_DOT_FILES = new Set(['.env', '.gitignore', '.dockerfile']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isHidden(name: string): boolean {
  return name.startsWith('.') && !ALLOWED_DOT_FILES.has(name.toLowerCase());
}

function walkDir(dir: string, rootDir: string, results: FileIndexEntry[], depth: number, maxDepth: number): void {
  if (depth > maxDepth) return;

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const name of entries) {
    if (isHidden(name) && depth > 0) continue;

    const fullPath = join(dir, name);
    let stat;
    try {
      stat = lstatSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isSymbolicLink()) continue;

    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walkDir(fullPath, rootDir, results, depth + 1, maxDepth);
      continue;
    }

    if (!stat.isFile()) continue;
    if (stat.size > MAX_FILE_SIZE) continue;

    const ext = extname(name).toLowerCase();
    const tier = classifyTier(ext);
    if (tier === 'unsupported') continue;

    results.push({
      relativePath: relative(rootDir, fullPath),
      absolutePath: fullPath,
      fileName: name,
      size: stat.size,
      mtime: stat.mtimeMs,
      mimeType: getMimeType(ext),
      tier,
    });
  }
}

export function scanFolder(folderPath: string, opts?: { maxDepth?: number; query?: string }): FileIndexEntry[] {
  const maxDepth = opts?.maxDepth ?? 4;
  const results: FileIndexEntry[] = [];
  walkDir(folderPath, folderPath, results, 0, maxDepth);

  if (opts?.query) {
    const q = opts.query.toLowerCase();
    const scored = results
      .map((f) => ({ entry: f, score: fuzzyScore(f.fileName.toLowerCase(), f.relativePath.toLowerCase(), q) }))
      .filter((s) => s.score > 0);
    scored.sort((a, b) => b.score - a.score || b.entry.mtime - a.entry.mtime);
    return scored.map((s) => s.entry);
  }

  results.sort((a, b) => b.mtime - a.mtime);
  return results;
}

function fuzzyScore(fileName: string, relPath: string, query: string): number {
  if (fileName === query) return 100;
  if (fileName.startsWith(query)) return 80;
  if (fileName.includes(query)) return 60;
  if (relPath.includes(query)) return 40;

  let qi = 0;
  for (let i = 0; i < fileName.length && qi < query.length; i++) {
    if (fileName[i] === query[qi]) qi++;
  }
  if (qi === query.length) return 20;

  return 0;
}
