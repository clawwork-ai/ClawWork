import { execFileSync } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';

const DB_FILE_NAME = '.clawwork.db';

interface DbMessageRow {
  id: string;
  task_id: string;
  role: string;
  content: string;
  timestamp: string;
  image_attachments: string | null;
  tool_calls: string | null;
}

function selectAll<T>(workspaceDir: string, sql: string): T[] {
  const dbPath = join(workspaceDir, DB_FILE_NAME);
  if (!fs.existsSync(dbPath)) return [];
  const stdout = execFileSync('sqlite3', [dbPath, '-json', sql], { encoding: 'utf8' });
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  return JSON.parse(trimmed) as T[];
}

export function readAllMessages(workspaceDir: string): DbMessageRow[] {
  return selectAll<DbMessageRow>(workspaceDir, 'SELECT * FROM messages');
}

export function messagesForTask(workspaceDir: string, taskId: string): DbMessageRow[] {
  return readAllMessages(workspaceDir).filter((m) => m.task_id === taskId);
}

export function countByRole(rows: DbMessageRow[], role: string): number {
  return rows.filter((m) => m.role === role).length;
}
