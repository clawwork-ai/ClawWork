# Debugging Guide

When investigating message duplication, rendering glitches, or state sync issues, use these tools **before** asking the user for more info.

## SQLite Database

The workspace DB is at `<workspace>/.clawwork.db`. Query it directly:

```bash
sqlite3 .clawwork.db "SELECT id, task_id, role, substr(content,1,50), timestamp FROM messages WHERE task_id='<id>' ORDER BY timestamp"
```

Check for duplicate rows (same role+content, different timestamps — a known past bug pattern):

```bash
sqlite3 .clawwork.db "SELECT task_id, role, substr(content,1,50), COUNT(*) as cnt FROM messages GROUP BY task_id, role, content HAVING cnt > 1"
```

## Renderer Debug Events

`useGatewayBootstrap.ts` emits structured events via `debugEvent()`. Open DevTools Console and filter by `[debug]` to see the message lifecycle:

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

## Conversation Diagnosis Runbook

Given a `sessionKey` (obtain via task right-click → "Copy Session Key" in dev mode, or `pnpm dev`), follow these steps to diagnose message flow issues.

Session key format: `agent:<agentId>:clawwork:task:<taskId>` (may include device segment: `agent:<agentId>:clawwork:<deviceId>:task:<taskId>`)

### Step 1: Locate DB and Task Metadata

```bash
# Default workspace (override in ~/Library/Application Support/ClawWork/clawwork-config.json)
DB=~/ClawWork-Workspace/.clawwork.db

# Find task by sessionKey
sqlite3 "$DB" "SELECT id, session_key, title, status, ensemble, gateway_id, created_at FROM tasks WHERE session_key = '<SESSION_KEY>'"
```

### Step 2: Extract Local Message Flow

```bash
sqlite3 -header -column "$DB" \
  "SELECT role, timestamp, session_key, agent_id, substr(content,1,120) AS preview
   FROM messages
   WHERE task_id = '<TASK_ID>'
   ORDER BY timestamp ASC"
```

For LLM consumption (JSON):

```bash
sqlite3 -json "$DB" \
  "SELECT id, role, timestamp, session_key, agent_id, run_id, content
   FROM messages WHERE task_id = '<TASK_ID>' ORDER BY timestamp ASC" \
  > /tmp/messages.json
```

### Step 3: Extract Gateway-Side Events

The ndjson debug log captures all `gateway.event.received` payloads including full chat/agent events.

```bash
# Today's events for this session
grep '<SESSION_KEY>' ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson \
  | jq 'select(.event=="gateway.event.received")'

# Chat events only (streaming deltas, final, error, aborted)
grep '<SESSION_KEY>' ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson \
  | jq 'select(.data.event=="chat")'

# Agent events (tool calls, lifecycle)
grep '<SESSION_KEY>' ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson \
  | jq 'select(.data.event=="agent")'
```

### Step 4: Compare and Diagnose

```bash
# Count: local DB assistant messages vs Gateway chat final events
echo "--- Local DB assistant messages ---"
sqlite3 "$DB" "SELECT COUNT(*) FROM messages WHERE task_id = '<TASK_ID>' AND role = 'assistant'"

echo "--- Gateway final events ---"
grep '<SESSION_KEY>' ~/Library/Logs/@clawwork/desktop/debug-$(date +%Y-%m-%d).ndjson \
  | jq 'select(.data.event=="chat" and .data.data.state=="final")' | jq -s 'length'

# Check for duplicates (dedup index should prevent, but verify)
sqlite3 "$DB" \
  "SELECT session_key, role, timestamp, COUNT(*) AS cnt
   FROM messages WHERE task_id = '<TASK_ID>'
   GROUP BY session_key, role, timestamp HAVING cnt > 1"

# Check for empty or NO_REPLY assistant messages (should have been cleaned)
sqlite3 "$DB" \
  "SELECT id, timestamp, length(content) FROM messages
   WHERE task_id = '<TASK_ID>' AND role = 'assistant'
   AND (content = '' OR TRIM(content) = 'NO_REPLY')"

# Check message ordering (user/assistant should alternate)
sqlite3 -header -column "$DB" \
  "SELECT role, timestamp, agent_id FROM messages
   WHERE task_id = '<TASK_ID>' ORDER BY timestamp ASC"
```

### Step 5: Ensemble Task Extra Checks

For tasks with `ensemble = 1` (multi-agent), check per-agent message distribution:

```bash
sqlite3 -header -column "$DB" \
  "SELECT agent_id, session_key, COUNT(*) AS msg_count,
          MIN(timestamp) AS first_msg, MAX(timestamp) AS last_msg
   FROM messages WHERE task_id = '<TASK_ID>'
   GROUP BY agent_id, session_key"

# Check room status
sqlite3 -header -column "$DB" \
  "SELECT * FROM task_rooms WHERE task_id = '<TASK_ID>'"

sqlite3 -header -column "$DB" \
  "SELECT * FROM task_room_sessions WHERE task_id = '<TASK_ID>'"
```

### Known Anomaly Patterns

| Pattern                                                                      | Likely Cause                                          | Reference                                      |
| ---------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Same assistant message appears twice with different timestamps               | Dual-write bug (should not occur post-#126)           | `docs/message-persistence.md`                  |
| Assistant message in DB but `session_key` is NULL                            | Message persisted before session_key migration        | Check migration in `db/index.ts`               |
| Gateway log shows `state=final` but no matching DB row                       | `syncSessionMessages` failed or pending promote stuck | Check `session-sync.ts` retry logic            |
| Messages from wrong `agent_id` in a non-ensemble task                        | Session key routing mismatch                          | Check `sessionKey` filter in dispatcher        |
| `state=error` or `state=aborted` in Gateway log, but assistant message in DB | Prohibited: error/aborted should NOT trigger persist  | Check `finalizeStream` → only `final` promotes |
