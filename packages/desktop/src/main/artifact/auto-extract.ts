import { BrowserWindow } from 'electron';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, sep } from 'path';
import { extractImagesFromMarkdown, extractCodeBlocksFromMarkdown } from './extract.js';
import { saveArtifactFromBuffer } from './save.js';
import { getDb } from '../db/index.js';
import { artifacts } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { safeFetch } from '../net/safe-fetch.js';
import { readOpenClawMediaFile } from '../media/resolve.js';
import type { Artifact, MessageAttachment } from '@clawwork/shared';

interface AutoExtractParams {
  workspacePath: string;
  taskId: string;
  messageId: string;
  content: string;
  attachments?: MessageAttachment[];
}

const DATA_IMAGE_RE = /^data:(image\/(?:png|jpe?g|gif|webp|avif));base64,(.+)$/i;
const extractionByMessage = new Map<string, Promise<void>>();

type ExistingArtifact = Pick<Artifact, 'name' | 'type' | 'size' | 'contentText' | 'sourceKey'>;

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function sourceKey(kind: string, value: string): string {
  return `${kind}:${hashText(value)}`;
}

function canonicalSavedName(name: string): string {
  return name.replace(/-[0-9a-f]{8}(\.[^.]+)$/i, '$1');
}

function isUniqueArtifactError(err: unknown): boolean {
  return (
    err instanceof Error && err.message.includes('UNIQUE constraint failed: artifacts.message_id, artifacts.source_key')
  );
}

function extFromMime(mimeType: string | undefined): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/avif') return 'avif';
  return 'png';
}

function safeImageFileName(fileName: string | undefined, mimeType: string | undefined): string {
  const ext = extFromMime(mimeType);
  const raw = fileName?.trim() || `image.${ext}`;
  const clean = raw.replace(/[/\\]/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(clean)) return clean;
  return `${clean || 'image'}.${ext}`;
}

async function readAttachmentImage(attachment: MessageAttachment): Promise<Buffer | null> {
  if (attachment.sourcePath) {
    const base64 = await readOpenClawMediaFile(attachment.sourcePath);
    return base64 ? Buffer.from(base64, 'base64') : null;
  }

  const dataMatch = attachment.dataUrl.match(DATA_IMAGE_RE);
  if (dataMatch) return Buffer.from(dataMatch[2], 'base64');

  if (/^https:\/\//i.test(attachment.dataUrl)) {
    return safeFetch(attachment.dataUrl);
  }

  return null;
}

async function doAutoExtractArtifacts(params: AutoExtractParams): Promise<void> {
  const { workspacePath, taskId, messageId, content, attachments = [] } = params;

  const db = getDb();
  const existingForMsg = db.select().from(artifacts).where(eq(artifacts.messageId, messageId)).all();
  const existing = existingForMsg as ExistingArtifact[];
  const existingSourceKeys = new Set(existing.map((artifact) => artifact.sourceKey).filter(Boolean));

  const images = extractImagesFromMarkdown(content);
  const codeBlocks = extractCodeBlocksFromMarkdown(content);

  const saved: Artifact[] = [];

  async function saveExtracted(input: {
    fileName: string;
    buffer: Buffer;
    artifactType: 'image' | 'code';
    sourceKey: string;
    contentText?: string;
  }): Promise<void> {
    if (existingSourceKeys.has(input.sourceKey)) return;

    const canonicalName = canonicalSavedName(input.fileName);
    const legacyDuplicate = existing.some((artifact) => {
      if (artifact.sourceKey || artifact.type !== input.artifactType) return false;
      if (canonicalSavedName(artifact.name) !== canonicalName || artifact.size !== input.buffer.length) return false;
      if (input.artifactType === 'code') return artifact.contentText === input.contentText;
      return true;
    });
    if (legacyDuplicate) {
      existingSourceKeys.add(input.sourceKey);
      return;
    }

    try {
      const artifact = await saveArtifactFromBuffer({
        workspacePath,
        taskId,
        messageId,
        fileName: input.fileName,
        buffer: input.buffer,
        artifactType: input.artifactType,
        contentText: input.contentText,
        sourceKey: input.sourceKey,
      });
      existingSourceKeys.add(input.sourceKey);
      existing.push(artifact);
      saved.push(artifact);
    } catch (err) {
      if (isUniqueArtifactError(err)) {
        existingSourceKeys.add(input.sourceKey);
        return;
      }
      throw err;
    }
  }

  for (const img of images) {
    try {
      const key = sourceKey('markdown-image', img.src);
      if (existingSourceKeys.has(key)) continue;
      let buffer: Buffer;
      if (img.isRemote) {
        buffer = await safeFetch(img.src);
      } else if (img.src.startsWith('clawwork-media://')) {
        const filePath = resolve(img.src.replace('clawwork-media://', ''));
        if (!filePath.startsWith(resolve(workspacePath) + sep)) continue;
        buffer = readFileSync(filePath);
      } else {
        continue;
      }
      const ext = img.src.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'png';
      const fileName = img.alt ? `${img.alt.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}` : `image.${ext}`;
      await saveExtracted({
        fileName,
        buffer,
        artifactType: 'image',
        sourceKey: key,
      });
    } catch (err) {
      console.error('[auto-extract] image save failed:', err);
    }
  }

  for (const attachment of attachments) {
    try {
      if (!attachment.dataUrl && !attachment.sourcePath) continue;
      if (attachment.mimeType && !attachment.mimeType.startsWith('image/')) continue;
      const key = sourceKey('attachment', attachment.sourcePath ?? attachment.dataUrl);
      if (existingSourceKeys.has(key)) continue;
      const buffer = await readAttachmentImage(attachment);
      if (!buffer) continue;
      const fileName = safeImageFileName(attachment.fileName, attachment.mimeType);
      await saveExtracted({
        fileName,
        buffer,
        artifactType: 'image',
        sourceKey: key,
      });
    } catch (err) {
      console.error('[auto-extract] attachment image save failed:', err);
    }
  }

  for (const block of codeBlocks) {
    try {
      const key = sourceKey('code', `${block.fileName}\0${block.content}`);
      if (existingSourceKeys.has(key)) continue;
      await saveExtracted({
        fileName: block.fileName,
        buffer: Buffer.from(block.content, 'utf-8'),
        artifactType: 'code',
        contentText: block.content,
        sourceKey: key,
      });
    } catch (err) {
      console.error('[auto-extract] code block save failed:', err);
    }
  }

  if (saved.length === 0) return;

  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    for (const artifact of saved) {
      win.webContents.send('artifact:saved', artifact);
    }
  }
}

export async function autoExtractArtifacts(params: AutoExtractParams): Promise<void> {
  const key = `${params.taskId}:${params.messageId}`;
  const active = extractionByMessage.get(key);
  if (active) {
    await active;
    return;
  }

  const job = doAutoExtractArtifacts(params).finally(() => {
    if (extractionByMessage.get(key) === job) extractionByMessage.delete(key);
  });
  extractionByMessage.set(key, job);
  await job;
}
