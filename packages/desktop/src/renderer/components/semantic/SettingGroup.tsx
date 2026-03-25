import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import PanelHeader from './PanelHeader';

interface SettingGroupProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SettingGroup({ title, subtitle, children, className }: SettingGroupProps) {
  return (
    <section className={cn('surface-card overflow-hidden rounded-xl', className)}>
      {title || subtitle ? <PanelHeader title={title} subtitle={subtitle} className="px-5 py-4" /> : null}
      <div className="divide-y divide-[var(--border-subtle)]">{children}</div>
    </section>
  );
}
