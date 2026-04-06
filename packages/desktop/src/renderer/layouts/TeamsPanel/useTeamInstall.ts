import { useState, useCallback } from 'react';
import type { InstallEvent, AgentCreateResponse, SkillInstallResult, IpcResult } from '@clawwork/shared';
import type { InstallerDeps } from '@clawwork/core';
import { installTeam, serializeIdentityMd } from '@clawwork/core';
import { toSlug } from './utils';
import type { TeamInfo, AgentDraft } from './types';

type InstallStatus = 'idle' | 'installing' | 'done' | 'error';

export function useTeamInstall(onDone?: () => void) {
  const [installStatus, setInstallStatus] = useState<InstallStatus>('idle');
  const [installEvents, setInstallEvents] = useState<InstallEvent[]>([]);

  const resetInstall = useCallback(() => {
    setInstallStatus('idle');
    setInstallEvents([]);
  }, []);

  const runInstall = useCallback(
    async (teamInfo: TeamInfo, agents: AgentDraft[], editContext?: { teamId: string; createdAt: string }) => {
      setInstallStatus('installing');
      setInstallEvents([]);

      const parsed = {
        name: teamInfo.name.trim(),
        description: teamInfo.description.trim(),
        version: '1.0.0',
        agents: agents.map((a) => ({
          id: toSlug(a.name),
          name: a.name.trim(),
          role: a.role,
        })),
        body: '',
      };

      const existingMap = new Map<string, string>();
      const existingAgentIds = new Set<string>();
      for (const a of agents) {
        if (a.existingAgentId) {
          existingMap.set(toSlug(a.name), a.existingAgentId);
          existingAgentIds.add(a.existingAgentId);
        }
      }

      const agentFiles: Record<string, { agentMd?: string; soulMd?: string; skillsJson?: string }> = {};
      for (const a of agents) {
        const slug = toSlug(a.name);
        const files: { agentMd?: string; soulMd?: string; skillsJson?: string } = {};
        if (!a.existingAgentId) {
          const identity = serializeIdentityMd(a.description, a.agentMd.trim());
          if (identity) files.agentMd = identity;
          if (a.soulMd.trim()) files.soulMd = a.soulMd.trim();
        }
        if (a.skills.length > 0) {
          const skillsObj: Record<string, { source: string; sourceType: string }> = {};
          for (const s of a.skills) skillsObj[s] = { source: s, sourceType: 'clawhub' };
          files.skillsJson = JSON.stringify({ version: 1, skills: skillsObj });
        }
        agentFiles[slug] = files;
      }

      const agentModelMap = new Map<string, string>();
      for (const a of agents) {
        if (a.model) agentModelMap.set(toSlug(a.name), a.model);
      }

      const gwId = teamInfo.gatewayId;
      const deps: InstallerDeps = {
        createAgent: async (params) => {
          const slug = toSlug(params.name);
          const existingId = existingMap.get(slug);
          if (existingId) {
            return { ok: true, result: { agentId: existingId, name: params.name, workspace: '' } };
          }
          const res = await window.clawwork.createAgent(gwId, params);
          if (!res.ok || !res.result) return { ok: false, error: res.error } as IpcResult<AgentCreateResponse>;
          const r = res.result as Record<string, unknown>;
          return { ok: true, result: r as unknown as AgentCreateResponse };
        },
        deleteAgent: (params) => {
          if (existingAgentIds.has(params.agentId)) return Promise.resolve({ ok: true } as IpcResult);
          return window.clawwork.deleteAgent(gwId, params);
        },
        setAgentFile: (agentId, name, content) => {
          if (existingAgentIds.has(agentId)) return Promise.resolve({ ok: true } as IpcResult);
          return window.clawwork.setAgentFile(gwId, agentId, name, content);
        },
        installSkill: async (params) => {
          const res = await window.clawwork.installSkill(gwId, params);
          if (!res.ok) return { ok: false, error: res.error } as IpcResult<SkillInstallResult>;
          return { ok: true, result: res.result as unknown as SkillInstallResult };
        },
        persistTeam: editContext
          ? (team) =>
              window.clawwork.persistTeam({
                ...team,
                id: editContext.teamId,
                createdAt: editContext.createdAt,
                emoji: teamInfo.emoji,
              })
          : (team) => window.clawwork.persistTeam({ ...team, emoji: teamInfo.emoji }),
      };

      try {
        const wsBase = await window.clawwork.getWorkspacePath();
        const workspace = wsBase ? `${wsBase}/${toSlug(teamInfo.name)}` : toSlug(teamInfo.name);
        for await (const event of installTeam(parsed, agentFiles, teamInfo.gatewayId, workspace, deps)) {
          setInstallEvents((prev) => [...prev, event]);

          if (event.type === 'agent_created' && event.agentSlug && event.agentId) {
            const model = agentModelMap.get(event.agentSlug);
            if (model) {
              window.clawwork
                .updateAgent(teamInfo.gatewayId, { agentId: event.agentId, model })
                .catch((err) => console.error('Failed to update agent model', err));
            }
          }

          if (event.type === 'error') {
            setInstallStatus('error');
            return;
          }
          if (event.type === 'done') {
            setInstallStatus('done');
            onDone?.();
            return;
          }
        }
      } catch {
        setInstallStatus('error');
      }
    },
    [onDone],
  );

  const runUpdate = useCallback(
    async (teamId: string, createdAt: string, teamInfo: TeamInfo, agents: AgentDraft[]) => {
      setInstallStatus('installing');
      setInstallEvents([]);

      try {
        const gwId = teamInfo.gatewayId;
        const skillPromises = agents.flatMap((a) =>
          a.skills.length > 0 && a.existingAgentId
            ? a.skills.map((slug) =>
                window.clawwork
                  .installSkill(gwId, { source: 'clawhub', slug })
                  .catch((err) => console.error(`Failed to install skill ${slug}`, err)),
              )
            : [],
        );
        if (skillPromises.length > 0) await Promise.all(skillPromises);

        const teamAgents = agents.map((a) => ({
          agentId: a.existingAgentId!,
          role: a.role,
          isManager: a.role === 'coordinator',
        }));

        const now = new Date().toISOString();
        const res = await window.clawwork.persistTeam({
          id: teamId,
          name: teamInfo.name.trim(),
          emoji: teamInfo.emoji,
          description: teamInfo.description.trim(),
          gatewayId: teamInfo.gatewayId,
          source: 'local',
          version: '1.0.0',
          agents: teamAgents,
          createdAt,
          updatedAt: now,
        });

        if (res.ok) {
          setInstallEvents([{ type: 'team_persisted', progress: { current: 1, total: 1 } }]);
          setInstallStatus('done');
          onDone?.();
        } else {
          setInstallEvents([{ type: 'error', message: res.error ?? 'Failed to update team' }]);
          setInstallStatus('error');
        }
      } catch {
        setInstallStatus('error');
      }
    },
    [onDone],
  );

  return { installStatus, installEvents, runInstall, runUpdate, resetInstall };
}
