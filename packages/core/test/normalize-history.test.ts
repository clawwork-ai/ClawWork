import { describe, it, expect } from 'vitest';
import {
  collapseDiscoveredMessages,
  normalizeAssistantTurns,
  normalizeContentBlocks,
} from '../src/protocol/normalize-history';
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

  it('extracts line-start MEDIA directives as image attachments', () => {
    const rawMsgs: RawHistoryMessage[] = [
      {
        role: 'assistant',
        timestamp: 2000,
        content: [{ type: 'text', text: 'MEDIA:/Users/x/.openclaw/media/out.png\n\nImage ready' }],
      },
    ];

    const turns = normalizeAssistantTurns(rawMsgs);

    expect(turns).toHaveLength(1);
    expect(turns[0].content).toBe('Image ready');
    expect(turns[0].attachments).toEqual([
      {
        fileName: 'out.png',
        dataUrl: 'file:///Users/x/.openclaw/media/out.png',
        mimeType: 'image/png',
        sourcePath: '/Users/x/.openclaw/media/out.png',
      },
    ]);
  });

  it('decodes file URL media paths before reading from sourcePath', () => {
    const normalized = normalizeContentBlocks([
      { type: 'text', text: 'MEDIA:file:///Users/x/.openclaw/media/generated%20image.png' },
    ]);

    expect(normalized.attachments?.[0]).toMatchObject({
      fileName: 'generated image.png',
      dataUrl: 'file:///Users/x/.openclaw/media/generated%20image.png',
      sourcePath: '/Users/x/.openclaw/media/generated image.png',
    });
  });

  it('keeps prose MEDIA mentions as text', () => {
    const normalized = normalizeContentBlocks([{ type: 'text', text: 'Use MEDIA:/tmp/out.png in a tool result' }]);

    expect(normalized).toEqual({ content: 'Use MEDIA:/tmp/out.png in a tool result' });
  });

  it('extracts supported image content blocks', () => {
    const normalized = normalizeContentBlocks([
      { type: 'text', text: 'Image ready' },
      { type: 'image', url: 'https://example.com/result.webp', alt: 'result.webp', mimeType: 'image/webp' },
    ]);

    expect(normalized).toEqual({
      content: 'Image ready',
      attachments: [{ fileName: 'result.webp', dataUrl: 'https://example.com/result.webp', mimeType: 'image/webp' }],
    });
  });

  it('resolves OpenClaw relative image blocks through the gateway HTTP base', () => {
    const normalized = normalizeContentBlocks(
      [
        {
          type: 'image',
          url: '/api/chat/media/outgoing/agent%3Amain%3Amain/11111111-1111-4111-8111-111111111111/full',
          alt: 'generated.png',
          mimeType: 'image/png',
        },
      ],
      'http://127.0.0.1:18789',
    );

    expect(normalized.attachments).toEqual([
      {
        fileName: 'generated.png',
        dataUrl:
          'http://127.0.0.1:18789/api/chat/media/outgoing/agent%3Amain%3Amain/11111111-1111-4111-8111-111111111111/full',
        mimeType: 'image/png',
      },
    ]);
  });

  it('treats OpenClaw same-origin MEDIA paths as gateway media instead of local files', () => {
    const normalized = normalizeContentBlocks(
      [{ type: 'text', text: 'MEDIA:/media/inbound/test-image.png' }],
      'http://127.0.0.1:18789',
    );

    expect(normalized.attachments).toEqual([
      {
        fileName: 'test-image.png',
        dataUrl: 'http://127.0.0.1:18789/media/inbound/test-image.png',
        mimeType: 'image/png',
      },
    ]);
  });

  it('does not treat OpenClaw gateway media paths as local files without an HTTP base', () => {
    const normalized = normalizeContentBlocks([{ type: 'text', text: 'MEDIA:/media/inbound/test-image.png' }]);

    expect(normalized).toEqual({ content: 'MEDIA:/media/inbound/test-image.png' });
  });

  it('rejects third-party HTTP image blocks even when MIME says image', () => {
    const normalized = normalizeContentBlocks([
      { type: 'image', url: 'http://example.com/result.png', alt: 'result.png', mimeType: 'image/png' },
    ]);

    expect(normalized).toEqual({ content: '' });
  });

  it('allows HTTP image blocks only on the configured gateway origin', () => {
    const normalized = normalizeContentBlocks(
      [
        {
          type: 'image',
          url: 'http://127.0.0.1:18789/media/inbound/test-image.png',
          alt: 'test-image.png',
          mimeType: 'image/png',
        },
      ],
      'http://127.0.0.1:18789',
    );

    expect(normalized.attachments).toEqual([
      {
        fileName: 'test-image.png',
        dataUrl: 'http://127.0.0.1:18789/media/inbound/test-image.png',
        mimeType: 'image/png',
      },
    ]);
  });

  it('preserves media-only assistant turns', () => {
    const rawMsgs: RawHistoryMessage[] = [
      {
        role: 'assistant',
        timestamp: 2000,
        content: [{ type: 'text', text: 'MEDIA:/Users/x/.openclaw/media/out.png' }],
      },
    ];

    const turns = normalizeAssistantTurns(rawMsgs);

    expect(turns).toHaveLength(1);
    expect(turns[0].content).toBe('');
    expect(turns[0].attachments?.[0]?.fileName).toBe('out.png');
  });

  it('carries discovered assistant attachments through collapse', () => {
    const messages = collapseDiscoveredMessages(
      [
        {
          role: 'assistant',
          content: 'Image ready',
          timestamp: '2026-04-27T17:03:05.234Z',
          attachments: [{ fileName: 'out.png', dataUrl: 'file:///Users/x/out.png', mimeType: 'image/png' }],
        },
      ],
      'task-1',
    );

    expect(messages).toHaveLength(1);
    expect(messages[0].attachments).toEqual([
      { fileName: 'out.png', dataUrl: 'file:///Users/x/out.png', mimeType: 'image/png' },
    ]);
  });
});
