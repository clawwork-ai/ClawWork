# Debugging Guide

When investigating message duplication, rendering glitches, or state sync issues, use these tools **before** asking the user for more info.

## SQLite Database

The workspace DB is at `<workspace>/clawwork.db`. Query it directly:

```bash
sqlite3 clawwork.db "SELECT id, task_id, role, substr(content,1,50), timestamp FROM messages WHERE task_id='<id>' ORDER BY timestamp"
```

Check for duplicate rows (same role+content, different timestamps — a known past bug pattern):

```bash
sqlite3 clawwork.db "SELECT task_id, role, substr(content,1,50), COUNT(*) as cnt FROM messages GROUP BY task_id, role, content HAVING cnt > 1"
```

## Renderer Debug Events

`useGatewayDispatcher.ts` emits structured events via `debugEvent()`. Open DevTools Console and filter by `[debug]` to see the message lifecycle:

- `renderer.gateway.event.received` — raw Gateway event arrived
- `renderer.chat.delta.applied` — streaming delta appended
- `renderer.chat.final.received` — final event received
- `renderer.chat.finalized` — stream finalized into message
- `renderer.event.dropped.*` — event dropped (missing session, unknown task, etc.)
- `renderer.toolcall.upserted` — tool call added/updated

## Main Process Logs (Gateway WS Traffic)

Gateway WS runs in Electron main process via Node.js `ws` library — **not visible in DevTools Network tab** (that only shows Vite HMR on :5173).

**Terminal output:** `pnpm dev` terminal prints all `DebugLogger` output in real time:

```
[info] [gateway] gateway.connect.start {...}
[debug] [gateway] gateway.req.sent {...}
[debug] [gateway] gateway.event.received {...}
```

**Log file:** persisted as ndjson at `app.getPath('logs')` → `~/Library/Logs/@clawwork/desktop/debug-YYYY-MM-DD.ndjson`

```bash
tail -f ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson | grep gateway
tail -f ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson | grep 'gateway.event.received'
tail -f ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson | jq 'select(.domain=="gateway")'
```

**Renderer forwarding:** `window.clawwork.reportDebugEvent` forwards renderer events to the main process. These are captured in debug bundle exports (`fix(debug)` PR #125).

## Zustand State Inspection

In DevTools Console, directly inspect store state:

```js
window.__ZUSTAND_STORES__?.messageStore?.getState()?.messagesByTask['<taskId>'];
```

## When to Use Each Tool

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
