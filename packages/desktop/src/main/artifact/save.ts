import { copyFileSync, existsSync, statSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import { randomUUID } from 'crypto';
import type { Artifact } from '@clawwork/shared';
import { getDb } from '../db/index.js';
import { artifacts } from '../db/schema.js';
import { ensureTaskDir } from '../workspace/init.js';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
};

function detectMimeType(fileName: string): string {
  const ext = extname(fileName).toLowerCase();
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

function uniqueFileName(dir: string, name: string): string {
  if (!existsSync(join(dir, name))) return name;

  const ext = extname(name);
  const base = name.slice(0, name.length - ext.length);
  let counter = 1;
  let candidate = `${base}-${counter}${ext}`;
  while (existsSync(join(dir, candidate))) {
    counter++;
    candidate = `${base}-${counter}${ext}`;
  }
  return candidate;
}

interface SaveArtifactParams {
  workspacePath: string;
  taskId: string;
  messageId: string;
  sourcePath: string;
  fileName?: string;
  mediaType?: string;
}

export async function saveArtifact(params: SaveArtifactParams): Promise<Artifact> {
  const { workspacePath, taskId, messageId, sourcePath, fileName, mediaType } = params;

  const taskDir = ensureTaskDir(workspacePath, taskId);
  const originalName = fileName ?? basename(sourcePath);
  const finalName = uniqueFileName(taskDir, originalName);
  const destPath = join(taskDir, finalName);

  copyFileSync(sourcePath, destPath);

  const stat = statSync(destPath);
  const localPath = `${taskId}/${finalName}`;
  const mimeType = mediaType ?? detectMimeType(finalName);
  const now = new Date().toISOString();
  const id = randomUUID();

  const artifact: Artifact = {
    id,
    taskId,
    messageId,
    type: 'file',
    name: finalName,
    filePath: sourcePath,
    localPath,
    mimeType,
    size: stat.size,
    gitSha: '',
    createdAt: now,
  };

  const db = getDb();
  db.insert(artifacts)
    .values({
      id: artifact.id,
      taskId: artifact.taskId,
      messageId: artifact.messageId,
      type: artifact.type,
      name: artifact.name,
      filePath: artifact.filePath,
      localPath: artifact.localPath,
      mimeType: artifact.mimeType,
      size: artifact.size,
      gitSha: artifact.gitSha,
      createdAt: artifact.createdAt,
    })
    .run();

  return artifact;
}

interface SaveArtifactFromBufferParams {
  workspacePath: string;
  taskId: string;
  messageId: string;
  fileName: string;
  buffer: Buffer;
  artifactType: 'code' | 'image' | 'file';
  contentText?: string;
}

export async function saveArtifactFromBuffer(params: SaveArtifactFromBufferParams): Promise<Artifact> {
  const { workspacePath, taskId, messageId, fileName, buffer, artifactType, contentText } = params;

  const taskDir = ensureTaskDir(workspacePath, taskId);
  const finalName = uniqueFileName(taskDir, fileName);
  const destPath = join(taskDir, finalName);

  writeFileSync(destPath, buffer);

  const localPath = `${taskId}/${finalName}`;
  const mimeType = detectMimeType(finalName);
  const now = new Date().toISOString();
  const id = randomUUID();

  const artifact: Artifact = {
    id,
    taskId,
    messageId,
    type: artifactType,
    name: finalName,
    filePath: '',
    localPath,
    mimeType,
    size: buffer.length,
    gitSha: '',
    contentText: contentText ?? '',
    createdAt: now,
  };

  const db = getDb();
  db.insert(artifacts)
    .values({
      id: artifact.id,
      taskId: artifact.taskId,
      messageId: artifact.messageId,
      type: artifact.type,
      name: artifact.name,
      filePath: artifact.filePath,
      localPath: artifact.localPath,
      mimeType: artifact.mimeType,
      size: artifact.size,
      gitSha: artifact.gitSha,
      createdAt: artifact.createdAt,
      contentText: contentText ?? '',
    })
    .run();

  return artifact;
}
