import type Database from 'better-sqlite3';
import type { ClawDashboardData } from '@clawwork/shared';

export function collectDashboardData(db: Database.Database): ClawDashboardData {
  const totalTasks = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;

  const activeDays = (
    db.prepare('SELECT COUNT(DISTINCT substr(created_at, 1, 10)) as c FROM tasks').get() as { c: number }
  ).c;

  const tokens = db
    .prepare(
      `SELECT
        COALESCE(SUM(input_tokens), 0) as input,
        COALESCE(SUM(output_tokens), 0) as output
       FROM tasks`,
    )
    .get() as { input: number; output: number };

  return {
    totalTasks,
    activeDays,
    totalInputTokens: tokens.input,
    totalOutputTokens: tokens.output,
  };
}
