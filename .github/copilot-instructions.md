# ClawWork Copilot Instructions

Canonical rules are maintained in `AGENTS.md` and `docs/agent-rules/`.
Read those files for the complete rule set.

Key entry points:

- `AGENTS.md` — project overview, commands, verification gate
- `docs/agent-rules/architecture.md` — product identity, layer ownership, invariants
- `docs/agent-rules/frontend.md` — TypeScript, React, styling
- `docs/agent-rules/main-process.md` — Electron main process, IPC, WebSocket
- `docs/agent-rules/message-persistence.md` — message write paths (CRITICAL)
- `docs/agent-rules/git-conventions.md` — commit format, PR budget

Run `pnpm check` before claiming completion.
