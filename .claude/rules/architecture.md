# Architecture Rules

Canonical invariant list: `docs/architecture-invariants.md`.
Use this file as the tool-oriented summary for review and enforcement.

## Product Identity

- ClawWork is an OpenClaw desktop operator client, not an admin console, IM client, or collaboration product.
- Task is the primary product object. One Task = one OpenClaw session.
- Artifact persistence is local-first: filesystem first, SQLite index second.
- The three-panel layout is a core product affordance, not optional chrome.

## Layer Ownership

| Layer | Owns | Package |
|---|---|---|
| shared | protocol, constants, domain types, debug event types | `packages/shared/src/` |
| core | stores, services, ports | `packages/core/src/` |
| main | WebSocket, filesystem, database, workspace config, OS integration, IPC, tray | `packages/desktop/src/main/` |
| preload | typed renderer bridge only | `packages/desktop/src/preload/` |
| renderer | UI state, presentation, hooks, client-side coordination | `packages/desktop/src/renderer/` |

Cross-layer changes must keep boundaries explicit and justified in the PR.

## Invariants

- [HIGH] Session key format: `agent:<agentId>:clawwork:task:<taskId>`
- [HIGH] Build session keys only with `buildSessionKey()` from `@clawwork/shared` — never construct raw strings
- [HIGH] Do not import Node builtins, `electron`, or main-process modules into renderer code
- [HIGH] Do not fork shared protocol types inside desktop code
- [HIGH] Dependency direction: `shared` <- `core` <- `desktop`/`pwa` — never reverse
- [HIGH] Relative imports must not cross package boundaries (use `@clawwork/shared`, `@clawwork/core`)
- [HIGH] API keys, tokens, or secrets must never appear in client-distributed code
- [HIGH] Do not bypass task isolation with hidden global state
- Do not move artifact persistence into renderer code
- Do not patch around unclear OpenClaw behavior without checking upstream (`~/git/openclaw`) first

## Escalation Triggers

Stop and ask for review instead of improvising when:

- a change weakens task/session isolation
- a change crosses main/preload/renderer boundaries without a clear reason
- a UI change cannot be expressed with existing design tokens or CSS variables
- local behavior appears to disagree with OpenClaw protocol behavior
