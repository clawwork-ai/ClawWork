import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';

type IllustrationKey = 'welcome' | 'no-tasks' | 'no-files' | 'no-results';

interface EmptyStateProps {
  icon?: ReactNode;
  illustration?: IllustrationKey;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  illustration: _illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}
      {...motionPresets.fadeIn}
    >
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)]">{icon}</div>
      ) : null}
      <div className="space-y-1">
        <div className="type-section-title text-[var(--text-primary)]">{title}</div>
        {description ? <div className="type-support text-[var(--text-muted)]">{description}</div> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </motion.div>
  );
}
