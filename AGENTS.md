# ClawWork Agent Guide

Canonical rules are maintained in `CLAUDE.md` and `.claude/rules/`.
Read those files before making non-trivial changes.

## Required Reading Order

1. `CLAUDE.md` — project overview, commands, verification gate
2. `.claude/rules/architecture.md` — product identity, layer ownership, invariants
3. `.claude/rules/frontend.md` — TypeScript, React, styling
4. `.claude/rules/main-process.md` — Electron main process, IPC, WebSocket
5. `.claude/rules/message-persistence.md` — message write paths (CRITICAL)
6. `.claude/rules/git-conventions.md` — commit format, PR budget
7. `docs/openclaw-desktop-design.md` — design doc
8. the module you will change

If the task touches Gateway behavior, also inspect `~/git/openclaw` before changing local code.
