import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';
import { DB_FILE_NAME } from '@clawwork/shared';
import * as schema from './schema.js';
import { initFTS } from './fts.js';

let db: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  session_key TEXT NOT NULL,
  session_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  model TEXT,
  model_provider TEXT,
  thinking_level TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  context_tokens INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  artifact_dir TEXT NOT NULL DEFAULT '',
  gateway_id TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  image_attachments TEXT,
  tool_calls TEXT
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  message_id TEXT NOT NULL REFERENCES messages(id),
  type TEXT NOT NULL DEFAULT 'file',
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  local_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT '',
  size INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
`;

function openDatabaseAt(workspacePath: string): void {
  const dbPath = join(workspacePath, DB_FILE_NAME);
  mkdirSync(dirname(dbPath), { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(CREATE_TABLES_SQL);

  try {
    sqlite.exec("ALTER TABLE tasks ADD COLUMN gateway_id TEXT NOT NULL DEFAULT ''");
  } catch {}

  for (const sql of [
    'ALTER TABLE tasks ADD COLUMN model TEXT',
    'ALTER TABLE tasks ADD COLUMN model_provider TEXT',
    'ALTER TABLE tasks ADD COLUMN thinking_level TEXT',
    'ALTER TABLE tasks ADD COLUMN input_tokens INTEGER',
    'ALTER TABLE tasks ADD COLUMN output_tokens INTEGER',
    'ALTER TABLE tasks ADD COLUMN context_tokens INTEGER',
  ]) {
    try {
      sqlite.exec(sql);
    } catch {}
  }

  try {
    sqlite.exec('ALTER TABLE messages ADD COLUMN image_attachments TEXT');
  } catch {}

  try {
    sqlite.exec('ALTER TABLE messages ADD COLUMN tool_calls TEXT');
  } catch {}

  for (const col of ['session_key TEXT', 'agent_id TEXT', 'run_id TEXT']) {
    try {
      sqlite.exec(`ALTER TABLE messages ADD COLUMN ${col}`);
    } catch {}
  }

  try {
    sqlite.exec('ALTER TABLE tasks ADD COLUMN ensemble INTEGER NOT NULL DEFAULT 0');
  } catch {}

  try {
    sqlite.exec('ALTER TABLE tasks ADD COLUMN team_id TEXT');
  } catch {}

  sqlite.exec(`
    UPDATE messages SET session_key = (
      SELECT t.session_key FROM tasks t WHERE t.id = messages.task_id
    ) WHERE session_key IS NULL
  `);
  sqlite.exec(`UPDATE messages SET session_key = '' WHERE session_key IS NULL`);

  sqlite.exec(`DROP INDEX IF EXISTS messages_logical_unique`);
  sqlite.exec(`DROP INDEX IF EXISTS messages_dedup`);

  sqlite.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS messages_dedup
    ON messages(task_id, session_key, role, timestamp)
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS task_rooms (
      task_id TEXT PRIMARY KEY REFERENCES tasks(id),
      status TEXT NOT NULL DEFAULT 'active',
      conductor_ready INTEGER NOT NULL DEFAULT 0
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS task_room_sessions (
      session_key TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id),
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL DEFAULT '',
      emoji TEXT,
      verified_at TEXT NOT NULL
    )
  `);

  sqlite.exec("DELETE FROM messages WHERE role = 'assistant' AND (content = '' OR TRIM(content) = 'NO_REPLY')");

  try {
    sqlite.exec("ALTER TABLE artifacts ADD COLUMN content_text TEXT NOT NULL DEFAULT ''");
  } catch {}

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '',
      description TEXT DEFAULT '',
      gateway_id TEXT NOT NULL,
      source TEXT DEFAULT 'local',
      version TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS team_agents (
      team_id TEXT NOT NULL REFERENCES teams(id),
      agent_id TEXT NOT NULL,
      role TEXT DEFAULT '',
      is_manager INTEGER DEFAULT 0,
      PRIMARY KEY (team_id, agent_id)
    )
  `);

  initFTS(sqlite);

  db = drizzle(sqlite, { schema });
  console.log(`[db] initialized at ${dbPath}`);
}

export function initDatabase(workspacePath: string): void {
  if (db) return;
  openDatabaseAt(workspacePath);
}

export function reinitDatabase(workspacePath: string): void {
  closeDatabase();
  openDatabaseAt(workspacePath);
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function getSqlite(): Database.Database | null {
  return sqlite;
}

export function isDbReady(): boolean {
  return db !== null;
}

export function closeDatabase(): void {
  sqlite?.close();
  sqlite = null;
  db = null;
}
