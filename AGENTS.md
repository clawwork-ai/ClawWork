# ClawWork Agent Guide

This is the canonical agent entrypoint for this repo. Tool-specific shims such
as `CLAUDE.md` and `.github/copilot-instructions.md` must point here instead of
duplicating project rules.

## Quick Reference

- Product: OpenClaw desktop client (Electron 34 + React 19)
- Monorepo: `packages/shared/` (types + protocol) -> `packages/core/` (stores, services, ports) -> `packages/desktop/` (Electron app) + `packages/pwa/` (web app) + `website/` + `keynote/`
- Gateway: single WS to `:18789`, session key `agent:main:clawwork:task:<taskId>`
- Design doc: `docs/openclaw-desktop-design.md`

## Commands

```bash
pnpm install          # dependencies
pnpm dev              # desktop dev with hot reload
pnpm check            # full verification gate
```

## Required Reading Order

1. `AGENTS.md` — project overview, commands, verification gate
2. `docs/agent-rules/architecture.md` — product identity, layer ownership, invariants
3. `docs/agent-rules/frontend.md` — TypeScript, React, styling
4. `docs/agent-rules/main-process.md` — Electron main process, IPC, WebSocket
5. `docs/agent-rules/message-persistence.md` — message write paths (CRITICAL)
6. `docs/agent-rules/git-conventions.md` — commit format, PR budget
7. `docs/openclaw-desktop-design.md` — historical design context
8. The module you will change

If the task touches Gateway behavior, also inspect `~/git/openclaw` before
changing local code.

## Verification

Before claiming done:

- `pnpm check` passes, or the remaining failure is explicitly scoped and reported
- Message-related changes: SQLite duplicate query returns empty
- UI changes: verify in both dark and light themes

## Local Overrides

- Personal preferences and machine-specific workflow belong in `AGENTS.local.md`.
- Claude-only preferences belong in `CLAUDE.local.md` or `.claude/settings.local.json`.
- Do not commit local model preferences, personal approval rules, hook settings, API endpoints, tokens, workspace paths, or one-off planning notes.

## Project Skills

Project-specific skills may remain under `.claude/skills/` for current tool
discovery compatibility. Do not add generic or personal skills here; use
`~/.agents/skills` for shared local skills.
