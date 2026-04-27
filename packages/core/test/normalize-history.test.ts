import { describe, it, expect } from 'vitest';
import { normalizeAssistantTurns } from '../src/protocol/normalize-history';
import type { RawHistoryMessage } from '../src/protocol/types';

describe('normalizeAssistantTurns', () => {
  it('deduplicates repeated raw history messages within one payload', () => {
    const rawMsgs: RawHistoryMessage[] = [
      { role: 'user', timestamp: 1000, content: [{ type: 'text', text: '/model_usage' }] },
      {
        role: 'assistant',
        timestamp: 2000,
        content: [{ type: 'toolCall', id: 'tool-1', name: 'model_usage', arguments: { scope: 'session' } }],
      },
      { role: 'toolResult', timestamp: 2500, content: [{ type: 'toolResult', id: 'tool-1', result: 'usage data' }] },
      { role: 'assistant', timestamp: 3000, content: [{ type: 'text', text: 'Usage: 10 tokens' }] },
      { role: 'user', timestamp: 1000, content: [{ type: 'text', text: '/model_usage' }] },
      {
        role: 'assistant',
        timestamp: 2000,
        content: [{ type: 'toolCall', id: 'tool-1', name: 'model_usage', arguments: { scope: 'session' } }],
      },
      { role: 'toolResult', timestamp: 2500, content: [{ type: 'toolResult', id: 'tool-1', result: 'usage data' }] },
      { role: 'assistant', timestamp: 3000, content: [{ type: 'text', text: 'Usage: 10 tokens' }] },
    ];

    const turns = normalizeAssistantTurns(rawMsgs);

    expect(turns).toHaveLength(1);
    expect(turns[0].content).toBe('Usage: 10 tokens');
    expect(turns[0].toolCalls).toHaveLength(1);
    expect(turns[0].toolCalls[0]).toMatchObject({ id: 'tool-1', name: 'model_usage', status: 'done' });
  });

  it('keeps consecutive visible assistant finals as separate turns', () => {
    const rawMsgs: RawHistoryMessage[] = [
      { role: 'assistant', timestamp: 2000, content: [{ type: 'text', text: 'Usage: 10 tokens' }] },
      { role: 'assistant', timestamp: 3000, content: [{ type: 'text', text: 'Providers: openai' }] },
    ];

    const turns = normalizeAssistantTurns(rawMsgs);

    expect(turns).toHaveLength(2);
    expect(turns[0]).toMatchObject({ content: 'Usage: 10 tokens', timestamp: '1970-01-01T00:00:02.000Z' });
    expect(turns[1]).toMatchObject({ content: 'Providers: openai', timestamp: '1970-01-01T00:00:03.000Z' });
  });

  it('merges an assistant tool call with its visible final text', () => {
    const rawMsgs: RawHistoryMessage[] = [
      {
        role: 'assistant',
        timestamp: 2000,
        content: [{ type: 'toolCall', id: 'tool-1', name: 'read_file', arguments: '{"path":"README.md"}' }],
      },
      { role: 'toolResult', timestamp: 2500, content: [{ type: 'toolResult', id: 'tool-1', result: 'file contents' }] },
      { role: 'assistant', timestamp: 3000, content: [{ type: 'text', text: 'Read README.md' }] },
    ];

    const turns = normalizeAssistantTurns(rawMsgs);

    expect(turns).toHaveLength(1);
    expect(turns[0].content).toBe('Read README.md');
    expect(turns[0].timestamp).toBe('1970-01-01T00:00:03.000Z');
    expect(turns[0].toolCalls).toHaveLength(1);
    expect(turns[0].toolCalls[0]).toMatchObject({
      id: 'tool-1',
      name: 'read_file',
      status: 'done',
      args: { path: 'README.md' },
      result: 'file contents',
    });
  });
});
