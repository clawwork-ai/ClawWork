import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoadingBlockMode = 'inline' | 'section' | 'panel';

interface LoadingBlockProps {
  label?: string;
  mode?: LoadingBlockMode;
  className?: string;
}

const MODE_CLASS: Record<LoadingBlockMode, string> = {
  inline: 'justify-start py-2',
  section: 'justify-center py-8',
  panel: 'justify-center py-12',
};

export default function LoadingBlock({ label, mode = 'section', className }: LoadingBlockProps) {
  return (
    <div className={cn('flex items-center gap-2 text-[var(--text-muted)]', MODE_CLASS[mode], className)}>
      <Loader2 size={16} className="animate-spin" />
      {label ? <span className="type-body-sm">{label}</span> : null}
    </div>
  );
}
