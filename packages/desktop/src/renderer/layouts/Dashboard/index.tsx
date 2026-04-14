import { useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@/stores/profileStore';

export default function Dashboard() {
  const { t } = useTranslation();
  const fetchProfile = useProfileStore((s) => s.fetch);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 px-6 text-center text-[var(--text-muted)]">
      <Gauge size={40} className="opacity-60" />
      <p className="type-body max-w-md">{t('dashboard.comingSoon')}</p>
    </div>
  );
}
