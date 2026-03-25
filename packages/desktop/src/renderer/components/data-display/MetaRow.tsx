import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetaRowProps {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}

export default function MetaRow({ label, value, className }: MetaRowProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <span className="type-label-sm text-[var(--text-secondary)]">{label}</span>
      <span className="type-body-sm text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
