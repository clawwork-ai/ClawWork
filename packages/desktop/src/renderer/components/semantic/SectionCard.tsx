import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import PanelHeader from './PanelHeader';

interface SectionCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section className={cn('surface-card rounded-xl', className)}>
      {title || subtitle || actions ? (
        <PanelHeader title={title} subtitle={subtitle} actions={actions} className="px-5 py-4" />
      ) : null}
      <div className={cn('px-5 py-4', bodyClassName)}>{children}</div>
    </section>
  );
}
