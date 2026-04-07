import { createStore } from 'zustand/vanilla';
import type { Team, TeamAgent, IpcResult } from '@clawwork/shared';

export interface TeamStoreDeps {
  listTeams: () => Promise<IpcResult<Team[]>>;
  getTeam: (id: string) => Promise<IpcResult<Team | null>>;
  persistTeam: (team: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    gatewayId: string;
    source?: string;
    version?: string;
    hubSlug?: string;
    agents: Array<{ agentId: string; role?: string; isManager?: boolean }>;
    createdAt: string;
    updatedAt: string;
  }) => Promise<IpcResult>;
  deleteTeam: (id: string) => Promise<IpcResult>;
}

export interface TeamState {
  teams: Record<string, Team>;
  loading: boolean;
  loadTeams(): Promise<void>;
  createTeam(params: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateTeam(id: string, updates: Partial<Team>): Promise<void>;
  deleteTeam(id: string): Promise<void>;
  addAgentToTeam(teamId: string, agent: TeamAgent): Promise<void>;
  removeAgentFromTeam(teamId: string, agentId: string): Promise<void>;
  setManager(teamId: string, agentId: string, isManager: boolean): Promise<void>;
}

export function createTeamStore(deps: TeamStoreDeps) {
  const store = createStore<TeamState>((set, get) => ({
    teams: {},
    loading: false,

    loadTeams: async () => {
      set({ loading: true });
      try {
        const res = await deps.listTeams();
        if (res.ok && res.result) {
          const map: Record<string, Team> = {};
          for (const t of res.result) {
            map[t.id] = t;
          }
          set({ teams: map });
        }
      } catch (err) {
        console.error('[team-store] loadTeams failed:', err);
      } finally {
        set({ loading: false });
      }
    },

    createTeam: async (params) => {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const team: Team = {
        id,
        ...params,
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({ teams: { ...s.teams, [id]: team } }));
      const res = await deps.persistTeam({
        id: team.id,
        name: team.name,
        emoji: team.emoji,
        description: team.description,
        gatewayId: team.gatewayId,
        source: team.source,
        version: team.version,
        hubSlug: team.hubSlug,
        agents: team.agents,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      });
      if (!res.ok) {
        console.error('[team-store] persistTeam failed:', res.error);
      }
      return id;
    },

    updateTeam: async (id, updates) => {
      const existing = get().teams[id];
      if (!existing) return;
      const now = new Date().toISOString();
      const updated: Team = { ...existing, ...updates, updatedAt: now };
      set((s) => ({ teams: { ...s.teams, [id]: updated } }));
      const res = await deps.persistTeam({
        id: updated.id,
        name: updated.name,
        emoji: updated.emoji,
        description: updated.description,
        gatewayId: updated.gatewayId,
        source: updated.source,
        version: updated.version,
        hubSlug: updated.hubSlug,
        agents: updated.agents,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      });
      if (!res.ok) {
        console.error('[team-store] updateTeam persist failed:', res.error);
      }
    },

    deleteTeam: async (id) => {
      set((s) => {
        const next = { ...s.teams };
        delete next[id];
        return { teams: next };
      });
      const res = await deps.deleteTeam(id);
      if (!res.ok) {
        console.error('[team-store] deleteTeam failed:', res.error);
      }
    },

    addAgentToTeam: async (teamId, agent) => {
      const existing = get().teams[teamId];
      if (!existing) return;
      if (existing.agents.some((a) => a.agentId === agent.agentId)) return;
      const updated: Team = { ...existing, agents: [...existing.agents, agent] };
      await get().updateTeam(teamId, { agents: updated.agents });
    },

    removeAgentFromTeam: async (teamId, agentId) => {
      const existing = get().teams[teamId];
      if (!existing) return;
      const updated: Team = { ...existing, agents: existing.agents.filter((a) => a.agentId !== agentId) };
      await get().updateTeam(teamId, { agents: updated.agents });
    },

    setManager: async (teamId, agentId, isManager) => {
      const existing = get().teams[teamId];
      if (!existing) return;
      const agents = existing.agents.map((a) => (a.agentId === agentId ? { ...a, isManager } : a));
      await get().updateTeam(teamId, { agents });
    },
  }));

  return store;
}
