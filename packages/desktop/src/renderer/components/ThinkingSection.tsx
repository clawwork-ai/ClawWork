import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import MarkdownContent from './MarkdownContent';

interface ThinkingSectionProps {
  content: string;
  defaultOpen?: boolean;
  streaming?: boolean;
  showCursor?: boolean;
}

export default function ThinkingSection({
  content,
  defaultOpen = false,
  streaming = false,
  showCursor = false,
}: ThinkingSectionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'type-support inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1',
          'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors',
        )}
      >
        <Brain size={12} className={cn('text-[var(--accent)] opacity-70', streaming && 'animate-pulse')} />
        <span>{t('chatMessage.thinkingProcess')}</span>
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={motionPresets.collapse.initial}
            animate={motionPresets.collapse.animate}
            exit={motionPresets.collapse.exit}
            transition={motionPresets.collapse.transition}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'type-support mt-1.5 rounded-lg px-3 py-2 leading-relaxed',
                'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                'border-l-2 border-[var(--accent)] border-opacity-30',
                'max-h-60 overflow-y-auto',
              )}
            >
              <MarkdownContent content={content} showCursor={showCursor} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
