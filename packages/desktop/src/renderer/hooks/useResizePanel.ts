import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizePanelOptions {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  storageKey?: string;
  side?: 'left' | 'right';
}

export function useResizePanel({
  defaultWidth,
  minWidth,
  maxWidth,
  storageKey,
  side = 'right',
}: UseResizePanelOptions) {
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (Number.isFinite(parsed) && parsed >= minWidth && parsed <= maxWidth) return parsed;
      }
    }
    return defaultWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const delta = side === 'right' ? startXRef.current - e.clientX : e.clientX - startXRef.current;
      const next = Math.round(Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta)));
      setWidth(next);
    },
    [minWidth, maxWidth, side],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isDragging) return;
    if (storageKey) localStorage.setItem(storageKey, String(width));
  }, [width, isDragging, storageKey]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setIsDragging(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width],
  );

  return { width, isDragging, handleMouseDown };
}
