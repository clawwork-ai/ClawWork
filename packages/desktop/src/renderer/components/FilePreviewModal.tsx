import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileCode, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion as motionPresets, motionDuration } from '@/styles/design-tokens';

interface FilePreviewModalProps {
  file: { path: string; content: string } | null;
  onClose: () => void;
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [file, onClose]);

  const handleCopy = useCallback(() => {
    if (!file) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [file]);

  const fileName = file?.path.split('/').pop() ?? '';
  const lineCount = file?.content.split('\n').length ?? 0;

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionDuration.normal }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-scrim)]"
          onClick={onClose}
        >
          <div className="absolute inset-4 flex items-center justify-center">
            <motion.div
              {...motionPresets.dialogEnter}
              className={cn(
                'relative flex w-full max-w-4xl max-h-full flex-col',
                'glass-heavy rounded-xl border border-[var(--border-subtle)]',
                'shadow-[var(--shadow-floating)] overflow-hidden',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-subtle)] flex-shrink-0">
                <FileCode size={16} className="text-[var(--accent)]" />
                <div className="flex-1 min-w-0">
                  <span className="type-label block truncate text-[var(--text-primary)]">{fileName}</span>
                  <span className="type-support text-[var(--text-muted)]">
                    {file.path} · {lineCount} lines
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className={cn(
                    'type-support flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors',
                    'hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  )}
                >
                  {copied ? <Check size={12} className="text-[var(--accent)]" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <pre className="type-code-block whitespace-pre-wrap break-words px-4 py-3 leading-relaxed text-[var(--text-primary)]">
                  {file.content}
                </pre>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
