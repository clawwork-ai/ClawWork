import { create } from 'zustand';
import type { UsageStatus, CostUsageSummary, SessionCostSummary } from '@clawwork/shared';

const REFRESH_INTERVAL_MS = 60_000;
const INSTANCE_CACHE_MS = 30_000;

interface UsageState {
  status: UsageStatus | null;
  cost: CostUsageSummary | null;
  sessionUsage: SessionCostSummary | null;
  loading: boolean;
  error: string | null;

  fetchUsage: (gatewayId: string, sessionKey?: string) => Promise<void>;
  startAutoRefresh: (gatewayId: string, sessionKey?: string) => void;
  stopAutoRefresh: () => void;
  clear: () => void;
}

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let instanceFetchedAt = 0;

export const useUsageStore = create<UsageState>((set, get) => ({
  status: null,
  cost: null,
  sessionUsage: null,
  loading: false,
  error: null,

  fetchUsage: async (gatewayId: string, sessionKey?: string) => {
    if (!gatewayId) return;
    if (
      typeof window.clawwork.getUsageStatus !== 'function' ||
      typeof window.clawwork.getUsageCost !== 'function' ||
      (sessionKey && typeof window.clawwork.getSessionUsage !== 'function')
    ) {
      set({ loading: false, error: null, sessionUsage: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const skipInstance = Date.now() - instanceFetchedAt < INSTANCE_CACHE_MS && get().status != null;

      const promises: Promise<{ ok: boolean; result?: Record<string, unknown>; error?: string }>[] = [];
      if (!skipInstance) {
        promises.push(window.clawwork.getUsageStatus(gatewayId), window.clawwork.getUsageCost(gatewayId, { days: 30 }));
      }
      if (sessionKey) {
        promises.push(window.clawwork.getSessionUsage(gatewayId, sessionKey));
      }

      const results = await Promise.all(promises);
      const updates: Partial<UsageState> = { loading: false };

      if (!skipInstance) {
        const [statusRes, costRes] = results;
        if (statusRes.ok && statusRes.result) {
          updates.status = statusRes.result as unknown as UsageStatus;
        }
        if (costRes.ok && costRes.result) {
          updates.cost = costRes.result as unknown as CostUsageSummary;
        }
        if (!statusRes.ok && !costRes.ok) {
          updates.error = statusRes.error ?? costRes.error ?? 'fetch failed';
        }
        instanceFetchedAt = Date.now();
      }

      const sessionRes = skipInstance ? results[0] : results[2];
      if (sessionRes?.ok && sessionRes.result) {
        const r = sessionRes.result as unknown as { sessions?: { usage: SessionCostSummary | null }[] };
        updates.sessionUsage = r.sessions?.[0]?.usage ?? null;
      } else if (!sessionKey) {
        updates.sessionUsage = null;
      }

      set(updates);
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'fetch failed',
      });
    }
  },

  startAutoRefresh: (gatewayId: string, sessionKey?: string) => {
    get().stopAutoRefresh();
    set({ sessionUsage: null });
    get().fetchUsage(gatewayId, sessionKey);
    refreshTimer = setInterval(() => {
      get().fetchUsage(gatewayId, sessionKey);
    }, REFRESH_INTERVAL_MS);
  },

  stopAutoRefresh: () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  },

  clear: () => {
    get().stopAutoRefresh();
    instanceFetchedAt = 0;
    set({ status: null, cost: null, sessionUsage: null, loading: false, error: null });
  },
}));
