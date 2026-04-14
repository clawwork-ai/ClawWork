import type Database from 'better-sqlite3';
import type { ClawProfileData } from '@clawwork/shared';

const MIN_TASKS_FOR_PROFILE = 3;

const EMPTY_PROFILE: Omit<ClawProfileData, 'totalTasks'> = {
  activeDays: 0,
  signatureSkill: null,
  mvpAgent: null,
  topModel: null,
  busiestHour: null,
  hasEnoughData: false,
};

export function collectProfileData(db: Database.Database): ClawProfileData {
  const totalTasks = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;

  if (totalTasks < MIN_TASKS_FOR_PROFILE) {
    return { totalTasks, ...EMPTY_PROFILE };
  }

  const activeDays = (
    db.prepare('SELECT COUNT(DISTINCT substr(created_at, 1, 10)) as c FROM tasks').get() as { c: number }
  ).c;

  const signatureSkillRow = db
    .prepare(
      `SELECT json_extract(e.value, '$.name') as name, COUNT(*) as uses
       FROM messages m, json_each(m.tool_calls) e
       WHERE m.tool_calls IS NOT NULL
         AND m.tool_calls != ''
         AND json_valid(m.tool_calls)
       GROUP BY name
       HAVING name IS NOT NULL
       ORDER BY uses DESC
       LIMIT 1`,
    )
    .get() as { name: string | null; uses: number } | undefined;

  const mvpAgentRow = db
    .prepare(
      `SELECT agent_id, COUNT(DISTINCT task_id) as c
       FROM messages
       WHERE role = 'assistant' AND agent_id IS NOT NULL
       GROUP BY agent_id
       ORDER BY c DESC
       LIMIT 1`,
    )
    .get() as { agent_id: string | null; c: number } | undefined;

  const topModelRow = db
    .prepare(
      `SELECT model, SUM(COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)) as tokens
       FROM tasks
       WHERE model IS NOT NULL
       GROUP BY model
       ORDER BY tokens DESC
       LIMIT 1`,
    )
    .get() as { model: string | null; tokens: number } | undefined;

  const busiestHourRow = db
    .prepare(
      `SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as c
       FROM tasks
       WHERE created_at IS NOT NULL
       GROUP BY hour
       ORDER BY c DESC
       LIMIT 1`,
    )
    .get() as { hour: number | null; c: number } | undefined;

  return {
    totalTasks,
    activeDays,
    signatureSkill:
      signatureSkillRow && signatureSkillRow.name
        ? { name: signatureSkillRow.name, uses: signatureSkillRow.uses }
        : null,
    mvpAgent: mvpAgentRow && mvpAgentRow.agent_id ? { agentId: mvpAgentRow.agent_id, taskCount: mvpAgentRow.c } : null,
    topModel: topModelRow && topModelRow.model ? { model: topModelRow.model, tokens: topModelRow.tokens } : null,
    busiestHour: busiestHourRow && busiestHourRow.hour !== null ? busiestHourRow.hour : null,
    hasEnoughData: true,
  };
}
