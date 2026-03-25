import { memo, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Loader2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ToolCall } from '@clawwork/shared';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface ToolCallCardProps {
  toolCall: ToolCall;
  defaultOpen?: boolean;
}

function StatusIcon({ status }: { status: ToolCall['status'] }) {
  switch (status) {
    case 'running':
      return <Loader2 size={14} className="animate-spin text-[var(--accent)]" />;
    case 'done':
      return <Check size={14} className="text-[var(--accent)]" />;
    case 'error':
      return <X size={14} className="text-[var(--danger)]" />;
  }
}

const ToolCallCard = memo(function ToolCallCard({ toolCall, defaultOpen }: ToolCallCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen ?? false);

  const duration = useMemo(() => {
    if (!toolCall.completedAt) return null;
    const elapsed = new Date(toolCall.completedAt).getTime() - new Date(toolCall.startedAt).getTime();
    return `${(elapsed / 1000).toFixed(1)}s`;
  }, [toolCall.completedAt, toolCall.startedAt]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'my-1.5 rounded-lg border border-[var(--border-subtle)]',
          'bg-[var(--bg-tertiary)] overflow-hidden',
          'shadow-[var(--shadow-card)]',
          'flex',
        )}
      >
        <div
          className={cn(
            'w-1 flex-shrink-0 rounded-l-lg',
            toolCall.status === 'running' && 'bg-[var(--accent)] animate-pulse',
            toolCall.status === 'done' && 'bg-[var(--accent)] opacity-60',
            toolCall.status === 'error' && 'bg-[var(--danger)]',
          )}
        />
        <div className="flex-1 min-w-0">
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 text-sm',
                'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors',
              )}
            >
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <StatusIcon status={toolCall.status} />
              <span className="font-mono truncate flex-1 text-left">{toolCall.name}</span>
              {duration && <span className="text-[var(--text-muted)]">{duration}</span>}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent forceMount>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={motionPresets.slideUp.initial}
                  animate={motionPresets.slideUp.animate}
                  exit={motionPresets.slideUp.exit}
                  transition={motionPresets.slideUp.transition}
                  className="px-3 pb-2.5 text-xs font-mono"
                >
                  {toolCall.args && (
                    <div className="mb-1">
                      <p className="text-[var(--text-muted)] mb-0.5">{t('toolCall.args')}</p>
                      <pre
                        className={cn(
                          'whitespace-pre-wrap text-[var(--text-secondary)]',
                          'bg-[var(--bg-primary)] p-2 rounded overflow-x-auto',
                        )}
                      >
                        {JSON.stringify(toolCall.args, null, 2)}
                      </pre>
                    </div>
                  )}
                  {toolCall.result && (
                    <div>
                      <p className="text-[var(--text-muted)] mb-0.5">{t('toolCall.result')}</p>
                      <pre
                        className={cn(
                          'whitespace-pre-wrap text-[var(--text-secondary)]',
                          'bg-[var(--bg-primary)] p-2 rounded overflow-x-auto',
                          'max-h-40 overflow-y-auto',
                        )}
                      >
                        {toolCall.result}
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
});

export default ToolCallCard;
