---
name: team-create
description: >
  Create a collaborative agent team with roles, personalities, and skills.
  Use when: user says "create team", "build a team", "新建团队",
  "创建团队", "组建团队", "搭建团队".
  Do NOT use for managing existing teams or assigning tasks to teams.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - WebSearch
argument-hint: "[team-name]"
---

# Team Create

Interactive workflow for building a collaborative agent team.

A Team is an installable package — it bundles multiple OpenClaw Agents,
each with its own identity (agent.md), personality (soul.md), and skill
dependencies (skills.json), all self-contained and portable.

## Team Protocol

### Folder Structure

```
~/.agents/teams/{team-name}/
├── team.md                          # Team metadata + positioning
└── agents/
    ├── manager/                     # MANDATORY — coordinator, never does work itself
    │   ├── agent.md
    │   ├── soul.md
    │   └── skills.json              # Skill dependencies (empty for coordinator)
    ├── {agent-slug}/
    │   ├── agent.md                 # Agent identity + description
    │   ├── soul.md                  # Personality, tone, working style
    │   └── skills.json              # This agent's skill dependencies with install sources
    └── ...
```

### team.md Format

```yaml
---
name: {team-name}
description: "{one-line team purpose}"
version: "1.0.0"
agents:
  - id: manager
    name: "{Manager Display Name}"
    role: coordinator
  - id: {agent-slug}
    name: "{Display Name}"
    role: worker
---

{Markdown body: team mission, positioning, collaboration model between agents}
```

### agent.md Format

Each agent maps to an OpenClaw Agent. Defines WHO this agent is — identity
and responsibilities only. No skill references here.

```yaml
---
id: {agent-slug}
agentId: ""
name: "{Display Role Name}"
description: "{What this agent is responsible for}"
---

{Markdown body: role positioning, core responsibilities, how this agent
collaborates with other agents in the team}
```

- `id`: internal role slug within the team, defined at creation time, immutable
- `agentId`: real OpenClaw Agent ID assigned by the system, backfilled at install time, left empty at creation

### soul.md Format

Defines HOW this agent communicates and thinks — its personality.

```markdown
# {Role Name} — Soul

## Personality

{Communication style, tone, attitude.}

## Working Style

{How this agent approaches tasks, priorities, decision-making.}

## Principles

{Core beliefs that guide decisions.}
```

### Per-Agent skills.json Format

Each agent has its OWN skills.json declaring its skill dependencies with
install sources. Format mirrors `.skill-lock.json` for compatibility.

```json
{
  "version": 1,
  "skills": {
    "{skill-id}": {
      "source": "{owner/repo}",
      "sourceType": "github",
      "skillPath": "skills/{skill-id}/SKILL.md"
    }
  }
}
```

**sourceType values:**
- `"github"` — install from GitHub repo (requires `source` as `owner/repo`)
- `"cloud-hub"` — install from OpenClaw Cloud Hub (requires `source` as hub skill ID)
- `"local"` — already available locally, no installation needed

### Manager Agent (MANDATORY)

Every team MUST have a `manager` agent with these properties:

- **id**: `manager`
- **role**: `coordinator` in team.md
- **Never does work itself** — only dispatches, coordinates, and synthesizes
- **soul.md**: focuses on orchestration style, delegation principles, quality gates
- **skills.json**: typically empty (`"skills": {}`)
- The manager is the entry point when the team is invoked

## Workflow

- [ ] Step 0: Parse arguments
- [ ] Step 1: Team positioning (team.md)
- [ ] Step 2: Define agents (manager auto-created + user-defined workers)
- [ ] Step 3: Define each agent's soul
- [ ] Step 4: Assign skills (per-agent skills.json)
- [ ] Step 5: Generate and save
- [ ] Step 6: Summary

### Step 0: Parse Arguments

- [ ] If `$ARGUMENTS` contains a team name, use it; otherwise ask
- [ ] Slugify: lowercase, hyphens, no spaces (e.g., "Research Team" → `research-team`)
- [ ] Check `~/.agents/teams/{team-name}/` does not exist
- [ ] If it exists, ask: overwrite or pick a new name?

### Step 1: Team Positioning (team.md)

Ask the user:

> What kind of team do you want to create? Describe its purpose and mission.

- [ ] Draft team.md with frontmatter (name, description, version) and body
- [ ] Body: team mission, positioning, collaboration model
- [ ] The `manager` agent is always first in the agents list with `role: coordinator`
- [ ] Show draft for confirmation

### Step 2: Define Agents

The `manager` agent is auto-created. Ask the user for worker agents:

> What roles does this team need? (e.g., frontend developer, tester, PM)

For each role:

- [ ] Collect: display name + brief description
- [ ] Derive slug (e.g., "Frontend Developer" → `frontend-dev`)
- [ ] Confirm the complete agent list (manager + workers)

### Step 3: Define Each Agent's Soul (soul.md)

For each agent (including manager):

- [ ] Manager soul: orchestration style, delegation principles, how it routes work
- [ ] Worker souls: personality, working style, principles for each role
- [ ] If user says "auto", generate sensible defaults based on role
- [ ] Show drafts and let user adjust

### Step 4: Assign Skills (per-agent skills.json)

For each agent, build its own skills.json:

- [ ] Recommend skills based on role heuristics
- [ ] Let user customize: add/remove per agent
- [ ] Manager typically has empty skills
- [ ] For each skill assigned to an agent, determine its install source:
  1. Check `~/.agents/.skill-lock.json` — if skill exists there, copy source info
  2. Check `~/.agents/skills-lock.json` — same
  3. If not found locally, search for it (GitHub, Cloud Hub) or ask user
- [ ] Write skills.json into each agent's folder

### Step 5: Generate and Save

- [ ] Create `~/.agents/teams/{team-name}/`
- [ ] Create `agents/{slug}/` for each agent (manager + workers)
- [ ] Write `team.md`
- [ ] For each agent write `agent.md` + `soul.md` + `skills.json`
- [ ] Verify with `find` tree listing

### Step 6: Summary

```
Team created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━

📁 ~/.agents/teams/{team-name}/
├── team.md — {description}
└── agents/
    ├── manager/
    │   ├── agent.md — Coordinator
    │   ├── soul.md
    │   └── skills.json — 0 skills
    ├── {agent-1}/
    │   ├── agent.md — {role}
    │   ├── soul.md
    │   └── skills.json — {N} skills
    └── ...

Total: {N} agents (1 manager + {N-1} workers)

Per-agent skills:
  • manager: (coordinator — no skills)
  • {agent-1}: {skill-1}, {skill-2}, ...
  • {agent-2}: {skill-1}, {skill-3}, ...

Merged skill manifest ({N} unique):
  • {skill-1} — {sourceType}: {source}
  • {skill-2} — {sourceType}: {source}
  ...
```

## Installation Flow (for consumers of this team)

When a team is installed, the installer should:

1. Read all `agents/*/skills.json` to collect every agent's skill dependencies
2. Merge and deduplicate skill IDs across all agents
3. For each unique skill: check if already installed in `~/.agents/skills/`
4. Install missing skills from their declared sources
5. Create OpenClaw agents via Gateway API for each agent in team.md
6. Upload `agent.md` and `soul.md` to each agent's workspace via `agents.files.set`

## Rules

- Every team MUST have a `manager` agent — it is the coordinator entry point
- All generated content in the language the user uses
- Each agent folder is self-contained: agent.md + soul.md + skills.json
- skills.json MUST include source info for every skill — no orphan references
- Do not invent skills — verify existence via lock files or web search
- Agent slugs must be unique within a team
- soul.md should feel human — avoid generic corporate language
- The team folder must be self-contained and portable (installable on any machine)
