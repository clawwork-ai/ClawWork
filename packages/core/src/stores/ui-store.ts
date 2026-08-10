import { createStore } from 'zustand/vanilla';
import type { AgentInfo, CommandEntry, ModelCatalogEntry, SkillStatusReport, ToolsCatalog } from '@clawwork/shared';
import { applyGatewayPatch, emptyGatewayState, patchGatewayState } from './ui-store-gateway.js';

export type MainView = 'chat' | 'files' | 'archived' | 'cron' | 'teams' | 'dashboard';
export type Theme = 'dark' | 'light' | 'auto';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type SendShortcut = 'enter' | 'cmdEnter';
export type MessageLayout = 'centered' | 'wide';
export type PanelShortcutLeft = 'Comma' | 'BracketLeft';
export type PanelShortcutRight = 'Period' | 'BracketRight';
export interface GatewayInfo {
  id: string;
  name: string;
  color?: string;
}

export type GatewayConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface GatewayState {
  status: GatewayConnectionStatus;
  version?: string;
  reconnectInfo?: { attempt: number; max: number; gaveUp: boolean };
  info: GatewayInfo;
  models: ModelCatalogEntry[];
  agents: { agents: AgentInfo[]; defaultId: string };
  tools: ToolsCatalog | null;
  skills: SkillStatusReport | null;
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

  gatewayRegistry: Record<string, GatewayState>;
  updateGateway: (gatewayId: string, patch: Partial<GatewayState>) => void;
  getGatewayState: (gatewayId: string) => GatewayState;

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

  skillsStatusByGateway: Record<string, SkillStatusReport>;
  setSkillsStatusForGateway: (gatewayId: string, report: SkillStatusReport) => void;

  commandCatalogByGateway: Record<string, CommandEntry[]>;
  setCommandCatalogForGateway: (gatewayId: string, commands: CommandEntry[]) => void;

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
    setGatewayStatusByGateway: (gatewayId, status) => set((s) => patchGatewayState(s, gatewayId, { status })),

    gatewayRegistry: {},
    updateGateway: (gatewayId, patch) => set((s) => patchGatewayState(s, gatewayId, patch)),
    getGatewayState: (gatewayId) => get().gatewayRegistry[gatewayId] ?? emptyGatewayState(gatewayId),

    gatewayVersionMap: {},
    setGatewayVersion: (gatewayId, version) =>
      set((s) => {
        if (!version) {
          return patchGatewayState(s, gatewayId, { version: undefined });
        }
        if (s.gatewayVersionMap[gatewayId] === version) return s;
        return patchGatewayState(s, gatewayId, { version });
      }),

    gatewayReconnectInfo: {},
    setGatewayReconnectInfo: (gatewayId, info) =>
      set((s) =>
        patchGatewayState(s, gatewayId, {
          reconnectInfo: info === null ? undefined : info,
        }),
      ),

    gatewaysLoaded: false,
    setGatewaysLoaded: (loaded) => set({ gatewaysLoaded: loaded }),

    defaultGatewayId: null,
    setDefaultGatewayId: (id) => set({ defaultGatewayId: id }),

    gatewayInfoMap: {},
    setGatewayInfoMap: (map) =>
      set((s) => {
        let state: UiState = { ...s, gatewayInfoMap: map };
        for (const [id, info] of Object.entries(map)) {
          state = applyGatewayPatch(state, id, { info });
        }
        return state;
      }),

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
    setModelCatalogForGateway: (gatewayId, models) => set((s) => patchGatewayState(s, gatewayId, { models })),

    agentCatalogByGateway: {},
    setAgentCatalogForGateway: (gatewayId, agents, defaultId) =>
      set((s) => patchGatewayState(s, gatewayId, { agents: { agents, defaultId } })),

    toolsCatalogByGateway: {},
    setToolsCatalogForGateway: (gatewayId, catalog) => set((s) => patchGatewayState(s, gatewayId, { tools: catalog })),

    skillsStatusByGateway: {},
    setSkillsStatusForGateway: (gatewayId, report) => set((s) => patchGatewayState(s, gatewayId, { skills: report })),

    commandCatalogByGateway: {},
    setCommandCatalogForGateway: (gatewayId, commands) =>
      set((s) => ({
        commandCatalogByGateway: {
          ...s.commandCatalogByGateway,
          [gatewayId]: commands,
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
