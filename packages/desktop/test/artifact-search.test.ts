import { describe, expect, it, vi } from 'vitest';
import { globalSearch, searchArtifacts } from '../src/main/db/search.js';

function mockDb(rows: unknown[]) {
  const all = vi.fn((..._args: unknown[]) => rows);
  const prepare = vi.fn((_sql: string) => ({ all }));
  return {
    db: { prepare },
    prepare,
    all,
  };
}

describe('artifact search', () => {
  it('filters full-text artifact results by kind', () => {
    const { db, prepare, all } = mockDb([
      {
        id: 'artifact-code',
        task_id: 'task-a',
        name: 'snippet-a1b2c3d4.ts',
        type: 'code',
        local_path: 'task-a/snippet-a1b2c3d4.ts',
        mime_type: 'text/typescript',
        size: 10,
        created_at: '2026-01-01T00:00:00.000Z',
        file_path: '',
        message_id: 'msg-a',
        content_snippet: '<mark>render</mark> button',
      },
    ]);

    const result = searchArtifacts(db as never, 'render', { kind: 'code' });

    expect(prepare.mock.calls[0][0]).toContain("a.type = 'code'");
    expect(all).toHaveBeenCalledWith('render*');
    expect(result.map((r) => r.id)).toEqual(['artifact-code']);
  });

  it('does not expose stored filenames as search snippets', () => {
    const { db } = mockDb([
      {
        id: 'artifact-image',
        task_id: 'task-b',
        name: 'image-1---11111111-1111-4111-8111-111111111111-deadbeef.png',
        type: 'image',
        local_path: 'task-b/image-1---11111111-1111-4111-8111-111111111111-deadbeef.png',
        mime_type: 'image/png',
        size: 20,
        created_at: '2026-01-02T00:00:00.000Z',
        file_path: '',
        message_id: 'msg-b',
        content_snippet: '',
      },
    ]);

    const [result] = searchArtifacts(db as never, 'image', { kind: 'image' });

    expect(result.name).toContain('deadbeef.png');
    expect(result.contentSnippet).toBeUndefined();
  });

  it('does not use stored artifact filenames as global search titles', () => {
    const { db } = mockDb([
      {
        type: 'artifact',
        id: 'artifact-image',
        title: 'image',
        snippet: '',
        task_id: 'task-b',
      },
    ]);

    const [result] = globalSearch(db as never, 'image').filter((item) => item.type === 'artifact');

    expect(result.title).toBe('image');
    expect(result.snippet).not.toContain('deadbeef');
  });
});
