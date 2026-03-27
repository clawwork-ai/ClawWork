import { type ReactNode, type RefObject, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motionDuration, motionEase } from '@/styles/design-tokens';

interface PopoverListBaseProps {
  open: boolean;
  onClose: () => void;
  header?: ReactNode;
  children: ReactNode;
  selectedIndex: number;
  selectedItemRef: RefObject<HTMLLIElement | null>;
  ariaLabel: string;
  className?: string;
}

export default function PopoverListBase({
  open,
  onClose,
  header,
  children,
  selectedIndex,
  selectedItemRef,
  ariaLabel,
  className,
}: PopoverListBaseProps) {
  const { t } = useTranslation();

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, selectedItemRef]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
          <motion.div
            role="listbox"
            aria-label={ariaLabel}
            className={cn(
              'absolute bottom-full left-0 right-0 mb-1 z-50',
              'glass-card rounded-xl overflow-hidden',
              className,
            )}
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: motionDuration.fast, ease: motionEase.exit }}
          >
            {header}
            <ul className="max-h-52 overflow-y-auto py-1">{children}</ul>
            <div className="type-meta flex gap-3 border-t border-[var(--border-subtle)] px-4 py-1.5 text-[var(--text-muted)]">
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

export function PopoverListItem({
  selected,
  onHover,
  onSelect,
  children,
  itemRef,
}: {
  selected: boolean;
  onHover: () => void;
  onSelect: () => void;
  children: ReactNode;
  itemRef?: RefObject<HTMLLIElement | null>;
}) {
  return (
    <li
      ref={itemRef}
      role="option"
      aria-selected={selected}
      className={cn(
        'flex items-center gap-3 px-4 py-2 cursor-pointer select-none transition-colors',
        selected
          ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
      )}
      style={{ transitionDuration: `${motionDuration.fast}s` }}
      onMouseEnter={onHover}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
    >
      {children}
    </li>
  );
}
