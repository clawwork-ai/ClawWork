import { useCallback, useEffect } from 'react';
import { useUiStore, type PanelShortcutLeft, type PanelShortcutRight } from '../stores/uiStore';

interface KeyboardShortcutOptions {
  startNewTask: () => void;
  setMainView: (view: 'chat' | 'files') => void;
  toggleCommandPalette: () => void;
  leftNavShortcut: PanelShortcutLeft;
  rightPanelShortcut: PanelShortcutRight;
  toggleLeftNavCollapsed: () => void;
  toggleRightPanel: () => void;
}

export function useKeyboardShortcuts({
  startNewTask,
  setMainView,
  toggleCommandPalette,
  leftNavShortcut,
  rightPanelShortcut,
  toggleLeftNavCollapsed,
  toggleRightPanel,
}: KeyboardShortcutOptions): void {
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      if (e.shiftKey && e.code === 'KeyO') {
        e.preventDefault();
        startNewTask();
        return;
      }

      if (e.shiftKey && e.code === 'KeyF') {
        e.preventDefault();
        setMainView('files');
        return;
      }

      if (!e.shiftKey && e.code === 'KeyK') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      const leftCode = leftNavShortcut;
      const rightCode = rightPanelShortcut;

      if (!e.shiftKey && e.code === leftCode) {
        e.preventDefault();
        toggleLeftNavCollapsed();
        return;
      }

      if (!e.shiftKey && e.code === rightCode) {
        e.preventDefault();
        if (useUiStore.getState().mainView === 'chat') toggleRightPanel();
      }
    },
    [
      startNewTask,
      setMainView,
      toggleCommandPalette,
      leftNavShortcut,
      rightPanelShortcut,
      toggleLeftNavCollapsed,
      toggleRightPanel,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);
}
