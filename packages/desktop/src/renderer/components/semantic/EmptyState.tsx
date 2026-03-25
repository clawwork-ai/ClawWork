import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)]">{icon}</div>
      ) : null}
      <div className="space-y-1">
        <div className="type-title-sm text-[var(--text-primary)]">{title}</div>
        {description ? <div className="type-body-sm text-[var(--text-muted)]">{description}</div> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
