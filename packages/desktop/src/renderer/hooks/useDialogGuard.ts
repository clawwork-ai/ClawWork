import { useState, useCallback } from 'react';

interface DialogGuardOptions {
  isDirty: () => boolean;
  onConfirmClose: () => void;
}

interface DialogGuardResult {
  confirmOpen: boolean;
  guardedOpenChange: (next: boolean) => void;
  contentProps: {
    onPointerDownOutside: (e: Event) => void;
    onEscapeKeyDown: (e: Event) => void;
  };
  confirmDiscard: () => void;
  cancelDiscard: () => void;
}

export function useDialogGuard({ isDirty, onConfirmClose }: DialogGuardOptions): DialogGuardResult {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const guardedOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      if (isDirty()) {
        setConfirmOpen(true);
      } else {
        onConfirmClose();
      }
    },
    [isDirty, onConfirmClose],
  );

  const preventWhenDirty = useCallback(
    (e: Event) => {
      if (isDirty()) e.preventDefault();
    },
    [isDirty],
  );

  const confirmDiscard = useCallback(() => {
    setConfirmOpen(false);
    onConfirmClose();
  }, [onConfirmClose]);

  const cancelDiscard = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  return {
    confirmOpen,
    guardedOpenChange,
    contentProps: {
      onPointerDownOutside: preventWhenDirty,
      onEscapeKeyDown: preventWhenDirty,
    },
    confirmDiscard,
    cancelDiscard,
  };
}
