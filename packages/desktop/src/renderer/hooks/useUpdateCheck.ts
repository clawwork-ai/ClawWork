import { useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';

export function useUpdateCheck(): void {
  const setHasUpdate = useUiStore((s) => s.setHasUpdate);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const result = await window.clawwork.checkForUpdates();
        if (result.hasUpdate) {
          setHasUpdate(true);
        }
      } catch (err) {
        console.error('[useUpdateCheck] check failed:', err);
        window.clawwork?.reportDebugEvent?.({
          domain: 'renderer',
          event: 'update-check-failed',
          data: { error: String(err) },
        });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [setHasUpdate]);
}
