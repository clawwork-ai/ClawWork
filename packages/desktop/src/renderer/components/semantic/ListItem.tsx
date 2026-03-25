import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ListItemProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function ListItem({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  active,
  onClick,
  className,
}: ListItemProps) {
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex min-h-[var(--density-list-item-height)] w-full items-center gap-3 rounded-lg px-3 py-2 text-left',
        active ? 'bg-[var(--state-selected)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
        onClick && 'transition-colors hover:bg-[var(--state-hover)]',
        className,
      )}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="type-label-md truncate text-[var(--text-primary)]">{title}</div>
        {subtitle ? <div className="mt-0.5 type-body-sm truncate text-[var(--text-muted)]">{subtitle}</div> : null}
      </div>
      {meta ? <div className="shrink-0 type-meta text-[var(--text-muted)]">{meta}</div> : null}
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </Comp>
  );
}
