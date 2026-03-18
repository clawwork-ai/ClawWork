import simpleGit from 'simple-git';
import { basename } from 'path';

export async function commitArtifact(workspacePath: string, localPath: string, message?: string): Promise<string> {
  const git = simpleGit(workspacePath);

  await git.add(localPath);

  const status = await git.status();
  if (status.staged.length === 0) {
    return '';
  }

  const fileName = basename(localPath);
  const commitMessage = message ?? `artifact: ${fileName}`;
  const result = await git.commit(commitMessage);

  return result.commit || '';
}

export async function commitArtifactBatch(workspacePath: string, localPaths: string[]): Promise<string> {
  const git = simpleGit(workspacePath);
  for (const p of localPaths) {
    await git.add(p);
  }
  const status = await git.status();
  if (status.staged.length === 0) return '';
  const result = await git.commit(`auto: extract ${localPaths.length} files from message`);
  return result.commit || '';
}
