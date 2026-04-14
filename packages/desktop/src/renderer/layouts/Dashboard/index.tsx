import { Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 px-6 text-center text-[var(--text-muted)]">
      <Gauge size={40} className="opacity-60" />
      <p className="type-body max-w-md">{t('dashboard.comingSoon')}</p>
    </div>
  );
}
