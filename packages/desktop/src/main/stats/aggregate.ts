import type Database from 'better-sqlite3';
import type { ClawDashboardData, CostUsageSummary, DashboardLast30d } from '@clawwork/shared';
import { getAllGatewayClients } from '../ws/index.js';

export async function collectDashboardData(db: Database.Database): Promise<ClawDashboardData> {
  const totalTasks = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;

  const activeDays = (
    db.prepare('SELECT COUNT(DISTINCT substr(created_at, 1, 10)) as c FROM tasks').get() as { c: number }
  ).c;

  const totalMessages = (db.prepare('SELECT COUNT(*) as c FROM messages').get() as { c: number }).c;
  const totalArtifacts = (db.prepare('SELECT COUNT(*) as c FROM artifacts').get() as { c: number }).c;

  const last30d = await collectLast30d();

  return {
    totalTasks,
    activeDays,
    totalMessages,
    totalArtifacts,
    last30d,
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
