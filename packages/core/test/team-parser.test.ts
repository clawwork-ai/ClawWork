import { describe, it, expect } from 'vitest';
import { parseTeamMd, parseSkillsJson, extractSkillSlugs } from '../src/services/team-parser';

const VALID_TEAM_MD = `---
name: code-team
description: Full-stack development team
version: 1.0.0
agents:
  - id: manager
    name: Tech Lead
    role: coordinator
  - id: developer
    name: Developer
    role: worker
---

# Mission

Build great software.

# Collaboration Model

Manager dispatches, developer executes.
`;

describe('parseTeamMd', () => {
  it('parses a valid TEAM.md', () => {
    const result = parseTeamMd(VALID_TEAM_MD);
    expect(result.name).toBe('code-team');
    expect(result.description).toBe('Full-stack development team');
    expect(result.version).toBe('1.0.0');
    expect(result.agents).toHaveLength(2);
    expect(result.agents[0]).toEqual({ id: 'manager', name: 'Tech Lead', role: 'coordinator' });
    expect(result.agents[1]).toEqual({ id: 'developer', name: 'Developer', role: 'worker' });
    expect(result.body).toContain('# Mission');
    expect(result.body).toContain('# Collaboration Model');
  });

  it('throws on missing frontmatter', () => {
    expect(() => parseTeamMd('just some text')).toThrow('missing YAML frontmatter');
  });

  it('throws on missing name', () => {
    const md = `---\ndescription: test\nagents:\n  - id: m\n    role: coordinator\n---\nbody`;
    expect(() => parseTeamMd(md)).toThrow('missing "name"');
  });

  it('throws on empty agents array', () => {
    const md = `---\nname: t\nagents: []\n---\nbody`;
    expect(() => parseTeamMd(md)).toThrow('"agents" must be a non-empty');
  });

  it('throws on missing agents field', () => {
    const md = `---\nname: t\n---\nbody`;
    expect(() => parseTeamMd(md)).toThrow('"agents" must be a non-empty');
  });

  it('throws on agent missing id', () => {
    const md = `---\nname: t\nagents:\n  - name: X\n    role: worker\n---\nbody`;
    expect(() => parseTeamMd(md)).toThrow('agent[0] missing "id"');
  });

  it('throws on invalid agent role', () => {
    const md = `---\nname: t\nagents:\n  - id: a\n    role: boss\n---\nbody`;
    expect(() => parseTeamMd(md)).toThrow('role must be "coordinator" or "worker"');
  });

  it('throws on zero coordinators', () => {
    const md = `---\nname: t\nagents:\n  - id: a\n    role: worker\n  - id: b\n    role: worker\n---\nbody`;
    expect(() => parseTeamMd(md)).toThrow('expected exactly 1 coordinator, got 0');
  });

  it('throws on multiple coordinators', () => {
    const md = `---\nname: t\nagents:\n  - id: a\n    role: coordinator\n  - id: b\n    role: coordinator\n---\nbody`;
    expect(() => parseTeamMd(md)).toThrow('expected exactly 1 coordinator, got 2');
  });

  it('handles quoted values', () => {
    const md = `---\nname: "my-team"\ndescription: 'A great team'\nagents:\n  - id: m\n    name: "Lead"\n    role: coordinator\n---\nbody`;
    const result = parseTeamMd(md);
    expect(result.name).toBe('my-team');
    expect(result.description).toBe('A great team');
    expect(result.agents[0].name).toBe('Lead');
  });

  it('handles colons in description value', () => {
    const md = `---\nname: t\ndescription: Team: the best one\nagents:\n  - id: m\n    role: coordinator\n---\nbody`;
    const result = parseTeamMd(md);
    expect(result.description).toBe('Team: the best one');
  });

  it('defaults version to 1.0.0 when missing', () => {
    const md = `---\nname: t\nagents:\n  - id: m\n    role: coordinator\n---\nbody`;
    const result = parseTeamMd(md);
    expect(result.version).toBe('1.0.0');
  });

  it('defaults agent name to id when missing', () => {
    const md = `---\nname: t\nagents:\n  - id: mgr\n    role: coordinator\n---\nbody`;
    const result = parseTeamMd(md);
    expect(result.agents[0].name).toBe('mgr');
  });
});

describe('parseSkillsJson', () => {
  it('parses valid skills.json', () => {
    const json = JSON.stringify({
      version: 1,
      skills: {
        'web-search': { source: 'owner/web-search', sourceType: 'github' },
        'code-review': { source: 'code-review', sourceType: 'clawhub' },
      },
    });
    const result = parseSkillsJson(json);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'web-search', source: 'owner/web-search', sourceType: 'github' });
    expect(result[1]).toEqual({ id: 'code-review', source: 'code-review', sourceType: 'clawhub' });
  });

  it('returns empty for missing skills field', () => {
    expect(parseSkillsJson('{}')).toEqual([]);
  });

  it('returns empty for empty skills object', () => {
    expect(parseSkillsJson('{"version":1,"skills":{}}')).toEqual([]);
  });

  it('defaults sourceType to clawhub', () => {
    const json = JSON.stringify({ version: 1, skills: { x: { source: 'x' } } });
    const result = parseSkillsJson(json);
    expect(result[0].sourceType).toBe('clawhub');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseSkillsJson('not json')).toThrow();
  });
});

describe('extractSkillSlugs', () => {
  it('returns skills from valid skillsJson', () => {
    const result = extractSkillSlugs({
      skillsJson: JSON.stringify({ version: 1, skills: { s1: { source: 'x', sourceType: 'clawhub' } } }),
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('returns empty when no skillsJson', () => {
    expect(extractSkillSlugs({})).toEqual([]);
  });

  it('returns empty for malformed skillsJson', () => {
    expect(extractSkillSlugs({ skillsJson: '{bad' })).toEqual([]);
  });
});
