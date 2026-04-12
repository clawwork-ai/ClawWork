import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';

interface TeamCardShellProps {
  emoji: string;
  name: string;
  subtitle?: ReactNode;
  description?: string;
  memberCount: number;
  actions: ReactNode;
  topRight?: ReactNode;
  onClick: () => void;
}

export function TeamCardShell({
  emoji,
  name,
  subtitle,
  description,
  memberCount,
  actions,
  topRight,
  onClick,
}: TeamCardShellProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      {...motionPresets.listItem}
      onClick={onClick}
      className={cn(
        'surface-card flex w-full cursor-pointer flex-col items-start gap-3 rounded-xl p-5',
        'border border-[var(--border)] transition-colors',
        'hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]',
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
            <span className="emoji-lg">{emoji}</span>
          </span>
          <div className="min-w-0">
            <h3 className="type-section-title truncate text-[var(--text-primary)]">{name}</h3>
            {subtitle}
          </div>
        </div>
        {topRight}
      </div>
      {description && <p className="type-body line-clamp-2 text-[var(--text-secondary)]">{description}</p>}
      <div className="flex w-full items-center justify-between">
        <div className="type-meta flex items-center gap-1.5 text-[var(--text-muted)]">
          <Users size={13} className="opacity-60" />
          <span>{t('teams.memberCount', { count: memberCount })}</span>
        </div>
        {actions}
      </div>
    </motion.div>
  );
}
