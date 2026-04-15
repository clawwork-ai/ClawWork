import type Database from 'better-sqlite3';
import type {
  ClawDashboardData,
  CostUsageSummary,
  DashboardBreakdownEntry,
  DashboardBreakdowns,
  DashboardLast30d,
} from '@clawwork/shared';
import { parseAgentIdFromSessionKey } from '@clawwork/shared';
import { getAllGatewayClients } from '../ws/index.js';

export async function collectDashboardData(db: Database.Database): Promise<ClawDashboardData> {
  const totalTasks = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;

  const activeDays = (
    db.prepare('SELECT COUNT(DISTINCT substr(created_at, 1, 10)) as c FROM tasks').get() as { c: number }
  ).c;

  const totalMessages = (db.prepare('SELECT COUNT(*) as c FROM messages').get() as { c: number }).c;
  const totalArtifacts = (db.prepare('SELECT COUNT(*) as c FROM artifacts').get() as { c: number }).c;

  const breakdowns = collectBreakdowns(db, totalTasks, buildGatewayNameMap());
  const last30d = await collectLast30d();

  return {
    totalTasks,
    activeDays,
    totalMessages,
    totalArtifacts,
    breakdowns,
    last30d,
  };
}

function toEntries(
  rows: Array<{ name: string; count: number }>,
  total: number,
  limit: number,
): DashboardBreakdownEntry[] {
  return rows
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((row) => ({
      name: row.name,
      count: row.count,
      percent: total > 0 ? Math.round((row.count / total) * 100) : 0,
    }));
}

function buildGatewayNameMap(): Map<string, string> {
  const clients = getAllGatewayClients();
  const nameMap = new Map<string, string>();
  for (const [id, client] of clients) {
    nameMap.set(id, client.name || id);
  }
  return nameMap;
}

function collectBreakdowns(
  db: Database.Database,
  totalTasks: number,
  gatewayNames: Map<string, string>,
): DashboardBreakdowns {
  const modelRows = db
    .prepare(
      `SELECT model as name, COUNT(*) as count
       FROM tasks
       WHERE model IS NOT NULL AND model != ''
       GROUP BY model`,
    )
    .all() as Array<{ name: string; count: number }>;

  const gatewayRawRows = db
    .prepare(
      `SELECT gateway_id as id, COUNT(*) as count
       FROM tasks
       WHERE gateway_id IS NOT NULL AND gateway_id != ''
       GROUP BY gateway_id`,
    )
    .all() as Array<{ id: string; count: number }>;
  const gatewayRows = gatewayRawRows.map((row) => ({
    name: gatewayNames.get(row.id) ?? row.id,
    count: row.count,
  }));

  const sessionKeyRows = db.prepare('SELECT session_key as sessionKey FROM tasks').all() as Array<{
    sessionKey: string;
  }>;
  const agentCounts = new Map<string, number>();
  for (const { sessionKey } of sessionKeyRows) {
    const agentId = parseAgentIdFromSessionKey(sessionKey);
    if (!agentId) continue;
    agentCounts.set(agentId, (agentCounts.get(agentId) ?? 0) + 1);
  }
  const agentRows = Array.from(agentCounts.entries()).map(([name, count]) => ({ name, count }));

  return {
    models: toEntries(modelRows, totalTasks, 5),
    gateways: toEntries(gatewayRows, totalTasks, 5),
    agents: toEntries(agentRows, totalTasks, 5),
  };
}

async function collectLast30d(): Promise<DashboardLast30d | null> {
  const clients = getAllGatewayClients();
  const connected = Array.from(clients.values()).filter((gw) => gw.isConnected);
  if (connected.length === 0) return null;

  const summaries = await Promise.all(
    connected.map(async (gw) => {
      try {
        return (await gw.getUsageCost({ days: 30 })) as unknown as CostUsageSummary;
      } catch (err) {
        console.error('[stats:dashboard] getUsageCost failed:', err);
        return null;
      }
    }),
  );

  const valid = summaries.filter(
    (s): s is CostUsageSummary => s !== null && Array.isArray(s.daily) && s.totals !== undefined,
  );
  if (valid.length === 0) return null;

  let input = 0;
  let output = 0;
  let cost = 0;
  for (const s of valid) {
    input += s.totals.input ?? 0;
    output += s.totals.output ?? 0;
    cost += s.totals.totalCost ?? 0;
  }

  const dailyMap = new Map<string, { input: number; output: number; cost: number }>();
  for (const s of valid) {
    for (const entry of s.daily) {
      const existing = dailyMap.get(entry.date) ?? { input: 0, output: 0, cost: 0 };
      existing.input += entry.input ?? 0;
      existing.output += entry.output ?? 0;
      existing.cost += entry.totalCost ?? 0;
      dailyMap.set(entry.date, existing);
    }
  }

  const daily = Array.from(dailyMap.entries())
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { input, output, cost, daily };
}
