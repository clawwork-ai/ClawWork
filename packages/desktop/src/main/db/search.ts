import type Database from 'better-sqlite3';

interface SearchResult {
  type: 'task' | 'message' | 'artifact';
  id: string;
  title: string;
  snippet: string;
  taskId?: string;
}

const SEARCH_SQL = `
SELECT * FROM (
  SELECT 'task' AS type, t.id, t.title, snippet(tasks_fts, 0, '<<', '>>', '…', 32) AS snippet,
    NULL AS task_id, tasks_fts.rank
  FROM tasks_fts
  JOIN tasks t ON t.rowid = tasks_fts.rowid
  WHERE tasks_fts MATCH ?
  UNION ALL
  SELECT 'message' AS type, m.id, substr(m.content, 1, 60) AS title,
    snippet(messages_fts, 0, '<<', '>>', '…', 32) AS snippet,
    m.task_id, messages_fts.rank
  FROM messages_fts
  JOIN messages m ON m.rowid = messages_fts.rowid
  WHERE messages_fts MATCH ?
  UNION ALL
  SELECT 'artifact' AS type, a.id, a.type AS title,
    snippet(artifacts_fts, 1, '<<', '>>', '…', 32) AS snippet,
    a.task_id, artifacts_fts.rank
  FROM artifacts_fts
  JOIN artifacts a ON a.rowid = artifacts_fts.rowid
  WHERE artifacts_fts MATCH ?
) ORDER BY rank LIMIT 20;
`;

export function globalSearch(db: Database.Database, query: string): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const ftsQuery = q.replace(/[^\w\u4e00-\u9fff]/g, ' ').trim() + '*';
  if (ftsQuery === '*') return [];

  const stmt = db.prepare(SEARCH_SQL);
  const rows = stmt.all(ftsQuery, ftsQuery, ftsQuery) as Array<{
    type: 'task' | 'message' | 'artifact';
    id: string;
    title: string;
    snippet: string;
    task_id: string | null;
  }>;

  return rows.map((r) => ({
    type: r.type,
    id: r.id,
    title: r.title,
    snippet: r.snippet,
    taskId: r.task_id ?? undefined,
  }));
}

const ARTIFACT_SEARCH_SQL = `
SELECT a.id, a.task_id, a.name, a.type, a.local_path, a.mime_type, a.size, a.created_at, a.file_path, a.message_id,
  snippet(artifacts_fts, 1, '<mark>', '</mark>', '…', 32) AS content_snippet
FROM artifacts_fts
JOIN artifacts a ON a.rowid = artifacts_fts.rowid
WHERE __WHERE__
ORDER BY artifacts_fts.rank
LIMIT 50;
`;

interface ArtifactSearchResult {
  id: string;
  taskId: string;
  name: string;
  type: string;
  localPath: string;
  mimeType: string;
  size: number;
  createdAt: string;
  filePath: string;
  messageId: string;
  contentSnippet?: string;
}

type ArtifactSearchKind = 'all' | 'image' | 'code' | 'file' | 'other';

interface ArtifactSearchOptions {
  kind?: ArtifactSearchKind;
}

function artifactKindClause(kind: ArtifactSearchKind | undefined): string | null {
  if (!kind || kind === 'all') return null;
  if (kind === 'image') return "(a.type = 'image' OR a.mime_type LIKE 'image/%')";
  if (kind === 'code') return "a.type = 'code'";
  if (kind === 'file') return "a.type = 'file'";
  return "(a.type NOT IN ('image', 'code', 'file') AND a.mime_type NOT LIKE 'image/%')";
}

export function searchArtifacts(
  db: Database.Database,
  query: string,
  options: ArtifactSearchOptions = {},
): ArtifactSearchResult[] {
  const q = query.trim();
  if (!q) return [];
  const ftsQuery = q.replace(/[^\w\u4e00-\u9fff]/g, ' ').trim() + '*';
  if (ftsQuery === '*') return [];
  const clauses = ['artifacts_fts MATCH ?'];
  const params: string[] = [ftsQuery];
  const kindClause = artifactKindClause(options.kind);
  if (kindClause) clauses.push(kindClause);
  const stmt = db.prepare(ARTIFACT_SEARCH_SQL.replace('__WHERE__', clauses.join(' AND ')));
  const rows = stmt.all(...params) as Array<{
    id: string;
    task_id: string;
    name: string;
    type: string;
    local_path: string;
    mime_type: string;
    size: number;
    created_at: string;
    file_path: string;
    message_id: string;
    content_snippet: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    taskId: r.task_id,
    name: r.name,
    type: r.type,
    localPath: r.local_path,
    mimeType: r.mime_type,
    size: r.size,
    createdAt: r.created_at,
    filePath: r.file_path,
    messageId: r.message_id,
    contentSnippet: r.content_snippet || undefined,
  }));
}
