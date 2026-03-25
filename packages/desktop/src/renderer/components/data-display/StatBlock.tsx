import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatBlockProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
  className?: string;
}

export default function StatBlock({ label, value, hint, accent, className }: StatBlockProps) {
  return (
    <div className={cn('rounded-lg bg-[var(--bg-tertiary)] px-3 py-2', className)}>
      <div className="type-meta text-[var(--text-muted)]">{label}</div>
      <div className={cn('mt-1 type-title-sm', accent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]')}>
        {value}
      </div>
      {hint ? <div className="mt-1 type-body-sm text-[var(--text-muted)]">{hint}</div> : null}
    </div>
  );
}
