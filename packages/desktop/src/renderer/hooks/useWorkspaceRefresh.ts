import { useEffect } from 'react';
import { refreshRendererAfterWorkspaceChange } from '../lib/workspace-refresh';

export function useWorkspaceRefresh(): void {
  useEffect(() => {
    return window.clawwork.onWorkspaceChanged(() => {
      void refreshRendererAfterWorkspaceChange();
    });
  }, []);
}
