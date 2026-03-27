import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useDragControls } from 'framer-motion';
import { useOverlay } from '../hooks/useOverlay';

const SPRING = { type: 'spring' as const, damping: 25, stiffness: 300 };
const INSTANT = { duration: 0 };
const DRAG_DISMISS_OFFSET = 100;
const DRAG_DISMISS_VELOCITY = 500;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  maxHeight?: string;
  children: ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export function BottomSheet({
  open,
  onClose,
  maxHeight = '60vh',
  children,
  ariaLabel,
  ariaLabelledBy,
}: BottomSheetProps) {
  const { portalTarget, containerRef, reducedMotion, handleKeyDown } = useOverlay(open, onClose);
  const dragControls = useDragControls();
  const transition = reducedMotion ? INSTANT : SPRING;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <m.div
            key="bs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 surface-overlay"
            onClick={onClose}
            aria-hidden="true"
          />
          <m.div
            key="bs-sheet"
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={transition}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > DRAG_DISMISS_OFFSET || info.velocity.y > DRAG_DISMISS_VELOCITY) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl outline-none"
            style={{ backgroundColor: 'var(--bg-secondary)', maxHeight }}
          >
            <div
              className="flex justify-center pt-2 pb-1"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: 'none' }}
            >
              <div className="h-1 w-9 rounded-full" style={{ backgroundColor: 'var(--text-muted)', opacity: 0.4 }} />
            </div>
            {children}
            <div className="safe-area-bottom" />
          </m.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget,
  );
}
