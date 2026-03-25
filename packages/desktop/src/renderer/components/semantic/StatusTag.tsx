import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { StatusKind } from '@/lib/ui-contract';

const STATUS_CLASS: Record<StatusKind, string> = {
  success: 'bg-[var(--accent-dim)] text-[var(--accent)]',
  warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
  error: 'bg-[var(--danger-bg)] text-[var(--danger)]',
  neutral: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
  accent: 'bg-[var(--accent-soft)] text-[var(--accent)]',
};

interface StatusTagProps {
  tone: StatusKind;
  children: ReactNode;
  className?: string;
}

export default function StatusTag({ tone, children, className }: StatusTagProps) {
  return (
    <span className={cn('type-badge inline-flex items-center rounded px-1.5 py-0.5', STATUS_CLASS[tone], className)}>
      {children}
    </span>
  );
}
