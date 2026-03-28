# CLAUDE.md — ClawWork

## Quick Reference

- Product: OpenClaw desktop client (Electron 34 + React 19)
- Monorepo: `packages/shared/` (types + protocol) → `packages/core/` (stores, services, ports) → `packages/desktop/` (Electron app) + `packages/pwa/` (web app) + `website/` + `keynote/`
- Gateway: single WS to `:18789`, session key `agent:main:clawwork:task:<taskId>`
- Design doc: `docs/openclaw-desktop-design.md`

## Commands

```bash
pnpm install          # dependencies
pnpm dev              # dev with hot-reload
pnpm check            # full verification gate
```

## Rules

- Coding: `.claude/rules/frontend.md`
- Message persistence: `.claude/rules/message-persistence.md` (CRITICAL)
- Main process: `.claude/rules/main-process.md`

## Verification

Before claiming done:

- `pnpm check` passes
- Message-related changes: SQLite duplicate query returns empty
- UI changes: verify in both dark/light themes
