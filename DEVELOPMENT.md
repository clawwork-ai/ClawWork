# Development

## Mission

ClawWork is the desktop operator client for OpenClaw: Cowork-style parallel task execution, structured context, and local-first artifact management.

Non-goals:

- not an OpenClaw admin console
- not a general IM client
- not a collaboration product

If a change weakens task isolation, artifact traceability, or local-first behavior, it is probably wrong.

Canonical invariant list: `docs/architecture-invariants.md`.

## Fast Start

```bash
pnpm install
pnpm dev
pnpm check
```

Requirements:

- Node >= 20
- pnpm >= 9
- pnpm workspace root only
- macOS for DMG packaging, Windows for NSIS packaging

## Mental Model

ClawWork is a thin but opinionated desktop layer on top of OpenClaw Gateway.

- one desktop app
- one WebSocket connection per configured gateway
- one Task = one OpenClaw session
- many Tasks can run in parallel
- one workspace = SQLite index + per-task artifact directories

Session key format:

```text
agent:<agentId>:clawwork:task:<taskId>
```

Rules that shape the whole codebase:

- Gateway broadcasts all session events; the client must filter by `sessionKey`
- messages are serial within a session, parallel across sessions
- artifact files are local files first, database records second

## System Architecture

```text
OpenClaw Gateway (:18789)
  <- WS -> Electron main process / PWA gateway client
              |- ws/          gateway client, auth, reconnect, heartbeat
              |- ipc/         main <-> renderer boundary
              |- db/          SQLite + Drizzle + FTS
              |- artifact/    file persistence
              |- workspace/   config + workspace bootstrap
              |- context/     file context scan/read/classify
              |- debug/       ring buffer + NDJSON export
              |- net/         safe-fetch, SSRF guard
              |- tray.ts      tray integration
              `- quick-launch.ts
                    <- @clawwork/core ->
                    |- stores/    message, task, room, ui (shared between desktop & pwa)
                    |- services/  dispatcher, session-sync, composer
                    |- ports/     platform abstraction interfaces
                    `- protocol/  message parsing, history normalization
                          <- contextBridge / direct import ->
                          renderer / PWA
```

Design split:

- `packages/shared`: protocol, constants, domain types; zero runtime baggage
- `packages/core`: stores, services, ports, protocol; shared business logic between desktop and pwa
- `packages/desktop`: Electron app; main process owns IO, renderer owns UI state
- `packages/pwa`: Progressive Web App; shares core stores and services with desktop

## Repository Map

```text
packages/
  shared/
    src/
      constants.ts         session keys, ports, reconnect defaults
      gateway-protocol.ts  Gateway request/response/event frames
      types.ts             Task, Message, Artifact, ToolCall domain types
      debug.ts             structured debug event types

  core/
    src/
      index.ts             public API surface
      stores/              Zustand stores — the single source of truth
        message-store.ts   message lifecycle, streaming, finalization
        task-store.ts      task CRUD, session adoption, selection
        ui-store.ts        panels, modals, preferences
        room-store.ts      ensemble task rooms, conductor/performer orchestration
        team-store.ts      team CRUD, TeamsHub install state
        system-session-store.ts  system-level session tracking
      services/            business logic
        gateway-dispatcher.ts  sole event router for all Gateway messages
        session-sync.ts    reconcile local state with Gateway sessions
        chat-composer.ts   message construction and send orchestration
        auto-title.ts      task auto-titling from first message
        error-classify.ts  error categorization for user display
        team-parser.ts     parse team definition files
        team-installer.ts  install teams from TeamsHub or local definitions
        system-session-service.ts  system session lifecycle
      protocol/            Gateway protocol utilities
        normalize-history.ts  history response → local message format
        parse-content.ts   content block parsing
        types.ts           protocol-specific types
      ports/               dependency inversion interfaces
        gateway-transport.ts  WS transport abstraction
        persistence.ts     DB abstraction for desktop/pwa
        platform.ts        platform detection
        notifications.ts   notification abstraction
        settings.ts        settings abstraction

  desktop/
    src/main/
      index.ts             bootstrap order is deliberate; do not randomize it
      ws/                  GatewayClient and connection lifecycle
      ipc/                 renderer-safe API surface
      db/                  schema, FTS, queries
      artifact/            save file, detect mime, record DB
      workspace/           app config and workspace init
      context/             @ file context indexing and bounded reads
      debug/               observability and export bundle
      net/                 safe-fetch, SSRF guard

    src/preload/
      index.ts             `window.clawwork`
      clawwork.d.ts        renderer contract

    src/renderer/
      App.tsx              shell, setup flow, global hotkeys
      stores/              Zustand domain stores
      layouts/             app regions
      components/          task/chat/artifact widgets
      hooks/               gateway bootstrap, resize, tray, update, voice
      lib/                 session sync, slash commands, clipboard, voice
      styles/              theme.css + typography.css + design-tokens.ts
      i18n/                locale resources
```

## Core Modules

### 1. Gateway integration

Source of truth for task execution.

- `src/main/ws/gateway-client.ts` handles connect, auth challenge, request tracking, reconnect, heartbeat, and event dispatch
- only use protocol types from `@clawwork/shared`
- never couple renderer state directly to raw Gateway frames
- if Gateway behavior looks odd, check `~/git/openclaw` before inventing local workarounds

Supported core RPCs:

- `chat.send`
- `chat.history`
- `sessions.list`

Important inbound events:

- `chat`
- `agent`
- approval-related events routed into approval UI

### 2. Task and message model

Task is the product primitive, not chat thread cosmetics.

- `taskStore`: task lifecycle, selection, session adoption
- `messageStore`: append, stream, finalize, map events to task
- `roomStore`: ensemble task rooms, conductor/performer orchestration
- `teamStore`: team definitions, TeamsHub discovery and install state
- `systemSessionStore`: system-level session tracking
- session sync reconstructs local tasks from Gateway sessions and histories
- every bug here is usually a routing bug, session-key bug, or optimistic UI bug

### 3. Workspace and artifacts

ClawWork persists AI output locally and treats files as first-class product value.

- workspace root contains `.clawwork.db`, `.clawwork-debug/`, and per-task directories
- `artifact/` saves files and records metadata
- never design features that assume cloud-only persistence
- preserve stable local paths; users may script against the workspace

### 4. Database and search

SQLite is metadata index, not the file store.

- `tasks`, `messages`, `artifacts` are the core tables
- FTS5 powers title/content/name search
- prefer additive schema evolution; avoid churn in high-traffic tables without reason

### 5. Renderer architecture

Renderer is a structured operator UI, not a generic chat page.

- three-panel layout is fundamental
- use one Zustand store per domain
- keep selectors narrow; avoid broad subscriptions
- `useGatewayBootstrap` is the event-routing choke point
- reusable UI belongs in `components/`; page/region composition belongs in `layouts/`

### 6. File context and developer workflows

Context attachment is part of the product.

- `src/main/context/` scans files, classifies tiers, and reads with size limits
- optimize for useful context, not full-repo dumping
- keep security and file-size boundaries explicit

### 7. Debuggability

If a bug is hard to explain, improve observability first.

- event names use `<domain>.<noun>.<verb>`
- ring buffer + daily NDJSON live under `.clawwork-debug/`
- export bundle is the preferred support artifact

## Key Data Flows

### Send message

```text
ChatInput
-> taskStore adds user message
-> IPC `ws:send-message`
-> GatewayClient `chat.send`
-> Gateway emits `chat`
-> useGatewayBootstrap routes by sessionKey
-> messageStore streams/finalizes
-> renderer updates
```

### Discover existing tasks

```text
sessions.list
-> chat.history per session
-> parse session metadata/title
-> persist DB rows
-> taskStore adopts local tasks
```

### Approval flow

```text
Gateway approval event
-> approvalStore
-> ApprovalDialog
-> IPC resolve call
-> Gateway approval resolution RPC
```

## Development Rules

- TypeScript strict; `any` is a bug unless proven otherwise
- no comments in code
- desktop imports shared protocol/types; do not fork types locally
- main process owns filesystem, DB, WS, and OS integration
- preload is the only renderer bridge; keep it explicit and typed
- prefer simple data flow over clever abstractions
- preserve task isolation; avoid hidden cross-task state
- do not hardcode colors; use design tokens and CSS variables only

Naming and layout:

- `PascalCase` components
- `camelCase` hooks and utilities
- `layouts/` for composed regions
- `components/ui/` for shadcn primitives

## UI and Design System

Before touching UI, inspect `theme.css`, `design-tokens.ts`, and `scripts/check-ui-contract.mjs`.

Non-negotiables:

- dark-first product language with light theme parity
- accent is green: `#0FFD0D` dark, `#0B8A0A` light
- backgrounds, borders, focus rings, and depth come from CSS variables in `theme.css`
- `design-tokens.ts` only holds motion presets and token keys for TS consumers
- typography is Inter Variable + JetBrains Mono
- motion should be meaningful and respect `prefers-reduced-motion`
- every interactive control needs default, hover, active, focused, disabled, and loading states

Do not ship:

- hardcoded hex colors in components
- flat generic UI that ignores the design system
- renderer logic that bypasses shared tokens or utility primitives

## Commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm test
pnpm check
pnpm check:architecture
pnpm check:ui-contract
pnpm check:renderer-copy
pnpm check:i18n
pnpm check:dead-code
pnpm dev:pwa
pnpm dev:website
pnpm dev:slides
pnpm test:e2e
pnpm test:e2e:smoke
pnpm test:e2e:gateway
pnpm test:coverage
pnpm clean
pnpm --filter @clawwork/desktop build
pnpm --filter @clawwork/desktop build:mac
pnpm --filter @clawwork/desktop build:win
```

Default local gate before push:

```bash
pnpm check
```

Run E2E when changing Gateway integration, task routing, setup flow, packaging assumptions, or critical UI workflows.

## GitHub Workflow

### Issues

Use the templates. Keep them tight.

- bug report: shortest repro, visible impact, affected area, environment, logs
- feature request: problem first, desired behavior second, user value third
- if the issue starts with implementation fantasy and no problem statement, push back

### Branches

Branch from `main`.

- `feat/<topic>`
- `fix/<topic>`
- `docs/<topic>`
- `refactor/<topic>`
- `build/<topic>`
- `chore/<topic>`

### Pull requests

PR title must start with one approved prefix:

- `[Feat]`
- `[Fix]`
- `[UI]`
- `[Docs]`
- `[Refactor]`
- `[Build]`
- `[Chore]`

PR body must cover:

- what changed
- why it was needed
- linked issues
- validation actually run
- screenshots or recordings for UI changes
- release note block: `NONE` for non-user-facing work

### CI

`pr-check.yml` is the baseline gate:

- `quality`: `pnpm lint` + `pnpm format:check`, plus conditional architecture, UI, i18n, and dead-code checks
- `test`: package-scoped typecheck and unit tests based on the changed workspace area
- `build`: Linux smoke package for desktop-affecting pull requests

`e2e.yml` adds smoke and Gateway integration coverage only when the affected files justify it.

Local expectation: do not open a PR that obviously cannot survive CI.

### Releases

- push a release tag on `main` to trigger `release.yml`
- supported tags: `vX.Y.Z`, `vX.Y.Z-beta.N`, `vX.Y.Z-rc.N`, `vX.Y.Z-alpha.N`
- release verifies tag format and tag/package version match
- prerelease tags publish GitHub prereleases
- stable releases trigger Homebrew update
- artifacts: macOS arm64 + macOS x64 + Windows x64 + Linux x64

## OpenClaw-Specific Rules

- the authoritative protocol behavior lives in OpenClaw, not in guesses here
- reference repo: `~/git/openclaw`
- likely source locations: Gateway protocol handling, slash command registry, Telegram bot native command menu
- when ClawWork and OpenClaw disagree, verify the server behavior first
- avoid compensating for undocumented server behavior with renderer hacks unless unavoidable

## Known Failure Modes

- missing UI updates after valid Gateway response: usually event filtering or store routing
- duplicate or orphaned messages: usually idempotency/session-key mistakes
- file send or artifact issues: check `mediaLocalRoots` assumptions and local path handling
- long-running task context loss: OpenClaw may auto-reset sessions around 4 AM
- weird protocol gaps: docs are incomplete; inspect OpenClaw source

## Change Heuristics

Before coding, ask these questions:

- does this preserve Task as the primary unit?
- does this keep session routing explicit?
- does this respect local-first artifact persistence?
- does this belong in main, preload, shared, or renderer?
- does this follow `theme.css`, `design-tokens.ts`, and `pnpm check:ui-contract` if UI is involved?
- will `pnpm check` and relevant E2E still pass?

If not, stop and fix the design first.

## First Files To Read

For a new engineer or AI agent, read in this order:

1. `DEVELOPMENT.md`
2. `docs/architecture-invariants.md`
3. `packages/desktop/src/renderer/styles/theme.css`
4. `packages/desktop/src/renderer/styles/design-tokens.ts`
5. `scripts/check-ui-contract.mjs`
6. `docs/openclaw-desktop-design.md`
7. `packages/shared/src/constants.ts`
8. `packages/shared/src/gateway-protocol.ts`
9. `packages/desktop/src/main/index.ts`
10. `packages/desktop/src/main/ws/gateway-client.ts`
11. `packages/desktop/src/renderer/App.tsx`
12. `packages/desktop/src/renderer/hooks/useGatewayBootstrap.ts`

That is enough context to stop being dangerous.
