import type { ToolCall } from '@clawwork/shared';
import type { ChatEventPayload, ChatContentBlock } from './types.js';

export function extractText(payload: ChatEventPayload): string {
  const blocks = payload.message?.content ?? payload.content;
  if (blocks) {
    return blocks
      .filter((b: ChatContentBlock) => b.type === 'text' && b.text)
      .map((b: ChatContentBlock) => b.text!)
      .join('');
  }
  return payload.text ?? '';
}

export function extractThinking(payload: ChatEventPayload): string {
  const blocks = payload.message?.content ?? payload.content;
  if (!blocks) return '';
  return blocks
    .filter((b: ChatContentBlock) => b.type === 'thinking' && b.thinking)
    .map((b: ChatContentBlock) => b.thinking!)
    .join('');
}

export function extractToolCalls(payload: ChatEventPayload): ToolCall[] {
  const blocks = payload.message?.content ?? payload.content;
  if (!blocks) return [];
  const result: ToolCall[] = [];
  for (const b of blocks) {
    if (b.type === 'toolCall' && b.id && b.name) {
      result.push({
        id: b.id,
        name: b.name,
        status: 'running',
        args:
          typeof b.arguments === 'object'
            ? (b.arguments as Record<string, unknown>)
            : parseToolArgs(typeof b.arguments === 'string' ? b.arguments : undefined),
        startedAt: new Date().toISOString(),
      });
    }
  }
  return result;
}

export function parseToolArgs(raw: string | undefined): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { raw };
  }
}

export function safeJsonParse(raw: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
