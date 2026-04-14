import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@/stores/profileStore';
import HeroCard from './HeroCard';

const MIN_TASKS = 3;

function EmptyProfile({ totalTasks }: { totalTasks: number }) {
  const { t } = useTranslation();
  const filled = Math.min(MIN_TASKS, totalTasks);
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex max-w-sm flex-col items-center gap-4 px-6 text-center text-[var(--text-muted)]">
        <Sparkles size={32} className="text-[var(--accent)] opacity-70" />
        <p className="type-section-title text-[var(--text-primary)]">{t('dashboard.formingTitle')}</p>
        <p className="type-body">{t('dashboard.unlockHint')}</p>
        <div className="flex gap-1">
          {Array.from({ length: MIN_TASKS }, (_, i) => (
            <div
              key={i}
              className={`h-1 w-8 rounded-full ${i < filled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const data = useProfileStore((s) => s.data);
  const fetchProfile = useProfileStore((s) => s.fetch);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (!data || !data.hasEnoughData) {
    return <EmptyProfile totalTasks={data?.totalTasks ?? 0} />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <HeroCard data={data} />
    </div>
  );
}
