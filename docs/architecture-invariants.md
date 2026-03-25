# Architecture Invariants

This document is the short list of rules that should survive refactors, contributor churn, and AI-assisted coding. If a change breaks one of these invariants, treat it as a design problem, not an implementation detail.

## Product Invariants

- ClawWork is an OpenClaw desktop operator client.
- It is not an admin console, general IM client, or collaboration product.
- Task is the primary product object.
- One Task maps to one OpenClaw session.
- The three-panel layout is a core product affordance.
- Artifact persistence is local-first: filesystem first, SQLite index second.

## Session And Protocol Invariants

- Session key format is `agent:<agentId>:clawwork:task:<taskId>`.
- Build session keys only with `buildSessionKey()` from `packages/shared/src/constants.ts`.
- Gateway protocol frames and shared domain types belong in `packages/shared/src/`.
- Gateway broadcasts all session events; client routing must stay explicit and keyed by `sessionKey`.
- Messages are serial within a session and parallel across sessions.
- If local behavior appears to disagree with OpenClaw protocol behavior, verify the upstream server in `~/git/openclaw` before patching around it.

## Ownership Invariants

- `packages/shared/` owns protocol, constants, and shared types.
- `packages/desktop/src/main/` owns WebSocket, filesystem, database, workspace config, IPC handlers, and OS integration.
- `packages/desktop/src/preload/` owns the typed renderer bridge.
- `packages/desktop/src/renderer/` owns UI state and presentation.
- The renderer must cross the process boundary only through `window.clawwork` from preload.
- Do not bypass task isolation with hidden global state.

## Persistence Invariants

- Artifact files are stored on disk and treated as the source of durable output.
- SQLite is the metadata and search index, not the canonical file store.
- Preserve stable workspace paths and per-task artifact directories.

## UI Invariants

- All renderer changes must follow `theme.css`, `design-tokens.ts`, and `pnpm check:ui-contract`.
- Do not hardcode hex, rgb, or rgba colors in renderer TypeScript or TSX.
- Use CSS variables from `theme.css` and tokens from `design-tokens.ts`.
- Preserve the dark-first visual language, light-theme parity, and explicit interaction states.
- Do not introduce generic dashboard styling that ignores the existing design system.

## Engineering Invariants

- Do not construct raw session key strings outside `packages/shared/src/constants.ts`.
- Do not import Node builtins, `electron`, or main-process modules into renderer code.
- Do not fork shared protocol types inside desktop code.
- Do not move artifact persistence into renderer code.
- Favor the smallest change that preserves layer boundaries.
- Treat failing architecture checks as design failures, not lint noise.

## Change Checklist

Before merging a non-trivial change, confirm:

- Task remains the primary unit of behavior.
- Session routing is still explicit.
- The owning layer is clear.
- Local-first artifact persistence is preserved.
- UI changes still satisfy `theme.css`, `design-tokens.ts`, and `pnpm check:ui-contract`.
- `pnpm check` and any relevant E2E coverage pass.
