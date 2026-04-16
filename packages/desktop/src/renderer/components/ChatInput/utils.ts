import { toast } from 'sonner';
import type { PendingAttachment } from './types';
import { MAX_ATTACHMENT_SIZE, GATEWAY_INJECTED_MODEL } from './constants';

type TranslateFn = (key: string, opts?: Record<string, unknown>) => string;

export function getModelLabel(model: string | undefined, fallback?: string): string {
  if (!model || model === GATEWAY_INJECTED_MODEL) return fallback ?? 'Default';
  return model.split('/').pop() ?? model;
}

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

export function processAttachmentFiles(files: File[], t: TranslateFn): PendingAttachment[] {
  const accepted: PendingAttachment[] = [];
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error(t('chatInput.attachmentTooLarge', { fileName: file.name }));
      continue;
    }
    accepted.push({ file, previewUrl: URL.createObjectURL(file) });
  }
  return accepted;
}

export function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}
