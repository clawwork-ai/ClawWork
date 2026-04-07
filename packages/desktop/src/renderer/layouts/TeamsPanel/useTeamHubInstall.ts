import { useState, useCallback } from 'react';
import type { TeamHubEntry, ParsedTeam, AgentFileSet } from '@clawwork/shared';
import { extractSkillSlugs } from '@clawwork/core';
import type { AgentDraft, TeamInfo } from './types';
import { useTeamInstall } from './useTeamInstall';

type HubInstallPhase = 'idle' | 'downloading' | 'installing' | 'done' | 'error';

export function useTeamHubInstall(onDone?: () => void) {
  const [phase, setPhase] = useState<HubInstallPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const { installStatus, installEvents, runInstall, resetInstall } = useTeamInstall(onDone);

  const reset = useCallback(() => {
    setPhase('idle');
    setError(null);
    resetInstall();
  }, [resetInstall]);

  const install = useCallback(
    async (entry: TeamHubEntry & { _registryId: string }, gatewayId: string) => {
      setPhase('downloading');
      setError(null);

      const res = await window.clawwork.hubDownloadTeam(entry._registryId, entry.slug);
      if (!res.ok || !res.result) {
        setError(res.error ?? 'Download failed');
        setPhase('error');
        return;
      }

      const { parsed, agentFiles } = res.result as {
        parsed: ParsedTeam;
        agentFiles: Record<string, AgentFileSet>;
      };

      const agents: AgentDraft[] = parsed.agents.map((a) => {
        const files = agentFiles[a.id];
        const skills = files ? extractSkillSlugs(files) : [];
        return {
          uid: crypto.randomUUID(),
          name: a.name,
          description: '',
          role: a.role,
          model: '',
          agentMd: files?.agentMd ?? '',
          soulMd: files?.soulMd ?? '',
          skills: skills.map((s) => s.id),
        };
      });

      const teamInfo: TeamInfo = {
        name: parsed.name,
        emoji: entry.emoji,
        description: parsed.description,
        gatewayId,
      };

      setPhase('installing');
      await runInstall(teamInfo, agents, undefined, { slug: entry.slug });
    },
    [runInstall],
  );

  const effectiveStatus = phase === 'installing' ? installStatus : phase;

  return {
    phase: effectiveStatus as HubInstallPhase,
    installEvents,
    error,
    install,
    reset,
  };
}
