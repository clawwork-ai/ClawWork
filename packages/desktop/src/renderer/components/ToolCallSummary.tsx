import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolCall } from '@clawwork/shared';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import ToolCallCard from './ToolCallCard';

function ToolCallSummary({ toolCalls }: { toolCalls: ToolCall[] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const errorCount = toolCalls.filter((tc) => tc.status === 'error').length;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'type-label mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-2',
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors',
            'glow-focus',
          )}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Wrench size={14} />
          <span>
            {errorCount > 0
              ? t('chatMessage.toolCallSummaryWithErrors', { count: toolCalls.length, errorCount })
              : t('chatMessage.toolCallSummary', { count: toolCalls.length })}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent forceMount>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={motionPresets.collapse.initial}
              animate={motionPresets.collapse.animate}
              exit={motionPresets.collapse.exit}
              transition={motionPresets.collapse.transition}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {toolCalls.map((tc) => (
                  <ToolCallCard key={tc.id} toolCall={tc} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ToolCallSummary;
