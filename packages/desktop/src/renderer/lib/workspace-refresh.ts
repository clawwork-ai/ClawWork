import { hydrateFromLocal, resetHydration, syncFromGateway } from '../lib/session-sync';
import { useApprovalStore } from '../stores/approvalStore';
import { useFileStore } from '../stores/fileStore';
import { useMessageStore, useRoomStore, useTaskStore, useUiStore } from '../platform';

/** Clear renderer caches and reload tasks/messages from the new workspace DB. */
export async function refreshWorkspaceData(): Promise<void> {
  resetHydration();
  useTaskStore.getState().resetForWorkspaceChange();
  useMessageStore.getState().resetForWorkspaceChange();
  useRoomStore.getState().resetForWorkspaceChange();
  useFileStore.getState().resetForWorkspaceChange();
  useApprovalStore.getState().clear();
  useUiStore.setState({ unreadTaskIds: new Set(), mainView: 'chat', settingsOpen: false });

  await hydrateFromLocal();
  await syncFromGateway();
}
