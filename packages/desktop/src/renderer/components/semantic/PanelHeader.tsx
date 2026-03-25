import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function PanelHeader({ title, subtitle, actions, className }: PanelHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <div className="type-title-sm text-[var(--text-primary)]">{title}</div>
        {subtitle ? <div className="mt-1 type-body-sm text-[var(--text-muted)]">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
