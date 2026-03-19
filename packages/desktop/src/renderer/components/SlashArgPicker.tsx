import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ArgOption {
  value: string;
  label: string;
  detail?: string;
}

interface SlashArgPickerProps {
  commandName: string;
  options: ArgOption[];
  selectedIndex: number;
  onSelect: (option: ArgOption) => void;
  onHoverIndex: (index: number) => void;
  onClose: () => void;
}

export default function SlashArgPicker({
  commandName,
  options,
  selectedIndex,
  onSelect,
  onHoverIndex,
  onClose,
}: SlashArgPickerProps) {
  const selectedItemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {options.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
          <motion.div
            role="listbox"
            aria-label={`Options for /${commandName}`}
            className={cn(
              'absolute bottom-full left-0 right-0 mb-1 z-50',
              'surface-elevated rounded-xl overflow-hidden',
              'border border-[var(--border-subtle)]',
              'shadow-[var(--shadow-elevated)]',
            )}
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            <div className="px-4 py-1.5 border-b border-[var(--border-subtle)] text-xs text-[var(--fg-muted)]">
              <span className="font-mono text-[var(--accent)]">/{commandName}</span>
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
              {options.map((opt, index) => (
                <li
                  key={opt.value}
                  ref={index === selectedIndex ? selectedItemRef : undefined}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 cursor-pointer select-none',
                    'transition-colors duration-75',
                    index === selectedIndex
                      ? 'bg-[var(--accent-soft)] text-[var(--fg-primary)]'
                      : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg-primary)]',
                  )}
                  onMouseEnter={() => onHoverIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(opt);
                  }}
                >
                  <span className="font-mono text-sm font-medium shrink-0">{opt.label}</span>
                  {opt.detail && <span className="ml-auto text-xs text-[var(--fg-muted)] truncate">{opt.detail}</span>}
                </li>
              ))}
            </ul>
            <div className="px-4 py-1.5 border-t border-[var(--border-subtle)] flex gap-3 text-[11px] text-[var(--fg-muted)]">
              <span>
                <kbd className="font-mono">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="font-mono">↵</kbd> select
              </span>
              <span>
                <kbd className="font-mono">Esc</kbd> close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
