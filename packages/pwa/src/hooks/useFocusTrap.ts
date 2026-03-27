import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  initialFocusSelector?: string,
): void {
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    prevFocusRef.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !containerRef.current) return;
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const target = initialFocusSelector ? container.querySelector<HTMLElement>(initialFocusSelector) : null;
      const fallback = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (target ?? fallback)?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevFocusRef.current?.focus();
    };
  }, [open, onClose, containerRef, initialFocusSelector]);
}
