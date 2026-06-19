import { useEffect } from 'react';
import { refreshWorkspaceData } from '../lib/workspace-refresh';
import { useSettingsStore } from '../stores/settingsStore';

/** Re-hydrate renderer stores when the main process switches workspace DB. */
export function useWorkspaceRefresh(): void {
  const refreshSettings = useSettingsStore((s) => s.refresh);

  useEffect(() => {
    const cleanup = window.clawwork.onWorkspaceChanged((payload) => {
      void refreshSettings()
        .catch((err) => console.error('[workspace] refreshSettings failed:', err))
        .then(() => refreshWorkspaceData())
        .catch((err) => console.error('[workspace] refreshWorkspaceData failed:', err));
      console.info('[workspace] switched to', payload.workspacePath);
    });
    return cleanup;
  }, [refreshSettings]);
}
