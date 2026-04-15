import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatTokenCount } from '@/lib/utils';

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <div className="type-meta uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-2 type-page-title text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const data = useDashboardStore((s) => s.data);
  const fetchDashboard = useDashboardStore((s) => s.fetch);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="h-full w-full overflow-y-auto p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label={t('dashboard.totalTasks')} value={data?.totalTasks ?? 0} />
        <Tile label={t('dashboard.activeDays')} value={data?.activeDays ?? 0} />
        <Tile label={t('dashboard.inputTokens')} value={formatTokenCount(data?.totalInputTokens ?? 0)} />
        <Tile label={t('dashboard.outputTokens')} value={formatTokenCount(data?.totalOutputTokens ?? 0)} />
      </div>
    </div>
  );
}
