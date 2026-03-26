import {
  createMessageStore,
  createTaskStore,
  createUiStore,
  createChatComposer,
  createSessionSync,
  createGatewayDispatcher,
} from '@clawwork/core';
import type { PlatformPorts, ChatComposer } from '@clawwork/core';
import type { ModelCatalogEntry, AgentInfo, DebugEvent } from '@clawwork/shared';
import { ports } from '../platform/index.js';
import { getIdentity } from '../persistence/db.js';
import { getClient } from '../gateway/client.js';
import { reportDebugEvent } from '../lib/debug.js';
import i18next from 'i18next';
import { toast } from 'sonner';

function getPorts(): PlatformPorts {
  return ports;
}

const localStorageAdapter = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      reportDebugEvent({
        level: 'warn',
        domain: 'renderer',
        event: 'settings.storage.get.failed',
        data: { key },
        error: { message: err instanceof Error ? err.message : 'storage get failed' },
      });
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      reportDebugEvent({
        level: 'warn',
        domain: 'renderer',
        event: 'settings.storage.set.failed',
        data: { key },
        error: { message: err instanceof Error ? err.message : 'storage set failed' },
      });
    }
  },
};

const uiStoreApi = createUiStore({
  updateSettings: (partial) =>
    getPorts().settings.updateSettings(partial as Parameters<PlatformPorts['settings']['updateSettings']>[0]),
  changeLanguage: (lang) => {
    i18next.changeLanguage(lang);
  },
  storage: localStorageAdapter,
  getViewportWidth: () => (typeof window !== 'undefined' ? window.innerWidth : 0),
});

const messageStoreApi = createMessageStore({
  persistMessage: (...args) => getPorts().persistence.persistMessage(...args),
});

const taskStoreApi = createTaskStore({
  persistTask: (...args) => getPorts().persistence.persistTask(...args),
  persistTaskUpdate: (...args) => getPorts().persistence.persistTaskUpdate(...args),
  deleteTask: (...args) => getPorts().persistence.deleteTask(...args),
  loadTasks: () => getPorts().persistence.loadTasks(),
  patchSession: (...args) => getPorts().gateway.patchSession(...args),
  getDeviceId: async () => {
    const identity = await getIdentity();
    if (!identity) throw new Error('Device identity not found');
    return identity.id;
  },
  getDefaultGatewayId: () => uiStoreApi.getState().defaultGatewayId,
  getAgentCatalog: (gatewayId) => {
    const entry = uiStoreApi.getState().agentCatalogByGateway[gatewayId];
    return entry ? { agents: entry.agents, defaultId: entry.defaultId } : { agents: [], defaultId: null };
  },
  onTaskCreated: () => uiStoreApi.getState().setMainView('chat'),
});

uiStoreApi.subscribe((state, prevState) => {
  if (state.defaultGatewayId === prevState.defaultGatewayId) return;
  const gatewayId = state.defaultGatewayId;
  if (!gatewayId) return;
  const entry = state.agentCatalogByGateway[gatewayId];
  const agentId = entry?.defaultId;
  if (!agentId) return;
  const pending = taskStoreApi.getState().pendingNewTask;
  if (!pending) return;
  if (pending.gatewayId !== gatewayId) return;
  if (pending.agentId === agentId) return;
  taskStoreApi.setState({ pendingNewTask: { gatewayId, agentId } });
});

const sessionSync = createSessionSync({
  persistence: {
    loadMessages: (taskId) => getPorts().persistence.loadMessages(taskId),
    persistMessage: (...args) => getPorts().persistence.persistMessage(...args),
  },
  gateway: {
    chatHistory: (...args) => getPorts().gateway.chatHistory(...args),
    syncSessions: () => getPorts().gateway.syncSessions(),
  },
  getTaskStore: () => taskStoreApi.getState(),
  getMessageStore: () => ({
    ...messageStoreApi.getState(),
    setState: messageStoreApi.setState,
  }),
});

export const composerBridge = {
  markAbortedByUser: (_taskId: string): void => {},
};

let _dispatcher: ReturnType<typeof createGatewayDispatcher> | null = null;
let hydrationReady: Promise<void> | null = null;

function ensureHydrationReady(): Promise<void> {
  if (!hydrationReady) {
    hydrationReady = sessionSync.hydrateFromLocal();
  }
  return hydrationReady;
}

function getDispatcher() {
  if (!_dispatcher) {
    _dispatcher = createGatewayDispatcher({
      gateway: getPorts().gateway,
      getSettings: () => getPorts().settings.getSettings(),
      sendNotification: (params) => getPorts().notifications.sendNotification(params),
      getTaskStore: () => taskStoreApi.getState(),
      getMessageStore: () => messageStoreApi.getState(),
      getActiveTaskId: () => taskStoreApi.getState().activeTaskId,
      markUnread: (taskId) => uiStoreApi.getState().markUnread(taskId),
      setGatewayStatusByGateway: (gwId, status) => uiStoreApi.getState().setGatewayStatusByGateway(gwId, status),
      setGatewayVersion: (gwId, version) => uiStoreApi.getState().setGatewayVersion(gwId, version),
      setGatewayReconnectInfo: (gwId, info) => uiStoreApi.getState().setGatewayReconnectInfo(gwId, info),
      setDefaultGatewayId: (id) => uiStoreApi.getState().setDefaultGatewayId(id),
      setGatewayInfoMap: (map) => uiStoreApi.getState().setGatewayInfoMap(map),
      setGatewaysLoaded: (loaded) => uiStoreApi.getState().setGatewaysLoaded(loaded),
      getGatewayInfoMap: () => uiStoreApi.getState().gatewayInfoMap,
      setModelCatalogForGateway: (gwId, models) =>
        uiStoreApi.getState().setModelCatalogForGateway(gwId, models as ModelCatalogEntry[]),
      setAgentCatalogForGateway: (gwId, agents, defaultId) =>
        uiStoreApi.getState().setAgentCatalogForGateway(gwId, agents as AgentInfo[], defaultId),
      setToolsCatalogForGateway: (gwId, catalog) => uiStoreApi.getState().setToolsCatalogForGateway(gwId, catalog),
      translate: (key, opts) => i18next.t(key, opts),
      isWindowFocused: () => typeof document !== 'undefined' && document.hasFocus(),
      reportDebugEvent: (event) => reportDebugEvent(event as Partial<DebugEvent>),
      hydrateFromLocal: () => ensureHydrationReady(),
      syncFromGateway: () => sessionSync.syncFromGateway(),
      syncSessionMessages: (taskId) => sessionSync.syncSessionMessages(taskId),
      retrySyncPending: () => sessionSync.retrySyncPending(),
    });
  }
  return _dispatcher;
}

export const dispatcher = new Proxy({} as ReturnType<typeof createGatewayDispatcher>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDispatcher(), prop, receiver);
  },
});

let _composer: ChatComposer | null = null;

function getComposer(): ChatComposer {
  if (!_composer) {
    _composer = createChatComposer({
      gateway: getPorts().gateway,
      getTaskStore: () => taskStoreApi.getState(),
      getMessageStore: () => messageStoreApi.getState(),
      persistMessage: (...args) => getPorts().persistence.persistMessage(...args),
      markAbortedByUser: (taskId) => composerBridge.markAbortedByUser(taskId),
      compactSession: (gwId, sk) => {
        const c = getClient(gwId);
        if (!c) return Promise.resolve({ ok: false, error: 'Gateway not found' });
        return c
          .compactSession(sk)
          .then(() => ({ ok: true as const }))
          .catch((err: Error) => ({ ok: false as const, error: err.message }));
      },
      resetSession: (gwId, sk, mode) => {
        const c = getClient(gwId);
        if (!c) return Promise.resolve({ ok: false, error: 'Gateway not found' });
        return c
          .resetSession(sk, mode)
          .then(() => ({ ok: true as const }))
          .catch((err: Error) => ({ ok: false as const, error: err.message }));
      },
      getModelProvider: (gwId, modelId) => {
        const catalog = uiStoreApi.getState().modelCatalogByGateway[gwId];
        return catalog?.find((m) => m.id === modelId)?.provider;
      },
      translate: (key, opts) => i18next.t(key, opts),
      onError: (payload) => {
        toast.error(payload.title, { description: payload.description });
      },
    });
  }
  return _composer;
}

export const composer = new Proxy({} as ChatComposer, {
  get(_target, prop, receiver) {
    return Reflect.get(getComposer(), prop, receiver);
  },
});

export { uiStoreApi, messageStoreApi, taskStoreApi, ensureHydrationReady };
