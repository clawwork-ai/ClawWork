import type { ReactNode } from 'react';
import { AlertTriangle, CircleAlert, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type InlineNoticeTone = 'info' | 'warning' | 'error';

const NOTICE_TONE = {
  info: {
    icon: Info,
    className: 'bg-[var(--info)]/10 border-[var(--info)]/20 text-[var(--info)]',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)]',
  },
  error: {
    icon: CircleAlert,
    className: 'bg-[var(--danger-bg)] border-[var(--danger)]/20 text-[var(--danger)]',
  },
} as const;

interface InlineNoticeProps {
  tone: InlineNoticeTone;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function InlineNotice({ tone, children, action, className }: InlineNoticeProps) {
  const Icon = NOTICE_TONE[tone].icon;

  return (
    <div className={cn('flex items-start gap-2 rounded-lg border px-3 py-2', NOTICE_TONE[tone].className, className)}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 type-body-sm">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
