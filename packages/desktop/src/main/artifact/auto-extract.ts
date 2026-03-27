import { BrowserWindow } from 'electron';
import { readFileSync } from 'fs';
import { resolve, sep } from 'path';
import { extractImagesFromMarkdown, extractCodeBlocksFromMarkdown } from './extract.js';
import { saveArtifactFromBuffer } from './save.js';
import { getDb } from '../db/index.js';
import { artifacts } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { safeFetch } from '../net/safe-fetch.js';
import type { Artifact } from '@clawwork/shared';

interface AutoExtractParams {
  workspacePath: string;
  taskId: string;
  messageId: string;
  content: string;
}

export async function autoExtractArtifacts(params: AutoExtractParams): Promise<void> {
  const { workspacePath, taskId, messageId, content } = params;

  const db = getDb();
  const existingForMsg = db.select().from(artifacts).where(eq(artifacts.messageId, messageId)).all();
  if (existingForMsg.length > 0) return;

  const images = extractImagesFromMarkdown(content);
  const codeBlocks = extractCodeBlocksFromMarkdown(content);

  const saved: Artifact[] = [];

  for (const img of images) {
    try {
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
      saved.push(
        await saveArtifactFromBuffer({ workspacePath, taskId, messageId, fileName, buffer, artifactType: 'image' }),
      );
    } catch (err) {
      console.error('[auto-extract] image save failed:', err);
    }
  }

  for (const block of codeBlocks) {
    try {
      saved.push(
        await saveArtifactFromBuffer({
          workspacePath,
          taskId,
          messageId,
          fileName: block.fileName,
          buffer: Buffer.from(block.content, 'utf-8'),
          artifactType: 'code',
          contentText: block.content,
        }),
      );
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
