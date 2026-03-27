import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function SettingRow({ label, description, children, className, contentClassName }: SettingRowProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-5 py-4', className)}>
      <div className={cn('min-w-0 flex-1', contentClassName)}>
        {typeof label === 'string' ? <div className="type-label text-[var(--text-primary)]">{label}</div> : label}
        {description ? <div className="mt-1 type-support text-[var(--text-muted)]">{description}</div> : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}
