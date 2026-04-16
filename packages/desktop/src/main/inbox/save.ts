import { mkdir, writeFile } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { ensureTaskDir } from '../workspace/init.js';
import { uniqueFileName } from '../workspace/safe-name.js';

interface SaveInboxParams {
  workspacePath: string;
  taskId: string;
  fileName: string;
  buffer: Buffer;
}

interface SaveInboxResult {
  localPath: string;
}

export async function saveInboxAttachment(params: SaveInboxParams): Promise<SaveInboxResult> {
  const { workspacePath, taskId, fileName, buffer } = params;
  const taskDir = ensureTaskDir(workspacePath, taskId);
  const inboxDir = join(taskDir, 'inbox');
  await mkdir(inboxDir, { recursive: true });

  const finalName = uniqueFileName(fileName);
  const destPath = resolve(inboxDir, finalName);
  const resolvedInbox = resolve(inboxDir);
  if (!destPath.startsWith(`${resolvedInbox}${sep}`)) {
    throw new Error('attachment path escapes inbox dir');
  }

  await writeFile(destPath, buffer);
  return {
    localPath: [taskId, 'inbox', finalName].join('/'),
  };
}
