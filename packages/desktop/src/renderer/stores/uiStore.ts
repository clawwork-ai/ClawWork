import { create } from 'zustand';
import type { AgentInfo, ModelCatalogEntry, ToolsCatalog } from '@clawwork/shared';
import i18n from '../i18n';

type MainView = 'chat' | 'files' | 'archived' | 'cron';

export type Theme = 'dark' | 'light' | 'auto';

export type Language = 'en' | 'zh';

export type SendShortcut = 'enter' | 'cmdEnter';

export type PanelShortcutLeft = 'Comma' | 'BracketLeft';
export type PanelShortcutRight = 'Period' | 'BracketRight';

export type GatewayConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface GatewayInfo {
  id: string;
  name: string;
  color?: string;
}

function ls(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function lsWidth(key: string, min: number, max: number, vwFraction: number): number {
  const stored = ls(key);
  if (stored) {
    const n = Number(stored);
    if (!isNaN(n) && n >= min && n <= max) return n;
  }
  return typeof window === 'undefined' ? min : Math.min(max, Math.max(min, window.innerWidth * vwFraction));
}

interface UiState {
  rightPanelOpen: boolean;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;

  mainView: MainView;
  setMainView: (view: MainView) => void;

  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;

  language: Language;
  setLanguage: (lang: Language) => void;

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
}

const EMPTY_AGENT_CATALOG = { agents: [] as AgentInfo[], defaultId: '' };

export const useUiStore = create<UiState>((set, get) => ({
  rightPanelOpen: false,
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  mainView: 'chat',
  setMainView: (view) => set({ mainView: view, settingsOpen: false }),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  theme: 'auto',
  setTheme: (theme) => set({ theme }),

  language: 'en',
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
    window.clawwork.updateSettings({ language: lang });
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
    window.clawwork.updateSettings({ sendShortcut: shortcut });
  },

  searchFocusTrigger: 0,
  focusSearch: () => set((s) => ({ searchFocusTrigger: s.searchFocusTrigger + 1 })),

  getAgentsForGateway: (gatewayId: string) => {
    const entry = get().agentCatalogByGateway[gatewayId];
    return entry ?? EMPTY_AGENT_CATALOG;
  },

  leftNavCollapsed: ls('cw:leftNavCollapsed') === 'true',
  toggleLeftNavCollapsed: () =>
    set((s) => {
      const next = !s.leftNavCollapsed;
      lsSet('cw:leftNavCollapsed', String(next));
      return { leftNavCollapsed: next };
    }),

  leftNavWidth: lsWidth('cw:leftNavWidth', 180, 400, 0.18),
  setLeftNavWidth: (w) => {
    const clamped = Math.min(400, Math.max(180, w));
    lsSet('cw:leftNavWidth', String(clamped));
    set({ leftNavWidth: clamped });
  },

  rightPanelWidth: lsWidth('cw:rightPanelWidth', 240, 500, 0.2),
  setRightPanelWidth: (w) => {
    const clamped = Math.min(500, Math.max(240, w));
    lsSet('cw:rightPanelWidth', String(clamped));
    set({ rightPanelWidth: clamped });
  },

  leftNavShortcut: 'Comma',
  setLeftNavShortcut: (s) => {
    set({ leftNavShortcut: s });
    window.clawwork.updateSettings({ leftNavShortcut: s });
  },

  rightPanelShortcut: 'Period',
  setRightPanelShortcut: (s) => {
    set({ rightPanelShortcut: s });
    window.clawwork.updateSettings({ rightPanelShortcut: s });
  },
}));
