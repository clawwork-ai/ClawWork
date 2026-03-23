# Message Persistence Architecture — Full Reference

> This file contains the detailed architecture. The CRITICAL invariant (single-writer table + prohibited patterns) is in `CLAUDE.md`.

## Assistant Message State Machine

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

## Key Functions and Their Roles

| Function              | Role                                                                                                                                                      | MUST NOT                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `finalizeStream`      | State transition: streaming → pending. Clears streaming buffers unconditionally.                                                                          | Write to DB. Write to `messagesByTask`.                                             |
| `syncSessionMessages` | Runtime sync: pending → canonical. Fetches `chat.history`, persists to DB, calls `promotePending`. Serialized per task.                                   | Be called for `error`/`aborted` events.                                             |
| `syncFromGateway`     | Startup sync: recover history from Gateway on connect. For existing tasks, only syncs assistant messages. For new tasks, syncs all.                       | Write user messages for existing tasks (ChatInput is the sole user message writer). |
| `promotePending`      | Atomic Zustand update: append canonical to `messagesByTask` + merge pending's `thinkingContent`/`toolCalls`/`runId` + clear pending. Single `set()` call. | Execute as two separate updates (would cause UI flicker/duplication).               |
| `retrySyncPending`    | On Gateway reconnect, retries sync for all tasks with pending messages.                                                                                   | —                                                                                   |

## Sync Timing

- **Runtime sync**: Triggered immediately after each `state === 'final'` event. Retries with backoff (2s, 4s, 8s) on failure.
- **Startup sync**: Triggered once on first Gateway connect. Recovers messages that were pending when the app crashed.
- **Reconnect sync**: `retrySyncPending()` retries all pending tasks when Gateway reconnects.

## DB Unique Index

`messages_dedup ON messages(task_id, role, timestamp)` — This is a **single-writer idempotency guard**, not a dedup strategy. Since the sync path is the sole writer for assistant messages, and all timestamps come from Gateway, the index prevents accidental re-insertion of the same message if sync runs twice.

## Protocol Limitation

OpenClaw Gateway `chat.history` does not return per-message IDs. The Gateway's `timestamp` (epoch ms) is the closest to a stable message identifier. The `runId` is present in streaming events but not in history responses. This is why single-writer architecture is necessary — without message IDs, any dual-write scheme requires fragile dedup.

## Past Bug Patterns

| Pattern                                 | Root Cause                                                                                                                                                              | Fix                                                                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assistant message doubled after restart | `finalizeStream` AND `syncFromGateway` both wrote assistant messages to DB (dual-write). Content/timestamp differed between streaming accumulation and Gateway history. | Eliminated dual-write: `finalizeStream` only writes to Zustand pending state; sync path is the sole DB writer for assistant messages. See "Message Persistence Architecture" section. |
| Startup hydration duplicates            | Race between `hydrateFromLocal` and `syncFromGateway`                                                                                                                   | Serialized via `hydrationPromise` + DB unique index (#126)                                                                                                                            |
