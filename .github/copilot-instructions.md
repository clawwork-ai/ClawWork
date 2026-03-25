# ClawWork Copilot Instructions

- Read `AGENTS.md` before non-trivial changes.
- ClawWork is an OpenClaw desktop operator client. It is not an admin console, IM client, or collaboration product.
- Task is the primary product object. One Task maps to one OpenClaw session.
- Build session keys only with `buildSessionKey()` from `@clawwork/shared`.
- Shared protocol and domain types belong in `packages/shared/src/`.
- The Electron main process owns WebSocket, filesystem, database, Git, workspace config, and OS integration.
- The renderer owns UI state and presentation, and may cross the boundary only through `window.clawwork` from preload.
- Do not import Node builtins, `electron`, or main-process modules into renderer code.
- Follow `theme.css`, `design-tokens.ts`, and `pnpm check:ui-contract` for every renderer change.
- Do not hardcode hex, rgb, or rgba colors in renderer TypeScript or TSX.
- If Gateway behavior is unclear, inspect `~/git/openclaw` before inventing local workarounds.
- Run `pnpm check` before claiming completion.
