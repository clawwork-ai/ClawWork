export type {
  PlatformPorts,
  PersistencePort,
  GatewayTransportPort,
  SettingsPort,
  NotificationsPort,
} from './ports/platform.js';

export type { PersistedTask, PersistedMessage, ListResult } from './ports/persistence.js';

export type {
  GatewayEvent,
  GatewayStatusEvent,
  GatewayStatusInfo,
  GatewayStatusMap,
  GatewayListItem,
  DiscoveredSession,
  SyncResult,
  ChatAttachment,
} from './ports/gateway-transport.js';

export type { AppSettings, NotificationSettings } from './ports/settings.js';

export type {
  ChatContentBlock,
  ChatMessage,
  ChatEventPayload,
  RawContentBlock,
  RawHistoryMessage,
  NormalizedAssistantTurn,
  DiscoveredMessageShape,
} from './protocol/types.js';

export {
  extractText,
  extractThinking,
  extractToolCalls,
  parseToolArgs,
  safeJsonParse,
} from './protocol/parse-content.js';

export {
  INTERNAL_ASSISTANT_MARKERS,
  sanitizeModel,
  isVisibleAssistantContent,
  normalizeAssistantTurns,
  collapseDiscoveredMessages,
} from './protocol/normalize-history.js';

export {
  createMessageStore,
  mergeCanonicalMessageWithActiveTurn,
  activeTurnToMessage,
  EMPTY_MESSAGES,
} from './stores/message-store.js';
export type { MessageState, MessageStoreDeps, ActiveTurn } from './stores/message-store.js';

export { createTaskStore } from './stores/task-store.js';
export type { TaskState, TaskStoreDeps, PendingNewTask } from './stores/task-store.js';

export { createUiStore } from './stores/ui-store.js';
export type {
  UiState,
  UiStoreDeps,
  MainView,
  Theme,
  DensityMode,
  SendShortcut,
  MessageLayout,
  PanelShortcutLeft,
  PanelShortcutRight,
  GatewayConnectionStatus,
  GatewayInfo,
} from './stores/ui-store.js';

export { createSessionSync } from './services/session-sync.js';
export type { SessionSyncDeps } from './services/session-sync.js';

export { buildAppError, formatErrorForUser, formatErrorForToast } from './services/error-classify.js';
export type { TranslateFn } from './services/error-classify.js';

export { autoTitleIfNeeded } from './services/auto-title.js';

export { createGatewayDispatcher } from './services/gateway-dispatcher.js';
export type { GatewayDispatcherDeps } from './services/gateway-dispatcher.js';

export { createChatComposer } from './services/chat-composer.js';
export type { ChatComposerDeps, ChatComposer, SendOptions } from './services/chat-composer.js';
