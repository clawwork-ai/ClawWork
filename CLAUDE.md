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

## Message Persistence Architecture (CRITICAL — do not modify without full review)

### Root Principle: Single Writer per Message Role

Each message role has exactly ONE code path that writes to the SQLite database. Violating this invariant **will** cause message duplication. This architecture was established after multiple duplication regressions caused by dual-write patterns.

| Message Role | Sole DB Writer                            | Source of Truth            | File              |
| ------------ | ----------------------------------------- | -------------------------- | ----------------- |
| `user`       | `ChatInput` (after `chat.send` succeeds)  | Client (we are the author) | `ChatInput.tsx`   |
| `assistant`  | `syncSessionMessages` / `syncFromGateway` | Gateway (`chat.history`)   | `session-sync.ts` |
| `system`     | `addMessage` (client-generated)           | Client (local status)      | `messageStore.ts` |

### Assistant Message State Machine

```
                                         sync succeeds
  ┌────────┐  first delta  ┌───────────┐  state=final  ┌─────────┐  ──────────►  ┌───────────┐
  │  idle  │ ────────────► │ streaming │ ────────────► │ pending │               │ canonical │
  └────────┘               └───────────┘               └─────────┘  ◄──────────  └───────────┘
                                                           │        sync fails       ▲
                                                           └─► retry (backoff) ──────┘
                                                           └─► reconnect ────────────┘
                                                           └─► startup sync ─────────┘
```

| State     | Storage                          | In DB | In UI                          |
| --------- | -------------------------------- | ----- | ------------------------------ |
| streaming | `streamingByTask[taskId]`        | No    | Yes (live text)                |
| pending   | `pendingAssistantByTask[taskId]` | No    | Yes (finalized, awaiting sync) |
| canonical | `messagesByTask[taskId]`         | Yes   | Yes (persisted history)        |

**Invariant**: These three storages never contain the same message simultaneously. Streaming becomes pending on `final`. Pending becomes canonical on sync success. Pending is cleared (not promoted) on `error`/`aborted`.

### Key Functions and Their Roles

| Function              | Role                                                                                                                                                      | MUST NOT                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `finalizeStream`      | State transition: streaming → pending. Clears streaming buffers unconditionally.                                                                          | Write to DB. Write to `messagesByTask`.                                             |
| `syncSessionMessages` | Runtime sync: pending → canonical. Fetches `chat.history`, persists to DB, calls `promotePending`. Serialized per task.                                   | Be called for `error`/`aborted` events.                                             |
| `syncFromGateway`     | Startup sync: recover history from Gateway on connect. For existing tasks, only syncs assistant messages. For new tasks, syncs all.                       | Write user messages for existing tasks (ChatInput is the sole user message writer). |
| `promotePending`      | Atomic Zustand update: append canonical to `messagesByTask` + merge pending's `thinkingContent`/`toolCalls`/`runId` + clear pending. Single `set()` call. | Execute as two separate updates (would cause UI flicker/duplication).               |
| `retrySyncPending`    | On Gateway reconnect, retries sync for all tasks with pending messages.                                                                                   | —                                                                                   |

### Sync Timing

- **Runtime sync**: Triggered immediately after each `state === 'final'` event. Retries with backoff (2s, 4s, 8s) on failure.
- **Startup sync**: Triggered once on first Gateway connect. Recovers messages that were pending when the app crashed.
- **Reconnect sync**: `retrySyncPending()` retries all pending tasks when Gateway reconnects.

### DB Unique Index

`messages_dedup ON messages(task_id, role, timestamp)` — This is a **single-writer idempotency guard**, not a dedup strategy. Since the sync path is the sole writer for assistant messages, and all timestamps come from Gateway, the index prevents accidental re-insertion of the same message if sync runs twice.

### PROHIBITED Patterns

**DO NOT introduce any of the following. Each has caused regressions:**

- `finalizeStream` calling `persistMessage` — Creates dual-write with sync path
- Content-based dedup (`role:content` matching) — Fragile; streaming content differs from Gateway content (leading whitespace, encoding)
- `content.trim()` as identity/dedup mechanism — Message content is user data, not an identity key
- Timestamp-based dedup as the "fix" — Timestamps are a side effect of single-writer, not the mechanism that prevents duplication
- Persisting assistant messages from any path other than `session-sync.ts`

### Protocol Limitation

OpenClaw Gateway `chat.history` does not return per-message IDs. The Gateway's `timestamp` (epoch ms) is the closest to a stable message identifier. The `runId` is present in streaming events but not in history responses. This is why single-writer architecture is necessary — without message IDs, any dual-write scheme requires fragile dedup.

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

### Main Process Logs (Gateway WS Traffic)

Gateway WS runs in Electron main process via Node.js `ws` library — **not visible in DevTools Network tab** (that only shows Vite HMR on :5173).

**Terminal output:** `pnpm dev` terminal prints all `DebugLogger` output in real time:

```
[info] [gateway] gateway.connect.start {...}
[debug] [gateway] gateway.req.sent {...}
[debug] [gateway] gateway.event.received {...}
```

**Log file:** persisted as ndjson at `app.getPath('logs')` → `~/Library/Logs/@clawwork/desktop/debug-YYYY-MM-DD.ndjson`

```bash
# Real-time Gateway traffic
tail -f ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson | grep gateway

# Filter specific event types
tail -f ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson | grep 'gateway.event.received'

# Pretty-print with jq
tail -f ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson | jq 'select(.domain=="gateway")'
```

**Renderer forwarding:** `window.clawwork.reportDebugEvent` forwards renderer events to the main process. These are captured in debug bundle exports (`fix(debug)` PR #125).

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
| Gateway WS not connecting      | `pnpm dev` terminal → look for `gateway.connect.start` / `gateway.ws.error`   |
| Gateway request timeout/error  | `tail -f` ndjson log → filter `gateway.req.timeout` or `gateway.res.error`    |
| Gateway event not reaching UI  | ndjson log confirms `gateway.event.received` → DevTools check renderer side   |

### Past Bug Patterns

| Pattern                                 | Root Cause                                                                                                                                                              | Fix                                                                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assistant message doubled after restart | `finalizeStream` AND `syncFromGateway` both wrote assistant messages to DB (dual-write). Content/timestamp differed between streaming accumulation and Gateway history. | Eliminated dual-write: `finalizeStream` only writes to Zustand pending state; sync path is the sole DB writer for assistant messages. See "Message Persistence Architecture" section. |
| Startup hydration duplicates            | Race between `hydrateFromLocal` and `syncFromGateway`                                                                                                                   | Serialized via `hydrationPromise` + DB unique index (#126)                                                                                                                            |

## Design Documents

- Full design doc: `docs/openclaw-desktop-design.md` (v0.2)
- Design system spec: `docs/design-system.md`
