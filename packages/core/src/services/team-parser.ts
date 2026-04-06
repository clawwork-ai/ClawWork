import type { ParsedTeam, ParsedTeamAgent, AgentFileSet, SkillRef } from '@clawwork/shared';

const FRONTMATTER_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/;

export function parseTeamMd(raw: string): ParsedTeam {
  const match = raw.trim().match(FRONTMATTER_RE);
  if (!match) throw new Error('Invalid TEAM.md: missing YAML frontmatter');

  const frontmatter = parseFrontmatter(match[1]);
  const body = match[2].trim();

  if (!frontmatter.name || typeof frontmatter.name !== 'string') {
    throw new Error('Invalid TEAM.md: missing "name" field');
  }
  if (!Array.isArray(frontmatter.agents) || frontmatter.agents.length === 0) {
    throw new Error('Invalid TEAM.md: "agents" must be a non-empty array');
  }

  const agents: ParsedTeamAgent[] = frontmatter.agents.map((a: Record<string, string>, i: number) => {
    if (!a.id) throw new Error(`Invalid TEAM.md: agent[${i}] missing "id"`);
    if (!a.role || (a.role !== 'coordinator' && a.role !== 'worker')) {
      throw new Error(`Invalid TEAM.md: agent[${i}] role must be "coordinator" or "worker"`);
    }
    return { id: a.id, name: a.name ?? a.id, role: a.role };
  });

  const coordinators = agents.filter((a) => a.role === 'coordinator');
  if (coordinators.length !== 1) {
    throw new Error(`Invalid TEAM.md: expected exactly 1 coordinator, got ${coordinators.length}`);
  }

  return {
    name: frontmatter.name as string,
    description: String(frontmatter.description ?? ''),
    version: String(frontmatter.version ?? '1.0.0'),
    agents,
    body,
  };
}

export function parseSkillsJson(raw: string): SkillRef[] {
  const parsed = JSON.parse(raw) as {
    version?: number;
    skills?: Record<string, { source?: string; sourceType?: string }>;
  };
  if (!parsed.skills || typeof parsed.skills !== 'object') return [];

  return Object.entries(parsed.skills).map(([id, entry]) => ({
    id,
    source: entry.source ?? '',
    sourceType: (entry.sourceType as SkillRef['sourceType']) ?? 'clawhub',
  }));
}

export function extractSkillSlugs(agentFiles: AgentFileSet): SkillRef[] {
  if (!agentFiles.skillsJson) return [];
  try {
    return parseSkillsJson(agentFiles.skillsJson);
  } catch {
    return [];
  }
}

interface ParsedIdentityMd {
  description?: string;
  body: string;
  rawFrontmatter?: string;
}

export function parseIdentityMd(raw: string): ParsedIdentityMd {
  const match = raw.trim().match(FRONTMATTER_RE);
  if (!match) return { body: raw.trim() };
  const fm = parseFrontmatter(match[1]);
  const desc = typeof fm.description === 'string' && fm.description ? fm.description : undefined;
  return { description: desc, body: match[2].trim(), rawFrontmatter: match[1] };
}

export function extractDescription(agentMd: string): string | undefined {
  return parseIdentityMd(agentMd).description;
}

export function extractIdentityBody(agentMd: string): string {
  return parseIdentityMd(agentMd).body;
}

const FM_DESC_LINE_RE = /^description:\s*.*/m;

export function serializeIdentityMd(description: string | undefined, body: string, existingRaw?: string): string {
  const trimmedDesc = description?.trim()?.replaceAll('\n', ' ');
  const existingFm = existingRaw ? existingRaw.trim().match(FRONTMATTER_RE)?.[1] : undefined;

  if (!trimmedDesc && !existingFm) return body;

  let fmBlock: string;
  if (!trimmedDesc) {
    fmBlock = existingFm
      ? existingFm
          .replace(FM_DESC_LINE_RE, '')
          .replace(/\n{2,}/g, '\n')
          .trim()
      : '';
  } else {
    const escaped = trimmedDesc.replaceAll('"', '\\"');
    const descLine = `description: "${escaped}"`;
    if (existingFm) {
      fmBlock = FM_DESC_LINE_RE.test(existingFm)
        ? existingFm.replace(FM_DESC_LINE_RE, () => descLine)
        : `${descLine}\n${existingFm}`;
    } else {
      fmBlock = descLine;
    }
  }

  if (!fmBlock) return body;
  return body ? `---\n${fmBlock}\n---\n\n${body}` : `---\n${fmBlock}\n---`;
}

function unquote(s: string): string {
  const trimmed = s.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentArray: Record<string, string>[] | null = null;
  let currentArrayKey = '';
  let currentItem: Record<string, string> | null = null;
  let arrayIndent = -1;

  for (const line of yaml.split('\n')) {
    if (/^\s*$/.test(line)) continue;

    const indent = line.search(/\S/);

    if (currentArray !== null && indent > arrayIndent) {
      const dashMatch = line.match(/^(\s*)-\s+(\w[\w-]*):\s*(.*)$/);
      if (dashMatch) {
        if (currentItem) currentArray.push(currentItem);
        currentItem = { [dashMatch[2]]: unquote(dashMatch[3]) };
        continue;
      }

      const kvMatch = line.match(/^(\s+)(\w[\w-]*):\s*(.*)$/);
      if (kvMatch && currentItem) {
        currentItem[kvMatch[2]] = unquote(kvMatch[3]);
        continue;
      }
    }

    if (currentItem && currentArray) {
      currentArray.push(currentItem);
      currentItem = null;
    }
    if (currentArray !== null) {
      result[currentArrayKey] = currentArray;
      currentArray = null;
      arrayIndent = -1;
    }

    const topMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (topMatch) {
      const [, key, rawValue] = topMatch;
      const value = rawValue.trim();
      if (value === '' || value === '[]') {
        currentArray = [];
        currentArrayKey = key;
        arrayIndent = indent;
      } else {
        const colonIdx = rawValue.indexOf(':');
        if (colonIdx === -1) {
          result[key] = unquote(rawValue);
        } else {
          result[key] = unquote(rawValue);
        }
      }
    }
  }

  if (currentItem && currentArray) currentArray.push(currentItem);
  if (currentArray !== null) result[currentArrayKey] = currentArray;

  return result;
}
