import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motionDuration, motionEase } from '@/styles/design-tokens';

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
  const { t } = useTranslation();
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
            aria-label={t('slash.argOptions', { command: commandName })}
            className={cn(
              'absolute bottom-full left-0 right-0 mb-1 z-50',
              'surface-elevated rounded-xl overflow-hidden',
              'border border-[var(--border-subtle)]',
              'shadow-[var(--shadow-elevated)]',
            )}
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: motionDuration.fast, ease: motionEase.exit }}
          >
            <div className="px-4 py-1.5 border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
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
                    'transition-colors',
                    index === selectedIndex
                      ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                  )}
                  style={{ transitionDuration: `${motionDuration.fast}s` }}
                  onMouseEnter={() => onHoverIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(opt);
                  }}
                >
                  <span className="font-mono text-sm font-medium shrink-0">{opt.label}</span>
                  {opt.detail && (
                    <span className="ml-auto text-xs text-[var(--text-muted)] truncate">{opt.detail}</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="px-4 py-1.5 border-t border-[var(--border-subtle)] flex gap-3 text-2xs text-[var(--text-muted)]">
              <span>
                <kbd className="font-mono">↑↓</kbd> {t('common.navigate')}
              </span>
              <span>
                <kbd className="font-mono">↵</kbd> {t('common.select')}
              </span>
              <span>
                <kbd className="font-mono">Esc</kbd> {t('common.close')}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
