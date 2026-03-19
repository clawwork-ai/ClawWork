# CLAUDE.md — ClawWork Project Guide

## Project Overview

ClawWork is an OpenClaw desktop client inspired by Claude Cowork: three-panel layout, parallel multi-task execution, and structured progress tracking. It adds file management capabilities on top — all AI artifacts are automatically persisted to a local Git repo, searchable and traceable.

**Not** an OpenClaw admin console. **Not** a general-purpose IM client. **Not** a collaboration tool.

## Related Repositories

- **OpenClaw server source**: `~/git/openclaw` — reference for Gateway protocol, slash command definitions (`src/auto-reply/commands-registry.ts`), native command specs, and Telegram bot command registration (`extensions/telegram/src/bot-native-command-menu.ts`).

## Architecture

```
┌─────────────────────┐       ┌──────────────────────────┐
│ OpenClaw Server      │  WS   │ ClawWork Desktop App     │
│ (Node.js process)    │◄────►│ (Electron 34 process)     │
│                     │       │                          │
│ ┌─────────────────┐ │       │  React 19 UI             │
│ │ Gateway :18789  │ │       │  SQLite (metadata index)  │
│ │ Agent Engine    │ │       │  Git Repo (artifact VCS)  │
│ └─────────────────┘ │       │                          │
└─────────────────────┘       └──────────────────────────┘
```

**Gateway-Only Architecture (single WS connection):**

Desktop → Gateway (:18789): `chat.send` sends user messages (`deliver: false` — no external channel delivery), receives Agent streaming replies via `event:"chat"`, and receives tool-call events via `event:"agent"` + `caps:["tool-events"]`.

## Monorepo Structure

```
./
├── package.json              # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json        # ES2022, strict, bundler resolution
├── packages/
│   ├── shared/               # @clawwork/shared — zero-dependency type bridge
│   │   └── src/              # types.ts, protocol.ts, gateway-protocol.ts, constants.ts
│   ├── channel-plugin/       # (excluded from workspace; code retained but not built)
│   └── desktop/              # @clawwork/desktop — Electron app
│       └── src/
│           ├── main/         # Electron main process, ws/, ipc/, db/, artifact/, workspace/
│           ├── preload/      # contextBridge, ClawWorkAPI interface
│           └── renderer/     # React UI: components/, layouts/, stores/, hooks/, i18n/, styles/
```

### Inter-package Dependencies

```
@clawwork/shared ← @clawwork/desktop
```

`@clawwork/shared` has `composite: true` in its tsconfig; desktop references it via `references`.

## Tech Stack

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Framework        | Electron 34 + electron-vite 3               |
| Frontend         | React 19, TypeScript 5.x, Tailwind CSS v4   |
| UI Components    | shadcn/ui (Radix UI + cva + tailwind-merge) |
| Animation        | Framer Motion                               |
| Fonts            | Inter Variable (UI) + JetBrains Mono (code) |
| State Management | Zustand 5                                   |
| Database         | better-sqlite3 + Drizzle ORM                |
| Git Operations   | simple-git                                  |
| Icons            | lucide-react                                |
| Build            | Vite 6 (via electron-vite)                  |
| Packaging        | electron-builder (macOS Universal Binary)   |
| Package Manager  | pnpm 10 workspace                           |

## Development Commands

```bash
pnpm install                              # Install all dependencies
pnpm dev                                  # Dev Desktop App (Electron hot-reload)
pnpm typecheck                            # Type-check shared + desktop
pnpm test                                 # Run all tests
pnpm --filter @clawwork/desktop build     # Package
```

## Key Protocols

### Session Key Format

```
agent:main:clawwork:task:<taskId>
```

Each Task maps to an independent OpenClaw session. Sessions execute in parallel; messages within a session are serial. Gateway broadcasts all session events (no filtering); the client routes by sessionKey to the corresponding Task.

### Gateway WebSocket Protocol

Desktop communicates with Gateway (:18789) via a single WS connection:

**Outbound (Desktop → Gateway):**

| RPC Method      | Purpose                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| `chat.send`     | Send user message (`sessionKey` + `message` + `idempotencyKey`, `deliver: false`) |
| `chat.history`  | Fetch session message history                                                     |
| `sessions.list` | List all sessions                                                                 |

**Inbound (Gateway → Desktop events):**

| Event   | Purpose                                            |
| ------- | -------------------------------------------------- |
| `chat`  | Agent text reply (`payload.message.content[]`)     |
| `agent` | Tool-call events (requires `caps:["tool-events"]`) |

### File Transfer

MVP assumes co-located deployment only: artifact files are copied directly to the workspace artifact directory via local paths. Note the `mediaLocalRoots` security check (v2026.3.2+).

## Theme System

Driven by CSS Variables; dark is the default. Toggle via `<html data-theme="dark|light">`.

Core accent: green `#0FFD0D` (dark) / `#0B8A0A` (light); background `#1C1C1C` / `#FAFAFA`.

All colors are referenced via `var(--xxx)` — no hardcoded hex values.

## Current Status

Phases 1–3.5 complete (monorepo, Gateway integration, full UI with shadcn/ui + Framer Motion, artifact persistence, file browser). Phase 4 (polish + packaging) is next.

See memory files for detailed phase history and technical pitfalls discovered during development.

## Known Issues & Risks

| Issue                                        | Impact                                 | Reference                                                                                                                |
| -------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Incomplete Gateway protocol docs             | Must reverse-engineer from source      | Refer to feishu/dingtalk plugin                                                                                          |
| Gateway broadcasts without session filtering | Client must filter by sessionKey       | [#32579](https://github.com/openclaw/openclaw/issues/32579)                                                              |
| `mediaLocalRoots` security check             | File sends may be rejected             | [#20258](https://github.com/openclaw/openclaw/issues/20258), [#36477](https://github.com/openclaw/openclaw/issues/36477) |
| Session auto-reset at 4 AM                   | Long-running Task context gets cleared | Requires server-side config to disable auto-reset                                                                        |

## Coding Conventions

- TypeScript strict mode; `any` is not allowed
- All colors via CSS Variables — no hardcoded hex values
- Component files go in `layouts/` (layout components) or `components/` (general components), organized by feature
- State management uses Zustand, one store per domain (`taskStore`, `messageStore`, `uiStore`)
- WebSocket message types are defined in `@clawwork/shared`; desktop imports from there

## Debugging

When investigating message duplication, rendering glitches, or state sync issues, use these tools **before** asking the user for more info.

### SQLite Database

The workspace DB is at `<workspace>/clawwork.db`. Query it directly:

```bash
sqlite3 clawwork.db "SELECT id, task_id, role, substr(content,1,50), timestamp FROM messages WHERE task_id='<id>' ORDER BY timestamp"
```

Check for duplicate rows (same role+content, different timestamps — a known past bug pattern):

```bash
sqlite3 clawwork.db "SELECT task_id, role, substr(content,1,50), COUNT(*) as cnt FROM messages GROUP BY task_id, role, content HAVING cnt > 1"
```

### Renderer Debug Events

`useGatewayDispatcher.ts` emits structured events via `debugEvent()`. Open DevTools Console and filter by `[debug]` to see the message lifecycle:

- `renderer.gateway.event.received` — raw Gateway event arrived
- `renderer.chat.delta.applied` — streaming delta appended
- `renderer.chat.final.received` — final event received
- `renderer.chat.finalized` — stream finalized into message
- `renderer.event.dropped.*` — event dropped (missing session, unknown task, etc.)
- `renderer.toolcall.upserted` — tool call added/updated

### Main Process Debug Events

`window.clawwork.reportDebugEvent` forwards renderer events to the main process. These are captured in debug bundle exports (`fix(debug)` PR #125). Use the debug export feature to collect a full event trace.

### Zustand State Inspection

In DevTools Console, directly inspect store state:

```js
// Current messages for a task
window.__ZUSTAND_STORES__?.messageStore?.getState()?.messagesByTask['<taskId>'];

// Or via the module (if source maps available)
// Check streamingByTask for in-progress streams
```

### When to Use Each Tool

| Symptom                        | First check                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Duplicate messages in UI       | SQLite duplicate query → check if DB has dupes or just Zustand store          |
| Messages missing after restart | SQLite row count → check if persist failed                                    |
| Streaming stuck / no final     | DevTools `[debug]` filter → look for `final.received` without `finalized`     |
| Messages from wrong task       | DevTools `[debug]` filter → check `sessionKey` → `taskId` mapping             |
| State sync issues (reconnect)  | DevTools `[debug]` filter → look for `syncFromGateway` calls and their timing |

### Past Bug Patterns

| Pattern                               | Root Cause                                                                                                          | Fix Reference                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Every message doubled after bot reply | `syncFromGateway` triggered 500ms after each `state==='final'`; client vs server timestamp mismatch broke dedup key | Removed post-final sync trigger; changed dedup to content-counting (no timestamp) |
| Startup hydration duplicates          | Race between `hydrateFromLocal` and `syncFromGateway`                                                               | Serialized via `hydrationPromise` + DB unique index (#126)                        |

## Design Documents

- Full design doc: `docs/openclaw-desktop-design.md` (v0.2)
- Design system spec: `docs/design-system.md`
