import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatCost, formatTokenCount } from '@/lib/utils';

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <div className="type-meta uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-2 type-page-title text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function SectionHeader({ text }: { text: string }) {
  return <div className="type-section-title text-[var(--text-secondary)] mb-3">{text}</div>;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const data = useDashboardStore((s) => s.data);
  const fetchDashboard = useDashboardStore((s) => s.fetch);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const last30d = data?.last30d;
  const placeholder = '—';

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-8">
      <section>
        <SectionHeader text={t('dashboard.allTimeSection')} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tile label={t('dashboard.totalTasks')} value={(data?.totalTasks ?? 0).toLocaleString()} />
          <Tile label={t('dashboard.activeDays')} value={(data?.activeDays ?? 0).toLocaleString()} />
          <Tile label={t('dashboard.totalMessages')} value={(data?.totalMessages ?? 0).toLocaleString()} />
          <Tile label={t('dashboard.totalArtifacts')} value={(data?.totalArtifacts ?? 0).toLocaleString()} />
        </div>
      </section>

      <section>
        <SectionHeader text={t('dashboard.last30dSection')} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Tile label={t('dashboard.inputTokens')} value={last30d ? formatTokenCount(last30d.input) : placeholder} />
          <Tile label={t('dashboard.outputTokens')} value={last30d ? formatTokenCount(last30d.output) : placeholder} />
          <Tile label={t('dashboard.cost')} value={last30d ? formatCost(last30d.cost) : placeholder} />
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <div className="type-meta uppercase tracking-wider text-[var(--text-muted)] mb-4">
            {t('dashboard.tokenChart')}
          </div>
          {last30d && last30d.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={last30d.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => formatTokenCount(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value) => (typeof value === 'number' ? formatTokenCount(value) : String(value ?? ''))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="input"
                  stroke="var(--accent)"
                  name={t('dashboard.inputTokens')}
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="output"
                  stroke="var(--warning)"
                  name={t('dashboard.outputTokens')}
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-40 items-center justify-center type-body text-[var(--text-muted)]">
              {t('dashboard.noData')}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
