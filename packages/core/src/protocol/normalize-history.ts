import type { ToolCall, Message } from '@clawwork/shared';
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

function extractAssistantText(blocks: RawContentBlock[]): string {
  return blocks
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text!)
    .join('');
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
  return Boolean(turn?.content && turn.timestamp !== timestamp && !canMergeToolFinal);
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
    const text = extractAssistantText(msg.content ?? []);
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

    if (!text.trim() && toolCalls.length === 0) continue;

    const visibleText = isVisibleAssistantContent(text) ? text.trim() : '';

    if (toolCalls.length > 0) {
      const turn = ensureCurrent(timestamp);
      const existingIds = new Set(turn.toolCalls.map((toolCall) => toolCall.id));
      turn.toolCalls.push(...toolCalls.filter((toolCall) => !existingIds.has(toolCall.id)));
      if (visibleText) {
        turn.content = appendSegment(turn.content, visibleText);
      }
      turn.timestamp = timestamp;
      canMergeToolFinal = true;
      continue;
    }

    if (!visibleText) continue;

    if (shouldStartVisibleAssistantTurn(current, timestamp, canMergeToolFinal)) {
      startCurrent(timestamp);
    }

    const turn = ensureCurrent(timestamp);
    turn.content = appendSegment(turn.content, visibleText);
    turn.timestamp = timestamp;
    canMergeToolFinal = false;
  }

  return turns.filter((turn) => turn.content || turn.toolCalls.length > 0);
}

export function collapseDiscoveredMessages(messages: DiscoveredMessageShape[], taskId: string): Message[] {
  const collapsed: Message[] = [];
  let currentAssistant: Message | null = null;

  function flushAssistant(): void {
    if (!currentAssistant) return;
    if (currentAssistant.content || currentAssistant.toolCalls.length > 0) {
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
    if (!visibleText && toolCalls.length === 0) continue;

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
    if (toolCalls.length > 0) {
      const existingIds = new Set(currentAssistant.toolCalls.map((toolCall) => toolCall.id));
      currentAssistant.toolCalls.push(...toolCalls.filter((toolCall) => !existingIds.has(toolCall.id)));
    }
    currentAssistant.timestamp = message.timestamp;
  }

  flushAssistant();
  return collapsed;
}
