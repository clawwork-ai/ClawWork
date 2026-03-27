import { createStore } from 'zustand/vanilla';
import type { AgentInfo, ModelCatalogEntry, ToolsCatalog } from '@clawwork/shared';

export type MainView = 'chat' | 'files' | 'archived' | 'cron';
export type Theme = 'dark' | 'light' | 'auto';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type SendShortcut = 'enter' | 'cmdEnter';
export type MessageLayout = 'centered' | 'wide';
export type PanelShortcutLeft = 'Comma' | 'BracketLeft';
export type PanelShortcutRight = 'Period' | 'BracketRight';
export type GatewayConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface GatewayInfo {
  id: string;
  name: string;
  color?: string;
}

export interface UiState {
  rightPanelOpen: boolean;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;

  mainView: MainView;
  setMainView: (view: MainView) => void;

  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;

  density: DensityMode;
  setDensity: (density: DensityMode) => void;

  language: string;
  setLanguage: (lang: string) => void;

  gatewayStatusMap: Record<string, GatewayConnectionStatus>;
  setGatewayStatusByGateway: (gatewayId: string, status: GatewayConnectionStatus) => void;

  gatewayVersionMap: Record<string, string>;
  setGatewayVersion: (gatewayId: string, version: string | undefined) => void;

  gatewayReconnectInfo: Record<string, { attempt: number; max: number; gaveUp: boolean }>;
  setGatewayReconnectInfo: (gatewayId: string, info: { attempt: number; max: number; gaveUp: boolean } | null) => void;

  gatewaysLoaded: boolean;
  setGatewaysLoaded: (loaded: boolean) => void;

  defaultGatewayId: string | null;
  setDefaultGatewayId: (id: string | null) => void;

  gatewayInfoMap: Record<string, GatewayInfo>;
  setGatewayInfoMap: (map: Record<string, GatewayInfo>) => void;

  unreadTaskIds: Set<string>;
  markUnread: (taskId: string) => void;
  clearUnread: (taskId: string) => void;

  hasUpdate: boolean;
  setHasUpdate: (has: boolean) => void;

  modelCatalogByGateway: Record<string, ModelCatalogEntry[]>;
  setModelCatalogForGateway: (gatewayId: string, models: ModelCatalogEntry[]) => void;

  agentCatalogByGateway: Record<string, { agents: AgentInfo[]; defaultId: string }>;
  setAgentCatalogForGateway: (gatewayId: string, agents: AgentInfo[], defaultId: string) => void;

  toolsCatalogByGateway: Record<string, ToolsCatalog>;
  setToolsCatalogForGateway: (gatewayId: string, catalog: ToolsCatalog) => void;

  sendShortcut: SendShortcut;
  setSendShortcut: (shortcut: SendShortcut) => void;

  messageLayout: MessageLayout;
  setMessageLayout: (layout: MessageLayout) => void;
  toggleMessageLayout: () => void;

  searchFocusTrigger: number;
  focusSearch: () => void;

  getAgentsForGateway: (gatewayId: string) => { agents: AgentInfo[]; defaultId: string };

  leftNavCollapsed: boolean;
  toggleLeftNavCollapsed: () => void;

  leftNavWidth: number;
  setLeftNavWidth: (w: number) => void;

  rightPanelWidth: number;
  setRightPanelWidth: (w: number) => void;

  leftNavShortcut: PanelShortcutLeft;
  setLeftNavShortcut: (s: PanelShortcutLeft) => void;

  rightPanelShortcut: PanelShortcutRight;
  setRightPanelShortcut: (s: PanelShortcutRight) => void;

  devMode: boolean;
  setDevMode: (enabled: boolean) => void;

  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

export interface UiStoreDeps {
  updateSettings: (partial: Record<string, unknown>) => Promise<unknown>;
  changeLanguage: (lang: string) => void;
  onRebuildMenu?: () => void;
  storage: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
  };
  getViewportWidth?: () => number;
}

const EMPTY_AGENT_CATALOG = { agents: [] as AgentInfo[], defaultId: '' };

function lsWidth(
  storage: UiStoreDeps['storage'],
  key: string,
  min: number,
  max: number,
  vwFraction: number,
  getViewportWidth?: () => number,
): number {
  const stored = storage.get(key);
  if (stored) {
    const n = Number(stored);
    if (!isNaN(n) && n >= min && n <= max) return n;
  }
  const vw = getViewportWidth?.() ?? 0;
  return vw > 0 ? Math.min(max, Math.max(min, vw * vwFraction)) : min;
}

export function createUiStore(deps: UiStoreDeps) {
  const defaultLeftNavWidth = lsWidth(deps.storage, 'cw:leftNavWidth', 180, 400, 0.18, deps.getViewportWidth);
  const defaultRightPanelWidth = lsWidth(deps.storage, 'cw:rightPanelWidth', 240, 500, 0.2, deps.getViewportWidth);

  return createStore<UiState>((set, get) => ({
    rightPanelOpen: false,
    toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
    setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

    mainView: 'chat',
    setMainView: (view) => set({ mainView: view, settingsOpen: false }),

    settingsOpen: false,
    setSettingsOpen: (open) => set({ settingsOpen: open }),

    theme: 'auto',
    setTheme: (theme) => set({ theme }),

    density: 'comfortable',
    setDensity: (density) => set({ density }),

    language: 'en',
    setLanguage: (lang) => {
      deps.changeLanguage(lang);
      set({ language: lang });
      deps.updateSettings({ language: lang });
    },

    gatewayStatusMap: {},
    setGatewayStatusByGateway: (gatewayId, status) =>
      set((s) => ({
        gatewayStatusMap: { ...s.gatewayStatusMap, [gatewayId]: status },
      })),

    gatewayVersionMap: {},
    setGatewayVersion: (gatewayId, version) =>
      set((s) => {
        const current = s.gatewayVersionMap[gatewayId];
        if (!version) {
          if (current === undefined) return s;
          const next = { ...s.gatewayVersionMap };
          delete next[gatewayId];
          return { gatewayVersionMap: next };
        }
        if (current === version) return s;
        return { gatewayVersionMap: { ...s.gatewayVersionMap, [gatewayId]: version } };
      }),

    gatewayReconnectInfo: {},
    setGatewayReconnectInfo: (gatewayId, info) =>
      set((s) => {
        if (info === null) {
          const next = { ...s.gatewayReconnectInfo };
          delete next[gatewayId];
          return { gatewayReconnectInfo: next };
        }
        return { gatewayReconnectInfo: { ...s.gatewayReconnectInfo, [gatewayId]: info } };
      }),

    gatewaysLoaded: false,
    setGatewaysLoaded: (loaded) => set({ gatewaysLoaded: loaded }),

    defaultGatewayId: null,
    setDefaultGatewayId: (id) => set({ defaultGatewayId: id }),

    gatewayInfoMap: {},
    setGatewayInfoMap: (map) => set({ gatewayInfoMap: map }),

    unreadTaskIds: new Set(),
    markUnread: (taskId) =>
      set((s) => {
        const next = new Set(s.unreadTaskIds);
        next.add(taskId);
        return { unreadTaskIds: next };
      }),
    clearUnread: (taskId) =>
      set((s) => {
        const next = new Set(s.unreadTaskIds);
        next.delete(taskId);
        return { unreadTaskIds: next };
      }),

    hasUpdate: false,
    setHasUpdate: (has) => set({ hasUpdate: has }),

    modelCatalogByGateway: {},
    setModelCatalogForGateway: (gatewayId, models) =>
      set((s) => ({
        modelCatalogByGateway: {
          ...s.modelCatalogByGateway,
          [gatewayId]: models,
        },
      })),

    agentCatalogByGateway: {},
    setAgentCatalogForGateway: (gatewayId, agents, defaultId) =>
      set((s) => ({
        agentCatalogByGateway: {
          ...s.agentCatalogByGateway,
          [gatewayId]: { agents, defaultId },
        },
      })),

    toolsCatalogByGateway: {},
    setToolsCatalogForGateway: (gatewayId, catalog) =>
      set((s) => ({
        toolsCatalogByGateway: {
          ...s.toolsCatalogByGateway,
          [gatewayId]: catalog,
        },
      })),

    sendShortcut: 'enter',
    setSendShortcut: (shortcut) => {
      set({ sendShortcut: shortcut });
      deps.updateSettings({ sendShortcut: shortcut });
    },

    messageLayout: deps.storage.get('cw:messageLayout') === 'wide' ? 'wide' : 'centered',
    setMessageLayout: (layout) => {
      deps.storage.set('cw:messageLayout', layout);
      set({ messageLayout: layout });
    },
    toggleMessageLayout: () =>
      set((s) => {
        const next = s.messageLayout === 'centered' ? 'wide' : 'centered';
        deps.storage.set('cw:messageLayout', next);
        return { messageLayout: next };
      }),

    searchFocusTrigger: 0,
    focusSearch: () => set((s) => ({ searchFocusTrigger: s.searchFocusTrigger + 1 })),

    getAgentsForGateway: (gatewayId: string) => {
      const entry = get().agentCatalogByGateway[gatewayId];
      return entry ?? EMPTY_AGENT_CATALOG;
    },

    leftNavCollapsed: deps.storage.get('cw:leftNavCollapsed') === 'true',
    toggleLeftNavCollapsed: () =>
      set((s) => {
        const next = !s.leftNavCollapsed;
        deps.storage.set('cw:leftNavCollapsed', String(next));
        return { leftNavCollapsed: next };
      }),

    leftNavWidth: defaultLeftNavWidth,
    setLeftNavWidth: (w) => {
      const clamped = Math.min(400, Math.max(180, w));
      deps.storage.set('cw:leftNavWidth', String(clamped));
      set({ leftNavWidth: clamped });
    },

    rightPanelWidth: defaultRightPanelWidth,
    setRightPanelWidth: (w) => {
      const clamped = Math.min(500, Math.max(240, w));
      deps.storage.set('cw:rightPanelWidth', String(clamped));
      set({ rightPanelWidth: clamped });
    },

    leftNavShortcut: 'Comma',
    setLeftNavShortcut: (s) => {
      set({ leftNavShortcut: s });
      deps.updateSettings({ leftNavShortcut: s });
    },

    rightPanelShortcut: 'Period',
    setRightPanelShortcut: (s) => {
      set({ rightPanelShortcut: s });
      deps.updateSettings({ rightPanelShortcut: s });
    },

    devMode: false,
    setDevMode: (enabled) => {
      set({ devMode: enabled });
      deps.updateSettings({ devMode: enabled });
      deps.onRebuildMenu?.();
    },

    commandPaletteOpen: false,
    openCommandPalette: () => set({ commandPaletteOpen: true }),
    closeCommandPalette: () => set({ commandPaletteOpen: false }),
    toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  }));
}
