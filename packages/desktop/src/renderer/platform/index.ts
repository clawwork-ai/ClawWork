import { useStore } from 'zustand';
import { createMessageStore, createTaskStore, createUiStore } from '@clawwork/core';
import type { MessageState, TaskState, UiState, PlatformPorts } from '@clawwork/core';
import { createElectronPorts } from './electron-adapter';
import i18n from '../i18n';

let _ports: PlatformPorts | null = null;

function getPorts(): PlatformPorts {
  if (!_ports) _ports = createElectronPorts();
  return _ports;
}

export const ports = new Proxy({} as PlatformPorts, {
  get(_target, prop, receiver) {
    return Reflect.get(getPorts(), prop, receiver);
  },
});

const localStorageAdapter = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

const uiStoreApi = createUiStore({
  updateSettings: (partial) =>
    getPorts().settings.updateSettings(partial as Parameters<PlatformPorts['settings']['updateSettings']>[0]),
  changeLanguage: (lang) => i18n.changeLanguage(lang),
  onRebuildMenu: () => window.clawwork.rebuildMenu(),
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
  getDeviceId: () => window.clawwork.getDeviceId(),
  getDefaultGatewayId: () => uiStoreApi.getState().defaultGatewayId,
  getAgentCatalog: (gatewayId) => {
    const entry = uiStoreApi.getState().agentCatalogByGateway[gatewayId];
    return entry ? { agents: entry.agents, defaultId: entry.defaultId } : { agents: [], defaultId: null };
  },
  onTaskCreated: () => uiStoreApi.getState().setMainView('chat'),
});

export function useMessageStore(): MessageState;
export function useMessageStore<T>(selector: (state: MessageState) => T): T;
export function useMessageStore<T>(selector?: (state: MessageState) => T) {
  return useStore(messageStoreApi, selector!);
}
useMessageStore.getState = messageStoreApi.getState;
useMessageStore.setState = messageStoreApi.setState;
useMessageStore.subscribe = messageStoreApi.subscribe;

export function useTaskStore(): TaskState;
export function useTaskStore<T>(selector: (state: TaskState) => T): T;
export function useTaskStore<T>(selector?: (state: TaskState) => T) {
  return useStore(taskStoreApi, selector!);
}
useTaskStore.getState = taskStoreApi.getState;
useTaskStore.setState = taskStoreApi.setState;
useTaskStore.subscribe = taskStoreApi.subscribe;

export function useUiStore(): UiState;
export function useUiStore<T>(selector: (state: UiState) => T): T;
export function useUiStore<T>(selector?: (state: UiState) => T) {
  return useStore(uiStoreApi, selector!);
}
useUiStore.getState = uiStoreApi.getState;
useUiStore.setState = uiStoreApi.setState;
useUiStore.subscribe = uiStoreApi.subscribe;
