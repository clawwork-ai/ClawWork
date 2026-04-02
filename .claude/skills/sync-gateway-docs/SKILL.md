# Skill: sync-gateway-docs

Sync the three ClawWork Gateway reference documents against the latest OpenClaw source code.

## When to Use

- Periodically (e.g., after OpenClaw releases or major Gateway changes)
- When adding a new Gateway feature to ClawWork and the docs feel stale
- User says: "更新 Gateway 文档", "sync gateway docs", or similar

## Documents

| Doc | Path | Purpose |
|-----|------|---------|
| Whitepaper | `docs/openclaw-gateway-whitepaper.md` | Protocol contract reference — what Gateway exposes |
| Source Guide | `docs/openclaw-gateway-source-guide.md` | Code navigation — where to find things in openclaw |
| Capability Map | `docs/clawwork-gateway-capability-map.md` | Usage inventory — what ClawWork actually uses |

## Prerequisites

- OpenClaw repo checked out at `~/git/openclaw` with latest `main`
- ClawWork repo at `~/git/clawwork/main`

## Execution

Run all three phases. Each phase is independent and can be run in parallel via subagents.

### Phase 1: Update Whitepaper

The whitepaper is the protocol contract. It must match the current openclaw source exactly.

**Step 1 — Detect changes.** Read the following openclaw files and diff against what the whitepaper currently documents:

| What to check | OpenClaw source file |
|----------------|---------------------|
| Protocol version | `src/gateway/protocol/schema/protocol-schemas.ts` → `PROTOCOL_VERSION` |
| Method list | `src/gateway/server-methods-list.ts` → `BASE_METHODS` (count and diff) |
| Event list | `src/gateway/server-methods-list.ts` → `GATEWAY_EVENTS` (count and diff) |
| Frame schemas | `src/gateway/protocol/schema/frames.ts` → ConnectParams, HelloOk, ErrorShape |
| Client IDs/modes/caps | `src/gateway/protocol/client-info.ts` → GATEWAY_CLIENT_IDS, MODES, CAPS |
| Chat schemas | `src/gateway/protocol/schema/logs-chat.ts` |
| Session schemas | `src/gateway/protocol/schema/sessions.ts` |
| Agent schemas | `src/gateway/protocol/schema/agent.ts` |
| Agent/model/skill schemas | `src/gateway/protocol/schema/agents-models-skills.ts` |
| Cron schemas | `src/gateway/protocol/schema/cron.ts` |
| Error codes | `src/gateway/protocol/schema/error-codes.ts` |
| Constants | `src/gateway/server-constants.ts`, `src/gateway/handshake-timeouts.ts` |
| Scope mappings | `src/gateway/method-scopes.ts` |
| Event scope guards | `src/gateway/server-broadcast.ts` → EVENT_SCOPE_GUARDS |
| Rate limiting | `src/gateway/auth-rate-limit.ts` |
| Snapshot/presence | `src/gateway/protocol/schema/snapshot.ts` |

**Step 2 — Apply changes.** For each detected difference:
- New methods → add to §5 method list + add schema details if it's a major domain
- New events → add to §4 event table with scope guard + dropIfSlow info
- Changed schemas → update the TypeScript snippets inline
- Changed constants → update §2.4 constants table
- New/changed client IDs → update §3.3 tables

**Step 3 — Update metadata.** Bump the version line at the top of the whitepaper:
```
> Source of truth: reverse-engineered from `~/git/openclaw` (version YYYY.M.D)
> Date: YYYY-MM-DD
```

**Step 4 — Verify inline sources.** Every section must have a `> Source:` annotation. If a new section was added, add one.

### Phase 2: Update Source Guide

The source guide maps code structure. It must reflect the current directory layout and file responsibilities.

**Step 1 — Detect structural changes.** Check:
- `ls src/gateway/protocol/schema/` — any new/removed schema files?
- `ls src/gateway/server-methods/` — any new/removed handler files?
- `ls src/gateway/server/` — any new/removed infrastructure files?
- `ls src/gateway/server/ws-connection/` — any changes to auth/handshake files?

**Step 2 — Apply changes.**
- New schema files → add to §2.1 directory map
- New handler files → add to §3.1 directory map with methods they handle
- New infrastructure files → add to §4.2 key infrastructure table
- Changed file responsibilities → update descriptions

**Step 3 — Verify flow diagrams.** If the request/auth/broadcast flow changed, update the ASCII diagrams in §4.1, §4.3.

### Phase 3: Update Capability Map

The capability map tracks what ClawWork uses. It must reflect the current ClawWork code.

**Step 1 — Scan ClawWork RPC calls.** Read:
- `packages/desktop/src/main/ws/gateway-client.ts` — all `sendReq()` calls (the method string is the first argument)
- `packages/desktop/src/main/ipc/ws-handlers.ts` — all `ipcMain.handle()` registrations

**Step 2 — Scan ClawWork event handlers.** Read:
- `packages/core/src/services/gateway-dispatcher.ts` — the dispatch switch/if-else block
- `packages/desktop/src/main/ws/gateway-client.ts` — the `handleEvent()` method

**Step 3 — Diff against existing doc.**
- New RPC calls in ClawWork → move from §2 (unused) to §1 (used), add location + IPC channel
- Removed RPC calls → move from §1 to §2
- New event handlers → move from §3.2 (unhandled) to §3.1 (handled)
- New Gateway methods (from Phase 1) not in ClawWork → add to §2 (unused)

**Step 4 — Update ConnectParams (§5).** Read the current connect handshake in `gateway-client.ts` and verify client.id, client.mode, caps, scopes, device fields match.

**Step 5 — Update coverage summary (§8).** Recalculate percentages.

## Output

After updating, report:
1. What changed in each document (bullet list)
2. New Gateway capabilities that ClawWork could benefit from (if any)
3. Any discrepancies found (e.g., ClawWork calling a removed method)

## Rules

- Do not invent information. Every claim must trace to a source file.
- Do not change the document structure (section numbers, headings) without reason.
- Preserve all `> Source:` inline annotations.
- Use the whitepaper as the intermediate reference: Phase 1 updates it from openclaw, Phase 3 references it for the full capability list.
- If a change is ambiguous (e.g., a method was renamed vs. removed+added), check `git log --oneline -20 -- <file>` in the openclaw repo.
