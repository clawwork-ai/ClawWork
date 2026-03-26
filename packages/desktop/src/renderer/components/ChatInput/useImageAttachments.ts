import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { PendingImage } from './types';
import { processImageFiles } from './utils';

export function useImageAttachments() {
  const { t } = useTranslation();
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only on unmount
  }, []);

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const accepted = processImageFiles(Array.from(files), t);
      if (accepted.length) {
        setPendingImages((prev) => [...prev, ...accepted]);
      }
      e.target.value = '';
    },
    [t],
  );

  const removeImage = useCallback((index: number) => {
    setPendingImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (!imageFiles.length) return;
      e.preventDefault();

      const accepted = processImageFiles(imageFiles, t);
      if (accepted.length) {
        setPendingImages((prev) => [...prev, ...accepted]);
      }
    },
    [t],
  );

  return { pendingImages, setPendingImages, handleFileSelect, removeImage, handlePaste };
}
