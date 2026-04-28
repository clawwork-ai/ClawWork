import type { Message, MessageAttachment, ToolCall } from '@clawwork/shared';
import type { RawContentBlock, RawHistoryMessage, NormalizedAssistantTurn, DiscoveredMessageShape } from './types.js';
import { safeJsonParse } from './parse-content.js';

const GATEWAY_INJECTED_MODEL = 'gateway-injected';

export const INTERNAL_ASSISTANT_MARKERS = new Set(['NO_REPLY']);

export function sanitizeModel(model?: string): string | undefined {
  return model === GATEWAY_INJECTED_MODEL ? undefined : model;
}

export function isVisibleAssistantContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length > 0 && !INTERNAL_ASSISTANT_MARKERS.has(trimmed);
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif)(?:[?#].*)?$/i;
const DATA_IMAGE_RE = /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i;

function cleanMediaCandidate(raw: string): string {
  const trimmed = raw.trim();
  const wrapped = trimmed.match(/^`([^`]+)`$/) ?? trimmed.match(/^"([^"]+)"$/) ?? trimmed.match(/^'([^']+)'$/);
  return (wrapped?.[1] ?? trimmed).replace(/[`"'\\})\],]+$/, '').trim();
}

function hasUnsafePathSegment(value: string): boolean {
  return value.split(/[\\/]+/).some((segment) => segment === '..');
}

function encodeFilePath(path: string): string {
  return `file://${path.split('/').map(encodeURIComponent).join('/')}`;
}

function filePathFromMediaCandidate(candidate: string): string | null {
  if (!candidate.startsWith('file://')) return candidate;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'file:' || (url.hostname && url.hostname !== 'localhost')) return null;
    return decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
}

function fileNameFromSource(source: string, fallback: string): string {
  const withoutQuery = source.split(/[?#]/)[0] ?? source;
  const normalized = withoutQuery.replaceAll('\\', '/');
  const candidate = normalized.split('/').filter(Boolean).at(-1);
  if (!candidate) return fallback;
  try {
    return decodeURIComponent(candidate);
  } catch {
    return candidate;
  }
}

function mimeTypeFromSource(source: string, fallback?: string): string | undefined {
  if (fallback?.startsWith('image/')) return fallback;
  const lower = source.split(/[?#]/)[0]?.toLowerCase() ?? '';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.avif')) return 'image/avif';
  const dataMatch = source.match(/^data:(image\/[^;]+);/i);
  return dataMatch?.[1] ?? fallback;
}

function attachmentFromMediaSource(source: string, alt?: string, mimeType?: string): MessageAttachment | null {
  const candidate = cleanMediaCandidate(source);
  if (!candidate || candidate.length > 4096 || hasUnsafePathSegment(candidate) || candidate.startsWith('~'))
    return null;

  if (DATA_IMAGE_RE.test(candidate)) {
    return {
      fileName: alt?.trim() || 'image.png',
      dataUrl: candidate,
      mimeType: mimeTypeFromSource(candidate, mimeType),
    };
  }

  if (/^https:\/\//i.test(candidate) && IMAGE_EXT_RE.test(candidate)) {
    return {
      fileName: alt?.trim() || fileNameFromSource(candidate, 'image.png'),
      dataUrl: candidate,
      mimeType: mimeTypeFromSource(candidate, mimeType),
    };
  }

  const filePath = filePathFromMediaCandidate(candidate);
  if (!filePath) return null;
  if (filePath.startsWith('/') && IMAGE_EXT_RE.test(filePath)) {
    return {
      fileName: alt?.trim() || fileNameFromSource(filePath, 'image.png'),
      dataUrl: encodeFilePath(filePath),
      mimeType: mimeTypeFromSource(filePath, mimeType),
      sourcePath: filePath,
    };
  }

  return null;
}

function splitTextMediaDirectives(text: string): { text: string; attachments: MessageAttachment[] } {
  const attachments: MessageAttachment[] = [];
  const kept: string[] = [];
  let inFence = false;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trimStart();
    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      kept.push(line);
      continue;
    }

    if (!inFence && trimmed.toUpperCase().startsWith('MEDIA:')) {
      const media = attachmentFromMediaSource(trimmed.slice('MEDIA:'.length));
      if (media) {
        attachments.push(media);
        continue;
      }
    }

    kept.push(line);
  }

  if (attachments.length > 0) {
    while (kept[0]?.trim() === '') kept.shift();
    while (kept.at(-1)?.trim() === '') kept.pop();
  }

  return { text: kept.join('\n'), attachments };
}

export function mergeMessageAttachments(
  base: MessageAttachment[] | undefined,
  incoming: MessageAttachment[] | undefined,
): MessageAttachment[] | undefined {
  const merged = [...(base ?? [])];
  const seen = new Set(merged.map((attachment) => attachment.dataUrl));
  for (const attachment of incoming ?? []) {
    if (seen.has(attachment.dataUrl)) continue;
    seen.add(attachment.dataUrl);
    merged.push(attachment);
  }
  return merged.length ? merged : undefined;
}

export function normalizeContentBlocks(blocks: RawContentBlock[]): {
  content: string;
  attachments?: MessageAttachment[];
} {
  let content = '';
  let attachments: MessageAttachment[] | undefined;

  for (const block of blocks) {
    if (block.type === 'text' && block.text) {
      const parsed = splitTextMediaDirectives(block.text);
      content += parsed.text;
      attachments = mergeMessageAttachments(attachments, parsed.attachments);
      continue;
    }

    if (block.type === 'image') {
      const source = block.url ?? block.openUrl;
      const attachment = source ? attachmentFromMediaSource(source, block.alt, block.mimeType) : null;
      attachments = mergeMessageAttachments(attachments, attachment ? [attachment] : undefined);
    }
  }

  return { content, attachments };
}

function toISOTimestamp(epoch: number | undefined): string {
  return epoch ? new Date(epoch).toISOString() : new Date().toISOString();
}

function appendSegment(base: string, segment: string): string {
  const trimmed = segment.trim();
  if (!trimmed) return base;
  if (!base) return trimmed;
  return `${base}\n\n${trimmed}`;
}

function normalizeSignatureValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeSignatureValue);
  if (typeof value !== 'object' || value === null) return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, normalizeSignatureValue(entry)]),
  );
}

function rawHistoryMessageKey(msg: RawHistoryMessage): string {
  return JSON.stringify({
    role: msg.role,
    timestamp: msg.timestamp ?? null,
    content: normalizeSignatureValue(msg.content ?? []),
  });
}

function deduplicateRawHistoryMessages(rawMsgs: RawHistoryMessage[]): RawHistoryMessage[] {
  const seen = new Set<string>();
  const deduped: RawHistoryMessage[] = [];

  for (const msg of rawMsgs) {
    const key = rawHistoryMessageKey(msg);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(msg);
  }

  return deduped;
}

function shouldStartVisibleAssistantTurn(
  turn: NormalizedAssistantTurn | null,
  timestamp: string,
  canMergeToolFinal: boolean,
): boolean {
  return Boolean((turn?.content || turn?.attachments?.length) && turn.timestamp !== timestamp && !canMergeToolFinal);
}

export function normalizeAssistantTurns(rawMsgs: RawHistoryMessage[]): NormalizedAssistantTurn[] {
  const messages = deduplicateRawHistoryMessages(rawMsgs);
  const toolResultMap = new Map<string, string>();
  for (const msg of messages) {
    if (msg.role !== 'toolResult') continue;
    for (const block of msg.content ?? []) {
      if (block.type === 'toolResult' && block.id && block.result !== undefined) {
        toolResultMap.set(block.id, typeof block.result === 'string' ? block.result : JSON.stringify(block.result));
      }
    }
  }

  const turns: NormalizedAssistantTurn[] = [];
  let current: NormalizedAssistantTurn | null = null;
  let canMergeToolFinal = false;

  function startCurrent(timestamp: string): NormalizedAssistantTurn {
    current = { content: '', toolCalls: [], timestamp };
    turns.push(current);
    return current;
  }

  function ensureCurrent(timestamp: string): NormalizedAssistantTurn {
    if (!current) return startCurrent(timestamp);
    return current;
  }

  for (const msg of messages) {
    if (msg.role === 'user') {
      current = null;
      canMergeToolFinal = false;
      continue;
    }
    if (msg.role !== 'assistant') continue;

    const timestamp = toISOTimestamp(msg.timestamp);
    const normalizedContent = normalizeContentBlocks(msg.content ?? []);
    const text = normalizedContent.content;
    const toolCalls = (msg.content ?? [])
      .filter((block: RawContentBlock) => block.type === 'toolCall' && block.id && block.name)
      .map(
        (block: RawContentBlock): ToolCall => ({
          id: block.id!,
          name: block.name!,
          status: toolResultMap.has(block.id!) ? 'done' : 'running',
          args:
            typeof block.arguments === 'object' && block.arguments !== null
              ? (block.arguments as Record<string, unknown>)
              : typeof block.arguments === 'string'
                ? safeJsonParse(block.arguments)
                : undefined,
          result: toolResultMap.get(block.id!),
          startedAt: timestamp,
          completedAt: toolResultMap.has(block.id!) ? timestamp : undefined,
        }),
      );

    if (!text.trim() && toolCalls.length === 0 && !normalizedContent.attachments?.length) continue;

    const visibleText = isVisibleAssistantContent(text) ? text.trim() : '';

    if (toolCalls.length > 0) {
      const turn = ensureCurrent(timestamp);
      const existingIds = new Set(turn.toolCalls.map((toolCall) => toolCall.id));
      turn.toolCalls.push(...toolCalls.filter((toolCall) => !existingIds.has(toolCall.id)));
      if (visibleText) {
        turn.content = appendSegment(turn.content, visibleText);
      }
      turn.attachments = mergeMessageAttachments(turn.attachments, normalizedContent.attachments);
      turn.timestamp = timestamp;
      canMergeToolFinal = true;
      continue;
    }

    if (!visibleText && normalizedContent.attachments?.length) {
      const turn = ensureCurrent(timestamp);
      turn.attachments = mergeMessageAttachments(turn.attachments, normalizedContent.attachments);
      turn.timestamp = timestamp;
      canMergeToolFinal = false;
      continue;
    }

    if (!visibleText) continue;

    if (shouldStartVisibleAssistantTurn(current, timestamp, canMergeToolFinal)) {
      startCurrent(timestamp);
    }

    const turn = ensureCurrent(timestamp);
    turn.content = appendSegment(turn.content, visibleText);
    turn.attachments = mergeMessageAttachments(turn.attachments, normalizedContent.attachments);
    turn.timestamp = timestamp;
    canMergeToolFinal = false;
  }

  return turns.filter((turn) => turn.content || turn.toolCalls.length > 0 || (turn.attachments?.length ?? 0) > 0);
}

export function collapseDiscoveredMessages(messages: DiscoveredMessageShape[], taskId: string): Message[] {
  const collapsed: Message[] = [];
  let currentAssistant: Message | null = null;

  function flushAssistant(): void {
    if (!currentAssistant) return;
    if (
      currentAssistant.content ||
      currentAssistant.toolCalls.length > 0 ||
      (currentAssistant.attachments?.length ?? 0) > 0
    ) {
      collapsed.push(currentAssistant);
    }
    currentAssistant = null;
  }

  for (const message of messages) {
    if (message.role === 'user') {
      flushAssistant();
      collapsed.push({
        id: crypto.randomUUID(),
        taskId,
        role: 'user',
        content: message.content,
        artifacts: [],
        toolCalls: [],
        timestamp: message.timestamp,
      });
      continue;
    }

    if (message.role !== 'assistant') continue;

    const visibleText = isVisibleAssistantContent(message.content) ? message.content.trim() : '';
    const toolCalls = message.toolCalls ?? [];
    if (!visibleText && toolCalls.length === 0 && !message.attachments?.length) continue;

    if (!currentAssistant) {
      currentAssistant = {
        id: crypto.randomUUID(),
        taskId,
        role: 'assistant',
        content: '',
        artifacts: [],
        toolCalls: [],
        timestamp: message.timestamp,
      };
    }

    if (visibleText) {
      currentAssistant.content = appendSegment(currentAssistant.content, visibleText);
    }
    currentAssistant.attachments = mergeMessageAttachments(currentAssistant.attachments, message.attachments);
    if (toolCalls.length > 0) {
      const existingIds = new Set(currentAssistant.toolCalls.map((toolCall) => toolCall.id));
      currentAssistant.toolCalls.push(...toolCalls.filter((toolCall) => !existingIds.has(toolCall.id)));
    }
    currentAssistant.timestamp = message.timestamp;
  }

  flushAssistant();
  return collapsed;
}
