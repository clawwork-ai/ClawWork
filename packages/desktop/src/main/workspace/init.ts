import { mkdirSync, existsSync } from 'fs';
import { cp } from 'fs/promises';
import { join, resolve, sep } from 'path';

export async function initWorkspace(workspacePath: string): Promise<void> {
  if (!existsSync(workspacePath)) {
    mkdirSync(workspacePath, { recursive: true });
  }
}

export async function migrateWorkspace(oldPath: string, newPath: string): Promise<void> {
  if (!existsSync(oldPath)) throw new Error(`Source workspace does not exist: ${oldPath}`);
  const resolvedOld = resolve(oldPath);
  const resolvedNew = resolve(newPath);
  if (resolvedNew.startsWith(resolvedOld + '/') || resolvedNew === resolvedOld) {
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
