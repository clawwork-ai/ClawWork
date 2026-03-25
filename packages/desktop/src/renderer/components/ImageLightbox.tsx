import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { motionDuration } from '@/styles/design-tokens';

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
}

export default function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [src, onClose]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionDuration.normal }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-scrim)] cursor-pointer"
          onClick={onClose}
        >
          <div className="absolute inset-4 flex items-center justify-center">
            <button
              onClick={onClose}
              className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)]/85 text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: motionDuration.normal }}
              src={src}
              alt=""
              className="max-w-full max-h-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
