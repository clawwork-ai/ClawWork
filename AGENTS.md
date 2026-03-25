# ClawWork Agent Guide

This file is for AI coding agents and new contributors. Read it before making non-trivial changes.

Canonical invariant list: `docs/architecture-invariants.md`.

## Required Reading Order

1. `DEVELOPMENT.md`
2. `docs/architecture-invariants.md`
3. `docs/openclaw-desktop-design.md`
4. `scripts/check-ui-contract.mjs`
5. the module you will change

If the task touches Gateway behavior, also inspect `~/git/openclaw` before changing local code.

## Product Truths

- ClawWork is an OpenClaw desktop operator client, not an admin console, IM client, or collaboration product.
- Task is the primary product object.
- One Task maps to one OpenClaw session.
- Artifact persistence is local-first: filesystem first, SQLite index second.
- The three-panel layout is a core product affordance, not optional chrome.

## Architecture Invariants

- Session key format is `agent:<agentId>:clawwork:task:<taskId>`.
- Build session keys with `buildSessionKey()` from `@clawwork/shared`.
- Gateway protocol and shared domain types live in `packages/shared/src/`.
- The Electron main process owns WebSocket, filesystem, database, workspace config, and OS integration.
- The renderer owns UI state and presentation.
- The renderer must cross the process boundary only through `window.clawwork` from preload.
- Gateway broadcasts all session events; routing must stay explicit and keyed by `sessionKey`.
- Do not bypass task isolation with hidden global state.

## UI And Design Rules

- Follow `theme.css`, `design-tokens.ts`, and `pnpm check:ui-contract` for every renderer change.
- Do not hardcode hex, rgb, or rgba colors in renderer TypeScript or TSX.
- Use CSS variables from `theme.css` and tokens from `design-tokens.ts`.
- Preserve the dark-first visual language, light-theme parity, and explicit interaction states.
- Do not introduce generic dashboard styling that ignores the current visual system.

## File Ownership Heuristics

- `packages/shared/src/`: protocol, constants, shared types, debug event types
- `packages/desktop/src/main/`: Gateway integration, DB, artifacts, workspace, IPC, debug, tray
- `packages/desktop/src/preload/`: typed renderer bridge only
- `packages/desktop/src/renderer/`: UI, stores, hooks, presentation, client-side coordination

If a change touches more than one layer, keep the boundary explicit and justify it in the PR.

## Forbidden Shortcuts

- Do not construct raw session key strings outside `packages/shared/src/constants.ts`.
- Do not import Node builtins, `electron`, or main-process modules into renderer code.
- Do not fork shared protocol types inside desktop code.
- Do not move artifact persistence into renderer code.
- Do not patch around unclear OpenClaw behavior without checking the upstream server code first.

## Change Workflow

For non-trivial work:

1. Restate the invariant that must remain true.
2. Identify the owning layer: shared, main, preload, or renderer.
3. Make the smallest change that preserves boundaries.
4. Run verification relevant to the touched area.
5. In the PR, explain what changed, why, and which invariant was protected.

## Verification Minimums

- Always run `pnpm check` before claiming completion.
- Run `pnpm test:e2e` or the relevant Playwright subset when changing Gateway flows, task routing, setup flow, or critical UI paths.
- Treat failing architecture checks as design failures, not lint noise.

## When To Stop And Escalate

Stop and ask for review instead of improvising when:

- a change weakens task/session isolation
- a change crosses main/preload/renderer boundaries without a clear reason
- a UI change cannot be expressed with existing design tokens or CSS variables
- local behavior appears to disagree with OpenClaw protocol behavior
