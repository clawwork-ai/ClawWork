import type {
  ParsedTeam,
  InstallEvent,
  AgentFileSet,
  SkillRef,
  AgentCreateParams,
  AgentCreateResponse,
  AgentDeleteParams,
  IpcResult,
  SkillInstallParams,
  SkillInstallResult,
} from '@clawwork/shared';
import { extractSkillSlugs } from './team-parser.js';

export interface InstallerDeps {
  createAgent: (params: AgentCreateParams) => Promise<IpcResult<AgentCreateResponse>>;
  deleteAgent: (params: AgentDeleteParams) => Promise<IpcResult>;
  setAgentFile: (agentId: string, name: string, content: string) => Promise<IpcResult>;
  installSkill: (params: SkillInstallParams) => Promise<IpcResult<SkillInstallResult>>;
  persistTeam: (team: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    gatewayId: string;
    source?: string;
    version?: string;
    agents: Array<{ agentId: string; role?: string; isManager?: boolean }>;
    createdAt: string;
    updatedAt: string;
  }) => Promise<IpcResult>;
}

function countFileOps(files: AgentFileSet | undefined): number {
  if (!files) return 0;
  let n = 0;
  if (files.agentMd) n++;
  if (files.soulMd) n++;
  return n;
}

function buildSkillInstallParams(skill: SkillRef): SkillInstallParams | null {
  if (skill.sourceType === 'clawhub') {
    return { source: 'clawhub', slug: skill.id };
  }
  return null;
}

export async function* installTeam(
  parsed: ParsedTeam,
  agentFiles: Record<string, AgentFileSet>,
  gatewayId: string,
  workspace: string,
  deps: InstallerDeps,
): AsyncGenerator<InstallEvent> {
  const createdAgentIds: string[] = [];
  const agentMap = new Map<string, string>();
  const skillsByAgent = new Map<string, SkillRef[]>();

  let totalSteps = 1;
  for (const agent of parsed.agents) {
    totalSteps++;
    const files = agentFiles[agent.id];
    totalSteps += countFileOps(files);
    const skills = files ? extractSkillSlugs(files) : [];
    skillsByAgent.set(agent.id, skills);
    totalSteps += skills.length;
  }

  let step = 0;

  for (const agent of parsed.agents) {
    yield {
      type: 'agent_creating',
      agentSlug: agent.id,
      message: agent.name,
      progress: { current: step, total: totalSteps },
    };

    const res = await deps.createAgent({ name: agent.name, workspace });
    if (!res.ok || !res.result) {
      yield {
        type: 'warning',
        agentSlug: agent.id,
        message: `Failed to create agent "${agent.name}": ${res.error ?? 'unknown'}`,
      };
      const skipped = 1 + countFileOps(agentFiles[agent.id]) + (skillsByAgent.get(agent.id)?.length ?? 0);
      step += skipped;
      continue;
    }

    const agentId = res.result.agentId;
    createdAgentIds.push(agentId);
    agentMap.set(agent.id, agentId);
    yield { type: 'agent_created', agentSlug: agent.id, agentId, progress: { current: ++step, total: totalSteps } };

    const files = agentFiles[agent.id];
    if (files?.agentMd) {
      yield { type: 'file_setting', agentSlug: agent.id, agentId, fileName: 'AGENT.md' };
      const r = await deps.setAgentFile(agentId, 'AGENT.md', files.agentMd);
      step++;
      if (!r.ok) yield { type: 'warning', agentSlug: agent.id, message: `Failed to set AGENT.md: ${r.error}` };
      else
        yield {
          type: 'file_set',
          agentSlug: agent.id,
          agentId,
          fileName: 'AGENT.md',
          progress: { current: step, total: totalSteps },
        };
    }
    if (files?.soulMd) {
      yield { type: 'file_setting', agentSlug: agent.id, agentId, fileName: 'SOUL.md' };
      const r = await deps.setAgentFile(agentId, 'SOUL.md', files.soulMd);
      step++;
      if (!r.ok) yield { type: 'warning', agentSlug: agent.id, message: `Failed to set SOUL.md: ${r.error}` };
      else
        yield {
          type: 'file_set',
          agentSlug: agent.id,
          agentId,
          fileName: 'SOUL.md',
          progress: { current: step, total: totalSteps },
        };
    }

    const skills = skillsByAgent.get(agent.id) ?? [];
    for (const skill of skills) {
      yield {
        type: 'skill_installing',
        agentSlug: agent.id,
        agentId,
        skillId: skill.id,
        progress: { current: step, total: totalSteps },
      };

      const params = buildSkillInstallParams(skill);
      if (!params) {
        yield {
          type: 'warning',
          agentSlug: agent.id,
          skillId: skill.id,
          message: `Skill "${skill.id}" has unsupported sourceType "${skill.sourceType}", skipped`,
        };
        step++;
        continue;
      }

      const installRes = await deps.installSkill(params);
      step++;
      if (!installRes.ok) {
        yield {
          type: 'warning',
          agentSlug: agent.id,
          skillId: skill.id,
          message: `Skill "${skill.id}" install failed: ${installRes.error ?? 'unknown'}`,
        };
      } else {
        yield {
          type: 'skill_installed',
          agentSlug: agent.id,
          agentId,
          skillId: skill.id,
          progress: { current: step, total: totalSteps },
        };
      }
    }
  }

  const teamAgents = parsed.agents
    .filter((a) => agentMap.has(a.id))
    .map((a) => ({
      agentId: agentMap.get(a.id)!,
      role: a.role,
      isManager: a.role === 'coordinator',
    }));

  if (teamAgents.length === 0) {
    yield* rollback(createdAgentIds, deps);
    yield { type: 'error', message: 'No agents were created successfully' };
    return;
  }

  yield { type: 'team_persisting', progress: { current: step, total: totalSteps } };

  const now = new Date().toISOString();
  const teamId = crypto.randomUUID();

  const persistRes = await deps.persistTeam({
    id: teamId,
    name: parsed.name,
    description: parsed.description,
    gatewayId,
    source: 'local',
    version: parsed.version,
    agents: teamAgents,
    createdAt: now,
    updatedAt: now,
  });

  if (!persistRes.ok) {
    yield* rollback(createdAgentIds, deps);
    yield { type: 'error', message: `Failed to persist team: ${persistRes.error}` };
    return;
  }

  yield { type: 'team_persisted', progress: { current: ++step, total: totalSteps } };
  yield { type: 'done', message: teamId };
}

async function* rollback(agentIds: string[], deps: InstallerDeps): AsyncGenerator<InstallEvent> {
  for (const agentId of agentIds) {
    try {
      await deps.deleteAgent({ agentId });
    } catch {
      yield { type: 'warning', agentId, message: `Rollback: failed to delete agent ${agentId}` };
    }
  }
}
