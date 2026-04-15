import { create } from 'zustand';
import type { ClawDashboardData } from '@clawwork/shared';

const STALE_MS = 60_000;

interface DashboardState {
  data: ClawDashboardData | null;
  loading: boolean;
  loadedAt: number | null;
  fetch: (force?: boolean) => Promise<void>;
  clear: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: false,
  loadedAt: null,

  fetch: async (force = false) => {
    const state = get();
    if (state.loading) return;
    if (!force && state.loadedAt && Date.now() - state.loadedAt < STALE_MS) return;
    set({ loading: true });
    try {
      const res = await window.clawwork.loadDashboardStats();
      if (res.ok && res.result) {
        set({ data: res.result, loading: false, loadedAt: Date.now() });
      } else {
        console.error('[dashboardStore] fetch failed:', res.error);
        set({ loading: false });
      }
    } catch (err) {
      console.error('[dashboardStore] fetch threw:', err);
      set({ loading: false });
    }
  },

  clear: () => set({ data: null, loading: false, loadedAt: null }),
}));
