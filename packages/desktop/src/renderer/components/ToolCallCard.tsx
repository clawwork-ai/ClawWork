import { memo, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Loader2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ToolCall } from '@clawwork/shared';
import { cn } from '@/lib/utils';
import { motionSpring, motion as motionPresets } from '@/styles/design-tokens';
import { getToolColor } from '@/lib/getToolFamily';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

function StatusIcon({ status }: { status: ToolCall['status'] }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={motionSpring.bouncy}
        className="inline-flex"
      >
        {status === 'running' && <Loader2 size={14} className="animate-spin text-[var(--accent)]" />}
        {status === 'done' && <Check size={14} className="text-[var(--accent)]" />}
        {status === 'error' && <X size={14} className="text-[var(--danger)]" />}
      </motion.span>
    </AnimatePresence>
  );
}

interface ToolCallCardProps {
  toolCall: ToolCall;
  defaultOpen?: boolean;
}

const ToolCallCard = memo(function ToolCallCard({ toolCall, defaultOpen }: ToolCallCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const toolColor = getToolColor(toolCall.name);

  const duration = useMemo(() => {
    if (!toolCall.completedAt) return null;
    const elapsed = new Date(toolCall.completedAt).getTime() - new Date(toolCall.startedAt).getTime();
    return `${(elapsed / 1000).toFixed(1)}s`;
  }, [toolCall.completedAt, toolCall.startedAt]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'my-1.5 rounded-lg overflow-hidden flex',
          'glass-card',
          toolCall.status === 'running' && 'glow-running tool-scan',
        )}
      >
        <div className="w-0.5 flex-shrink-0 rounded-l-lg" style={{ backgroundColor: toolColor }} />
        <div className="flex-1 min-w-0">
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'type-label flex w-full items-center gap-2 px-3 py-2.5',
                'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors',
                'glow-focus',
              )}
            >
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <StatusIcon status={toolCall.status} />
              <span className="type-mono-data truncate flex-1 text-left">{toolCall.name}</span>
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
                  className="type-code-block px-3 pb-2.5"
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
