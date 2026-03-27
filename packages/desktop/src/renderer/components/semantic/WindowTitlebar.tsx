import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WindowTitlebarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export default function WindowTitlebar({ left, center, right, className }: WindowTitlebarProps) {
  return (
    <header
      className={cn(
        'titlebar-drag flex items-center justify-between',
        'h-[var(--density-toolbar-height)] px-5 flex-shrink-0',
        'border-b border-[var(--border)]',
        className,
      )}
    >
      <div className="titlebar-no-drag flex items-center gap-2 min-w-0 flex-1">{left}</div>
      {center && <div className="titlebar-no-drag flex items-center justify-center min-w-0">{center}</div>}
      <div className="titlebar-no-drag flex items-center gap-2 flex-shrink-0">{right}</div>
    </header>
  );
}
