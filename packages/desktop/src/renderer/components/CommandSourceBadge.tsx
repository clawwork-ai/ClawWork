import { useTranslation } from 'react-i18next';
import { SOURCE_I18N_KEYS, type SlashCommandView } from '@/lib/slash-commands';

interface CommandSourceBadgeProps {
  source: SlashCommandView['source'];
}

export default function CommandSourceBadge({ source }: CommandSourceBadgeProps) {
  const { t } = useTranslation();
  if (source === 'native') return null;
  const label = t(SOURCE_I18N_KEYS[source]);
  return (
    <span
      className="type-meta shrink-0 rounded-sm border border-[var(--border-subtle)] px-1.5 py-0.5 text-[var(--text-muted)]"
      title={label}
    >
      {label}
    </span>
  );
}
