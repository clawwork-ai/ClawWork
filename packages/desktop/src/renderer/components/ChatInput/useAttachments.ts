import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { PendingAttachment } from './types';
import { processAttachmentFiles } from './utils';

export function useAttachments() {
  const { t } = useTranslation();
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  useEffect(() => {
    return () => {
      pendingAttachments.forEach((att) => URL.revokeObjectURL(att.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only on unmount
  }, []);

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const accepted = processAttachmentFiles(Array.from(files), t);
      if (accepted.length) {
        setPendingAttachments((prev) => [...prev, ...accepted]);
      }
      e.target.value = '';
    },
    [t],
  );

  const removeAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (!pastedFiles.length) return;
      e.preventDefault();

      const accepted = processAttachmentFiles(pastedFiles, t);
      if (accepted.length) {
        setPendingAttachments((prev) => [...prev, ...accepted]);
      }
    },
    [t],
  );

  return { pendingAttachments, setPendingAttachments, handleFileSelect, removeAttachment, handlePaste };
}
