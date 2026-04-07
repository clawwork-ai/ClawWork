import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { createHash } from 'crypto';
import { TEAMSHUB_COMMUNITY_URL, TEAMSHUB_COMMUNITY_ID } from '@clawwork/shared';
import type { TeamHubRegistry, TeamHubRegistryConfig, TeamHubEntry, ParsedTeam, AgentFileSet } from '@clawwork/shared';
import { readConfig, updateConfig } from '../workspace/config.js';
import { parseTeamMd } from '@clawwork/core';

function cacheDir(): string {
  const dir = join(app.getPath('userData'), 'teamshub-cache');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

const SAFE_ID_RE = /^[a-z0-9-]+$/;

function cachePath(registryId: string): string {
  if (!SAFE_ID_RE.test(registryId)) throw new Error(`Invalid registry id: ${registryId}`);
  return join(cacheDir(), `${registryId}.json`);
}

function registryIdFromUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 12);
}

const GITHUB_URL_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/;

function toRawUrl(githubUrl: string, path: string): string {
  const m = githubUrl.match(GITHUB_URL_RE);
  if (!m) throw new Error(`Invalid GitHub URL: ${githubUrl}`);
  const repo = m[2].replace(/\.git$/, '');
  return `https://raw.githubusercontent.com/${m[1]}/${repo}/main/${path}`;
}

function validateGitHubUrl(url: string): void {
  if (!GITHUB_URL_RE.test(url)) {
    throw new Error('URL must be a GitHub repository (https://github.com/owner/repo)');
  }
}

interface TeamHubJson {
  version: number;
  name: string;
  description?: string;
  teams: TeamHubEntry[];
}

function defaultRegistryConfig(): TeamHubRegistryConfig {
  return { id: TEAMSHUB_COMMUNITY_ID, url: TEAMSHUB_COMMUNITY_URL, isOfficial: true };
}

export function listRegistryConfigs(): TeamHubRegistryConfig[] {
  const config = readConfig();
  const registries = [...(config?.teamHubRegistries ?? [])];
  if (!registries.some((r) => r.id === TEAMSHUB_COMMUNITY_ID)) {
    registries.unshift(defaultRegistryConfig());
  }
  return registries;
}

export function addRegistryConfig(url: string): TeamHubRegistryConfig {
  validateGitHubUrl(url);
  const id = registryIdFromUrl(url);
  const existing = readConfig()?.teamHubRegistries ?? [];
  if (existing.some((r) => r.id === id || r.url === url)) {
    throw new Error('Registry already exists');
  }
  const entry: TeamHubRegistryConfig = { id, url, isOfficial: false };
  updateConfig({ teamHubRegistries: [...existing, entry] });
  return entry;
}

export function removeRegistryConfig(id: string): void {
  if (id === TEAMSHUB_COMMUNITY_ID) throw new Error('Cannot remove community registry');
  const existing = readConfig()?.teamHubRegistries ?? [];
  updateConfig({ teamHubRegistries: existing.filter((r) => r.id !== id) });
  const fp = cachePath(id);
  if (existsSync(fp)) unlinkSync(fp);
}

export function getCachedRegistry(id: string): TeamHubRegistry | null {
  const fp = cachePath(id);
  if (!existsSync(fp)) return null;
  try {
    return JSON.parse(readFileSync(fp, 'utf-8')) as TeamHubRegistry;
  } catch {
    return null;
  }
}

export async function fetchRegistry(registryConfig: TeamHubRegistryConfig): Promise<TeamHubRegistry> {
  const url = toRawUrl(registryConfig.url, 'teamshub.json');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch registry: ${res.status} ${res.statusText}`);
  const json = (await res.json()) as TeamHubJson;
  if (json.version !== 1) throw new Error(`Unsupported teamshub.json version: ${json.version}`);

  const registry: TeamHubRegistry = {
    id: registryConfig.id,
    name: json.name,
    description: json.description ?? '',
    url: registryConfig.url,
    isOfficial: registryConfig.isOfficial,
    teams: json.teams.map((t) => ({ ...t, registryId: registryConfig.id })),
    fetchedAt: new Date().toISOString(),
  };

  writeFileSync(cachePath(registryConfig.id), JSON.stringify(registry, null, 2), 'utf-8');
  return registry;
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function validateSlug(value: string, label: string): void {
  if (!SLUG_RE.test(value)) throw new Error(`Invalid ${label}: ${value}`);
}

export async function downloadTeamPackage(
  registryUrl: string,
  slug: string,
): Promise<{ parsed: ParsedTeam; agentFiles: Map<string, AgentFileSet> }> {
  validateSlug(slug, 'team slug');
  const teamMdUrl = toRawUrl(registryUrl, `teams/${slug}/TEAM.md`);
  const teamMdRes = await fetch(teamMdUrl);
  if (!teamMdRes.ok) throw new Error(`Failed to fetch TEAM.md for ${slug}: ${teamMdRes.status}`);
  const teamMdRaw = await teamMdRes.text();
  const parsed = parseTeamMd(teamMdRaw);

  const agentFiles = new Map<string, AgentFileSet>();

  await Promise.all(
    parsed.agents.map(async (agent) => {
      validateSlug(agent.id, 'agent id');
      const base = toRawUrl(registryUrl, `teams/${slug}/agents/${agent.id}`);
      const fileSet: AgentFileSet = {};

      const [identityRes, soulRes, skillsRes] = await Promise.all([
        fetch(`${base}/IDENTITY.md`),
        fetch(`${base}/SOUL.md`),
        fetch(`${base}/skills.json`),
      ]);

      if (identityRes.ok) fileSet.agentMd = await identityRes.text();
      if (soulRes.ok) fileSet.soulMd = await soulRes.text();
      if (skillsRes.ok) fileSet.skillsJson = await skillsRes.text();

      agentFiles.set(agent.id, fileSet);
    }),
  );

  return { parsed, agentFiles };
}
