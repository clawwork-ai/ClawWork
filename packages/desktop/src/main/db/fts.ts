import type Database from 'better-sqlite3';

const FTS_DDL = `
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(content, tokenize='unicode61');
CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(title, tokenize='unicode61');

-- messages triggers
CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
END;
CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
  DELETE FROM messages_fts WHERE rowid = old.rowid;
  INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
END;
CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
  DELETE FROM messages_fts WHERE rowid = old.rowid;
END;

-- tasks triggers
CREATE TRIGGER IF NOT EXISTS tasks_ai AFTER INSERT ON tasks BEGIN
  INSERT INTO tasks_fts(rowid, title) VALUES (new.rowid, new.title);
END;
CREATE TRIGGER IF NOT EXISTS tasks_au AFTER UPDATE ON tasks BEGIN
  DELETE FROM tasks_fts WHERE rowid = old.rowid;
  INSERT INTO tasks_fts(rowid, title) VALUES (new.rowid, new.title);
END;
CREATE TRIGGER IF NOT EXISTS tasks_ad AFTER DELETE ON tasks BEGIN
  DELETE FROM tasks_fts WHERE rowid = old.rowid;
END;
`;

const ARTIFACTS_FTS_DDL = `
CREATE VIRTUAL TABLE IF NOT EXISTS artifacts_fts USING fts5(name, content_text, tokenize='unicode61');

CREATE TRIGGER IF NOT EXISTS artifacts_ai AFTER INSERT ON artifacts BEGIN
  INSERT INTO artifacts_fts(rowid, name, content_text) VALUES (new.rowid, new.name, new.content_text);
END;
CREATE TRIGGER IF NOT EXISTS artifacts_au AFTER UPDATE ON artifacts BEGIN
  DELETE FROM artifacts_fts WHERE rowid = old.rowid;
  INSERT INTO artifacts_fts(rowid, name, content_text) VALUES (new.rowid, new.name, new.content_text);
END;
CREATE TRIGGER IF NOT EXISTS artifacts_ad AFTER DELETE ON artifacts BEGIN
  DELETE FROM artifacts_fts WHERE rowid = old.rowid;
END;
`;

const BACKFILL_SQL = `
INSERT OR IGNORE INTO messages_fts(rowid, content) SELECT rowid, content FROM messages;
INSERT OR IGNORE INTO tasks_fts(rowid, title) SELECT rowid, title FROM tasks;
INSERT OR IGNORE INTO artifacts_fts(rowid, name, content_text) SELECT rowid, name, content_text FROM artifacts;
`;

export function initFTS(db: Database.Database): void {
  db.exec(FTS_DDL);

  try {
    const cols = db.prepare('SELECT * FROM artifacts_fts LIMIT 0').columns();
    if (!cols.some((c) => c.name === 'content_text')) throw new Error('schema mismatch');
  } catch {
    db.exec(`
      DROP TABLE IF EXISTS artifacts_fts;
      DROP TRIGGER IF EXISTS artifacts_ai;
      DROP TRIGGER IF EXISTS artifacts_au;
      DROP TRIGGER IF EXISTS artifacts_ad;
    `);
    db.exec(ARTIFACTS_FTS_DDL);
  }

  db.exec(BACKFILL_SQL);
  console.log('[fts] FTS5 virtual tables initialized');
}
