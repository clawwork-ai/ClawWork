import { createStore, useStore } from 'zustand';

type CheckResult = 'idle' | 'up-to-date' | 'error' | 'unavailable';

interface SwUpdateState {
  updateAvailable: boolean;
  checking: boolean;
  checkResult: CheckResult;
  applyUpdate: (() => void) | null;
  registration: ServiceWorkerRegistration | null;
  setUpdateReady: (apply: () => void) => void;
  setRegistration: (reg: ServiceWorkerRegistration) => void;
  checkForUpdate: () => Promise<void>;
}

const UP_TO_DATE_DISPLAY_MS = 3000;
let upToDateTimer: ReturnType<typeof setTimeout> | undefined;

const swUpdateStore = createStore<SwUpdateState>((set, get) => ({
  updateAvailable: false,
  checking: false,
  checkResult: 'idle',
  applyUpdate: null,
  registration: null,
  setUpdateReady: (apply) => set({ updateAvailable: true, applyUpdate: apply, checkResult: 'idle' }),
  setRegistration: (reg) => set({ registration: reg }),
  checkForUpdate: async () => {
    const { registration } = get();
    if (!registration) {
      set({ checkResult: 'unavailable' });
      upToDateTimer = setTimeout(() => set({ checkResult: 'idle' }), UP_TO_DATE_DISPLAY_MS);
      return;
    }
    clearTimeout(upToDateTimer);
    set({ checking: true, checkResult: 'idle' });
    try {
      await registration.update();
      if (!get().updateAvailable) {
        set({ checkResult: 'up-to-date' });
        upToDateTimer = setTimeout(() => set({ checkResult: 'idle' }), UP_TO_DATE_DISPLAY_MS);
      }
    } catch {
      set({ checkResult: 'error' });
    } finally {
      set({ checking: false });
    }
  },
}));

export function useSwUpdateStore(): SwUpdateState;
export function useSwUpdateStore<T>(selector: (state: SwUpdateState) => T): T;
export function useSwUpdateStore<T>(selector?: (state: SwUpdateState) => T) {
  return selector ? useStore(swUpdateStore, selector) : useStore(swUpdateStore);
}
useSwUpdateStore.getState = swUpdateStore.getState;
useSwUpdateStore.setState = swUpdateStore.setState;

export { swUpdateStore };
