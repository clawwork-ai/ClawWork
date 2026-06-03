import { mkdirSync, existsSync } from 'fs';
import { cp } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { sep as winSep } from 'node:path/win32';

export async function initWorkspace(workspacePath: string): Promise<void> {
  if (!existsSync(workspacePath)) {
    mkdirSync(workspacePath, { recursive: true });
  }
}

/** True when the destination is the same as or nested inside the source workspace path. */
export function isNestedOrEqualWorkspacePath(resolvedOld: string, resolvedNew: string): boolean {
  const caseInsensitive = process.platform === 'win32' || process.platform === 'darwin';
  const normOld = caseInsensitive ? resolvedOld.toLowerCase() : resolvedOld;
  const normNew = caseInsensitive ? resolvedNew.toLowerCase() : resolvedNew;
  const pathSep = process.platform === 'win32' ? winSep : sep;
  return normNew === normOld || normNew.startsWith(normOld + pathSep);
}

export async function migrateWorkspace(oldPath: string, newPath: string): Promise<void> {
  if (!existsSync(oldPath)) throw new Error(`Source workspace does not exist: ${oldPath}`);
  const resolvedOld = resolve(oldPath);
  const resolvedNew = resolve(newPath);
  if (isNestedOrEqualWorkspacePath(resolvedOld, resolvedNew)) {
    throw new Error('New workspace path must not be inside or equal to the current workspace');
  }
  await cp(resolvedOld, resolvedNew, {
    recursive: true,
    errorOnExist: false,
    force: true,
  });
}

export function ensureTaskDir(workspacePath: string, taskId: string): string {
  const taskDir = join(workspacePath, taskId);
  const resolved = resolve(taskDir);
  const base = resolve(workspacePath);
  if (!resolved.startsWith(base + sep)) {
    throw new Error('taskId escapes workspace directory');
  }
  if (!existsSync(taskDir)) {
    mkdirSync(taskDir, { recursive: true });
  }
  return taskDir;
}
