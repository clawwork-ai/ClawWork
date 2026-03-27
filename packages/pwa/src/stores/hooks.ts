import { useStore } from 'zustand';
import type { MessageState, TaskState, UiState } from '@clawwork/core';
import { messageStoreApi, taskStoreApi, uiStoreApi } from './index.js';

export function useMessageStore(): MessageState;
export function useMessageStore<T>(selector: (state: MessageState) => T): T;
export function useMessageStore<T>(selector?: (state: MessageState) => T) {
  return selector ? useStore(messageStoreApi, selector) : useStore(messageStoreApi);
}
useMessageStore.getState = messageStoreApi.getState;
useMessageStore.setState = messageStoreApi.setState;
useMessageStore.subscribe = messageStoreApi.subscribe;

export function useTaskStore(): TaskState;
export function useTaskStore<T>(selector: (state: TaskState) => T): T;
export function useTaskStore<T>(selector?: (state: TaskState) => T) {
  return selector ? useStore(taskStoreApi, selector) : useStore(taskStoreApi);
}
useTaskStore.getState = taskStoreApi.getState;
useTaskStore.setState = taskStoreApi.setState;
useTaskStore.subscribe = taskStoreApi.subscribe;

export function useUiStore(): UiState;
export function useUiStore<T>(selector: (state: UiState) => T): T;
export function useUiStore<T>(selector?: (state: UiState) => T) {
  return selector ? useStore(uiStoreApi, selector) : useStore(uiStoreApi);
}
useUiStore.getState = uiStoreApi.getState;
useUiStore.setState = uiStoreApi.setState;
useUiStore.subscribe = uiStoreApi.subscribe;
