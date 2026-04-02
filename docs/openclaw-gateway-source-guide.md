# OpenClaw Gateway Source Code Navigation Guide

> For ClawWork developers who need to read, trace, and debug OpenClaw Gateway internals.
> Prerequisite: read `openclaw-gateway-whitepaper.md` first for the protocol contract.
> Repo: `~/git/openclaw` (TypeScript, ESM, pnpm)

---

## 0. Before You Start

```bash
cd ~/git/openclaw
pnpm install          # install deps
pnpm build            # verify build (also generates types)
```

Tools you'll use constantly:

| Tool    | Purpose                              | Example                                                |
| ------- | ------------------------------------ | ------------------------------------------------------ |
| ripgrep | Search code by pattern               | `rg "chat.send" src/gateway/`                          |
| TypeBox | Schema definitions (runtime + types) | `Type.Object({ ... })`                                 |
| vitest  | Run tests                            | `pnpm test -- src/gateway/server-methods/chat.test.ts` |

The Gateway codebase is ~440 TypeScript files under `src/gateway/`. Don't try to read everything. This guide teaches you **where to look** for what you need.

---

## 1. Mental Model: Four Layers

```
┌────────────────────────────────────────────────────┐
│ Layer 4: Protocol Schema (the contract)            │
│   src/gateway/protocol/schema/*.ts                 │
│   What: TypeBox definitions for every frame,       │
│         method param, response, and event payload   │
│   When to read: "What fields does X accept/return?"│
├────────────────────────────────────────────────────┤
│ Layer 3: Method Handlers (the logic)               │
│   src/gateway/server-methods/*.ts                  │
│   What: One file per domain (chat, sessions, etc.) │
│   When to read: "What does X actually do?"         │
├────────────────────────────────────────────────────┤
│ Layer 2: Server Infrastructure (the plumbing)      │
│   src/gateway/server/*.ts                          │
│   src/gateway/server-broadcast.ts                  │
│   src/gateway/server-methods.ts (dispatcher)       │
│   What: WS connection, auth, dispatch, broadcast   │
│   When to read: "Why is my frame rejected/dropped?"│
├────────────────────────────────────────────────────┤
│ Layer 1: Server Startup (the bootstrap)            │
│   src/gateway/server.impl.ts                       │
│   What: Wires everything together                  │
│   When to read: "How does the Gateway initialize?" │
└────────────────────────────────────────────────────┘
```

**Rule of thumb:** Start at Layer 4 (schema) for "what", go to Layer 3 (handlers) for "how", drop to Layer 2 only when debugging connection/auth/broadcast issues.

---

## 2. Layer 4: Protocol Schema — The Contract

### 2.1 Directory Map

```
src/gateway/protocol/
├── schema.ts                    # barrel — re-exports everything
├── index.ts                     # protocol validators (AJV compiled)
├── client-info.ts               # client IDs, modes, capabilities
├── AGENTS.md (= CLAUDE.md)     # boundary rules
└── schema/
    ├── protocol-schemas.ts      # ★ MASTER REGISTRY — PROTOCOL_VERSION, all schema exports
    ├── primitives.ts            # shared types: NonEmptyString, SessionKey, InputProvenance
    ├── frames.ts                # ★ RequestFrame, ResponseFrame, EventFrame, ConnectParams, HelloOk
    ├── error-codes.ts           # ErrorCodes enum
    ├── snapshot.ts              # PresenceEntry, HealthSnapshot, SessionDefaults, Snapshot
    ├── logs-chat.ts             # chat.send/history/abort/inject params + ChatEvent
    ├── agent.ts                 # agent/send/poll/wake params + AgentEvent
    ├── sessions.ts              # sessions.* params (create/send/abort/list/patch/reset/delete/compact/usage)
    ├── agents-models-skills.ts  # agents.*/models.list/tools.catalog/tools.effective/skills.*
    ├── config.ts                # config.* params
    ├── cron.ts                  # cron.* params + schedule/payload/delivery types
    ├── nodes.ts                 # node.* params
    ├── devices.ts               # device.* params
    ├── exec-approvals.ts        # exec.approval.* params
    ├── plugin-approvals.ts      # plugin.approval.* params
    ├── channels.ts              # channels.status, talk.speak, web.login.* params
    ├── push.ts                  # push.test params
    ├── secrets.ts               # secrets.reload/resolve params
    ├── wizard.ts                # wizard.* params
    └── types.ts                 # utility type helpers
```

### 2.2 How to Read a Schema File

Every schema uses `@sinclair/typebox`. Pattern:

```typescript
import { Type } from '@sinclair/typebox';

export const ChatSendParamsSchema = Type.Object(
  {
    sessionKey: ChatSendSessionKeyString, // required field
    message: Type.String(), // required field
    thinking: Type.Optional(Type.String()), // optional field
    deliver: Type.Optional(Type.Boolean()),
    idempotencyKey: NonEmptyString, // required field
  },
  { additionalProperties: false },
);
```

**Reading rules:**

- `Type.Object({ ... })` = JSON object shape
- `Type.Optional(...)` = field is optional
- `Type.String()` / `Type.Integer()` / `Type.Boolean()` = primitives
- `Type.Union([Type.Literal("a"), Type.Literal("b")])` = enum
- `Type.Array(...)` = array
- `Type.Unknown()` = any (opaque to validation)
- `{ additionalProperties: false }` = strict — extra fields rejected
- Named strings like `NonEmptyString`, `ChatSendSessionKeyString` = refined primitives in `primitives.ts`

### 2.3 The Master Registry

`protocol-schemas.ts` is the single source of truth for what version the protocol is at and what schemas exist:

```typescript
export const PROTOCOL_VERSION = 3;
```

If you need to know "does method X exist in the current protocol?", search this file first.

### 2.4 Practical Workflow: Tracing a Method's Schema

Example: you want to know the exact params for `sessions.patch`.

```bash
# Step 1: find which schema file defines it
rg "SessionsPatch" src/gateway/protocol/schema/ --files-with-matches
# → src/gateway/protocol/schema/sessions.ts

# Step 2: read the schema
# Look for SessionsPatchParamsSchema
```

This works for any method — search `<MethodName>Params` or `<MethodName>Result`.

---

## 3. Layer 3: Method Handlers — The Logic

### 3.1 Directory Map

```
src/gateway/server-methods/
├── types.ts                     # ★ GatewayRequestContext, GatewayRequestHandlers, RespondFn
├── validation.ts                # payload validation helpers
│
├── chat.ts                      # ★ chat.send, chat.history, chat.abort, chat.inject (~800 LOC)
├── chat-*.ts                    # chat helpers (transcript inject, test helpers, etc.)
│
├── sessions.ts                  # ★ sessions.list/create/send/abort/patch/reset/delete/compact (~600 LOC)
│
├── agent.ts                     # agent, agent.identity.get, agent.wait
├── agent-*.ts                   # agent helpers (job, wait-dedupe, timestamp)
│
├── agents.ts                    # agents.list/create/update/delete, agents.files.*
├── config.ts                    # config.get/set/apply/patch/schema/schema.lookup
├── cron.ts                      # cron.list/add/update/remove/run/runs/status
├── devices.ts                   # device.pair.*, device.token.*
├── nodes.ts                     # node.list/describe/rename/invoke/pending.*/pair.*
├── exec-approval.ts             # exec.approval.request/waitDecision/resolve
├── exec-approvals.ts            # exec.approvals.get/set (settings)
├── plugin-approval.ts           # plugin.approval.*
├── channels.ts                  # channels.status/logout
├── health.ts                    # health
├── system.ts                    # status, gateway.identity.get, system-presence, system-event
├── models.ts                    # models.list
├── tools-catalog.ts             # tools.catalog
├── tools-effective.ts           # tools.effective
├── skills.ts                    # skills.*
├── talk.ts                      # talk.config/speak/mode
├── tts.ts                       # tts.*
├── send.ts                      # send (external channel delivery)
├── push.ts                      # push.test
├── logs.ts                      # logs.tail
├── usage.ts                     # usage.status/cost
├── voicewake.ts                 # voicewake.get/set
├── wizard.ts                    # wizard.*
├── secrets.ts                   # secrets.reload/resolve
├── doctor.ts                    # doctor.memory.status
├── update.ts                    # update.run
└── connect.ts                   # connect (internal handshake handler)
```

### 3.2 How to Read a Handler

Every handler follows the same pattern:

```typescript
// In types.ts — the handler signature
type GatewayRequestHandler = (ctx: {
  req: { id: string; method: string; params?: unknown };
  params: unknown; // raw params (pre-validation)
  client: GatewayWsClient; // connection info + auth
  respond: RespondFn; // call respond(true, payload) or respond(false, error)
  context: GatewayRequestContext; // shared services (sessions, agents, config, etc.)
}) => Promise<void>;
```

**Example: Reading chat.ts**

```typescript
// Simplified flow of chat.send handler:
async function handleChatSend(ctx) {
  // 1. Validate params against ChatSendParamsSchema
  const params = validate(ctx.params, ChatSendParamsSchema);

  // 2. Check idempotency (deduplicate repeat requests)
  if (isDuplicate(params.idempotencyKey)) return respond(true, cached);

  // 3. Resolve session
  const session = await resolveSession(params.sessionKey);

  // 4. Start agent run
  const runId = await startAgentRun(session, params);

  // 5. Respond with runId (streaming happens via events)
  respond(true, { runId, sessionId: session.id });

  // 6. Agent execution continues async → emits chat/agent events
}
```

### 3.3 Practical Workflow: Tracing "What Happens When I Call X?"

Example: you want to understand what `sessions.create` does.

```bash
# Step 1: find the handler file
rg "sessions.create" src/gateway/server-methods/ --files-with-matches
# → src/gateway/server-methods/sessions.ts

# Step 2: find the handler function
rg "sessions\.create" src/gateway/server-methods/sessions.ts
# Look for the method registration or switch case

# Step 3: read the handler logic
# Follow: validation → business logic → respond()
```

---

## 4. Layer 2: Server Infrastructure — The Plumbing

### 4.1 Request Flow (Frame to Response)

```
WebSocket frame arrives
        │
        ▼
┌─ ws-connection.ts ────────────────────────────────────┐
│  attachGatewayWsConnectionHandler()                   │
│  → generates connId, extracts headers                 │
│  → sets handshake timeout (10s)                       │
│  → attaches message handler                           │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌─ server/ws-connection/message-handler.ts ─────────────┐
│  attachGatewayWsMessageHandler()                      │
│  → parse JSON frame                                   │
│  → if first frame: validate ConnectParams, auth       │
│  → if authed: send HelloOk, attach RPC handler        │
│  → subsequent frames: validate RequestFrame           │
│  → call handleGatewayRequest()                        │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌─ server-methods.ts ───────────────────────────────────┐
│  handleGatewayRequest()                               │
│  → authorizeGatewayMethod(method, client)             │
│    (checks role + scope via method-scopes.ts)         │
│  → lookup handler in coreGatewayHandlers[method]      │
│  → call handler({ req, params, client, respond })     │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌─ server-methods/<domain>.ts ──────────────────────────┐
│  Domain handler                                       │
│  → validate params (TypeBox + AJV)                    │
│  → business logic                                     │
│  → respond(ok, payload) or respond(false, error)      │
│  → may trigger broadcast events                       │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌─ server-broadcast.ts ─────────────────────────────────┐
│  broadcast(event, payload, opts)                      │
│  → for each connected client:                         │
│    → check scope guards (EVENT_SCOPE_GUARDS)          │
│    → check slow consumer (bufferedAmount > 50MB)      │
│    → send EventFrame JSON                             │
└───────────────────────────────────────────────────────┘
```

### 4.2 Key Infrastructure Files

| File                                               | Responsibility                                                 | When to read                         |
| -------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------ |
| `server.impl.ts`                                   | Bootstrap: wires config, auth, WS, HTTP, plugins, health, cron | "How does the Gateway start?"        |
| `server/ws-connection.ts`                          | WS connection setup, connId, handshake timeout                 | "Why was my connection dropped?"     |
| `server/ws-connection/message-handler.ts`          | Frame parsing, auth, HelloOk, RPC dispatch                     | "Why is my frame rejected?"          |
| `server/ws-connection/auth-context.ts`             | Auth decision logic (token, device, password)                  | "Why did auth fail?"                 |
| `server/ws-connection/connect-policy.ts`           | Device pairing, auto-approval, control-UI auth                 | "Why isn't my device approved?"      |
| `server/ws-connection/handshake-auth-helpers.ts`   | Device signature verification (v2/v3)                          | "Signature verification failed"      |
| `server/ws-connection/unauthorized-flood-guard.ts` | Rate limiting for bad auth                                     | "Why am I locked out?"               |
| `server-methods.ts`                                | RPC dispatcher: authorize + route to handler                   | "Method not found / unauthorized"    |
| `method-scopes.ts`                                 | Scope → method mapping (who can call what)                     | "PERMISSION_DENIED on method X"      |
| `server-broadcast.ts`                              | Event broadcast engine, scope guards, slow consumer            | "Why don't I receive event X?"       |
| `server-constants.ts`                              | MAX_PAYLOAD, MAX_BUFFERED, TICK_INTERVAL, DEDUPE               | "What are the limits?"               |
| `auth-rate-limit.ts`                               | Rate limit config per auth scope                               | "Why am I getting rate limited?"     |
| `handshake-timeouts.ts`                            | Pre-auth handshake timeout (10s)                               | "Connection closes before I connect" |
| `events.ts`                                        | Event name constants                                           | "What's the exact event name?"       |

### 4.3 Authentication Flow (Deep Dive)

```
ConnectParams arrives
        │
        ▼
┌─ auth-context.ts ─────────────────────────────────────┐
│  resolveConnectAuthState()                            │
│  → check auth mode (none/token/password/trusted-proxy)│
│  → if device auth: verify signature (v2/v3)           │
│  → if device token: validate JWT                      │
│  → if bootstrap token: validate + check expiry        │
│  → rate limit check                                   │
│  ▼                                                    │
│  resolveConnectAuthDecision()                         │
│  → determine role (operator/node)                     │
│  → determine scopes                                   │
│  → issue device token if new pairing                  │
│  → return GatewayAuthResult                           │
└───────────────────────────────────────────────────────┘
```

Files involved:

```
server/ws-connection/auth-context.ts        → main auth decision
server/ws-connection/handshake-auth-helpers.ts → signature verification
server/ws-connection/connect-policy.ts      → pairing and approval
server/ws-connection/auth-messages.ts       → error message formatting
auth-rate-limit.ts                          → sliding window rate limiter
```

---

## 5. Layer 1: Startup — The Bootstrap

`src/gateway/server.impl.ts` is the entry point. Simplified boot sequence:

```
startGatewayServer(options)
  │
  ├── load config
  ├── initialize auth (token, device store)
  ├── create HTTP server (server/http-listen.ts)
  │     ├── /health, /healthz → liveness probe
  │     ├── /ready, /readyz → readiness probe
  │     ├── /v1/chat/completions → OpenAI-compat (openai-http.ts)
  │     ├── /v1/responses → OpenResponses
  │     └── plugin HTTP routes (server/plugins-http.ts)
  │
  ├── create WebSocket server (attached to HTTP)
  │     └── on connection → ws-connection.ts
  │
  ├── create broadcaster (server-broadcast.ts)
  ├── create RPC dispatcher (server-methods.ts)
  ├── initialize session manager
  ├── initialize agent engine
  ├── initialize cron service
  ├── start health refresh loop (60s)
  ├── start tick loop (30s)
  └── run BOOT.md if present (boot.ts)
```

---

## 6. Common Debugging Scenarios

### "Method X returns an error I don't understand"

```bash
# 1. Find the error code definition
rg "INVALID_REQUEST\|UNAVAILABLE\|NOT_PAIRED" src/gateway/protocol/schema/error-codes.ts

# 2. Find where that error is thrown
rg "INVALID_REQUEST" src/gateway/server-methods/

# 3. Read the handler to understand the condition
```

### "I'm not receiving event Y"

```bash
# 1. Check if event requires a scope guard
rg "session.message\|session.tool" src/gateway/server-broadcast.ts
# → EVENT_SCOPE_GUARDS shows: requires operator.read

# 2. Check if event requires a capability
rg "tool-events" src/gateway/
# → agent tool events require caps: ["tool-events"]

# 3. Check if you're subscribed (for session events)
rg "sessions.messages.subscribe" src/gateway/server-methods/
```

### "I want to know what fields method X accepts"

```bash
# 1. Find the schema
rg "SessionsPatchParamsSchema" src/gateway/protocol/schema/
# → sessions.ts

# 2. Read the TypeBox definition — every field, type, and constraint is there
```

### "I want to add support for a new method in ClawWork"

```
Step 1: Schema    → src/gateway/protocol/schema/<domain>.ts     (params + result)
Step 2: Handler   → src/gateway/server-methods/<domain>.ts      (logic)
Step 3: Method    → src/gateway/server-methods-list.ts           (registered?)
Step 4: Scopes    → src/gateway/method-scopes.ts                 (auth requirements)
Step 5: Events    → src/gateway/server-broadcast.ts              (scope guards on events)
```

### "The Gateway closed my connection"

```bash
# Check close codes
rg "socket.close\|\.close(" src/gateway/server-broadcast.ts src/gateway/server/ws-connection/
# 1008 = slow consumer (bufferedAmount > 50MB)
# 1002 = protocol error
# 1003 = invalid frame
# 1011 = unexpected condition

# Check handshake timeout
# → handshake-timeouts.ts: 10s to complete connect handshake
```

---

## 7. File Discovery Cheatsheet

| I want to find...                    | Search command                                                    |
| ------------------------------------ | ----------------------------------------------------------------- |
| Schema for any method                | `rg "<MethodName>Params" src/gateway/protocol/schema/`            |
| Handler for any method               | `rg "<method.name>" src/gateway/server-methods/`                  |
| Where an event is emitted            | `rg "broadcast.*\"<event-name>\"" src/gateway/`                   |
| What scope a method requires         | `rg "<method.name>" src/gateway/method-scopes.ts`                 |
| All TypeBox schemas in a file        | `rg "export const.*Schema" src/gateway/protocol/schema/<file>.ts` |
| All methods registered               | Read `src/gateway/server-methods-list.ts` → `BASE_METHODS`        |
| All events registered                | Read `src/gateway/server-methods-list.ts` → `GATEWAY_EVENTS`      |
| All client IDs / modes / caps        | Read `src/gateway/protocol/client-info.ts`                        |
| Server constants (limits, intervals) | Read `src/gateway/server-constants.ts`                            |
| Error code definitions               | Read `src/gateway/protocol/schema/error-codes.ts`                 |
| Test for a specific handler          | `ls src/gateway/server-methods/<domain>.test.ts`                  |
| Shared primitive types               | Read `src/gateway/protocol/schema/primitives.ts`                  |

---

## 8. Understanding TypeBox ↔ Runtime Validation

OpenClaw uses TypeBox to define schemas and AJV to validate at runtime:

```
TypeBox schema (compile-time type + runtime schema)
        │
        ▼
src/gateway/protocol/index.ts
  → compiles TypeBox → AJV validators
  → exports: validateRequestFrame(), validateConnectParams(), etc.
        │
        ▼
server/ws-connection/message-handler.ts
  → calls validators on every incoming frame
  → rejects with INVALID_REQUEST if validation fails
```

**Key implication for ClawWork:** If a field is marked `{ additionalProperties: false }` in the schema (and almost all are), sending extra fields in your request **will cause a validation error**. Only send fields defined in the schema.

---

## 9. Testing Gateway Code

### Running Tests

```bash
# All gateway tests
pnpm test -- src/gateway/

# Specific handler tests
pnpm test -- src/gateway/server-methods/chat.test.ts

# Specific test by name
pnpm test -- src/gateway/server-methods/chat.test.ts -t "chat.send"

# Protocol schema tests
pnpm test -- src/gateway/protocol/
```

### Test Organization

- Tests are colocated: `chat.ts` → `chat.test.ts`
- Test helpers: `src/gateway/test-helpers.ts`, `src/gateway/test-helpers.mocks.ts`
- Server integration tests use `src/gateway/server/` test utils for mock setup
- ~190 test files total under `src/gateway/`

### Reading Tests as Documentation

When the schema or handler isn't clear enough, the test file often has the best examples:

```bash
# Find real usage examples in tests
rg "chat.send" src/gateway/server-methods/chat.test.ts
# → shows exactly what params to send and what response to expect
```

---

## 10. Documentation Map

### Official Docs (`docs/gateway/`)

| Document                     | Purpose                                                         | When to read                          |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------- |
| `protocol.md`                | WS protocol spec: handshake, framing, roles, scopes, versioning | First read for protocol understanding |
| `authentication.md`          | Auth mechanisms and configuration                               | Implementing auth in ClawWork         |
| `pairing.md`                 | Device pairing and trust model                                  | Implementing device pairing           |
| `configuration.md`           | Task-oriented config guide                                      | Setting up Gateway for development    |
| `configuration-reference.md` | All config keys (122KB)                                         | Looking up specific config options    |
| `health.md`                  | Health monitoring                                               | Implementing health indicators        |
| `troubleshooting.md`         | Symptom-first diagnostics                                       | When things go wrong                  |
| `openai-http-api.md`         | OpenAI-compatible HTTP endpoints                                | If you need HTTP fallback             |
| `index.md`                   | 5-minute runbook                                                | Quick start                           |

### Source-Level Docs

| Document          | Path                                   | Purpose                                          |
| ----------------- | -------------------------------------- | ------------------------------------------------ |
| Protocol Boundary | `src/gateway/protocol/AGENTS.md`       | Rules for changing protocol schemas              |
| Server Methods    | `src/gateway/server-methods/CLAUDE.md` | Handler conventions and session transcript notes |

---

## 11. Recommended Reading Order

For a developer going from zero to productive:

### Week 1: Understand the Contract

1. **Read** `openclaw-gateway-whitepaper.md` (your local copy — the protocol reference)
2. **Skim** `src/gateway/protocol/schema/frames.ts` — understand the three frame types
3. **Read** `src/gateway/protocol/schema/primitives.ts` — know the shared types
4. **Read** `src/gateway/server-methods-list.ts` — see all methods and events
5. **Read** `src/gateway/protocol/client-info.ts` — know client IDs, modes, caps

### Week 2: Understand Your Core Methods

6. **Read** `src/gateway/protocol/schema/logs-chat.ts` — chat schemas (your primary interface)
7. **Read** `src/gateway/server-methods/chat.ts` — how chat.send/history/abort work
8. **Read** `src/gateway/protocol/schema/sessions.ts` — session schemas
9. **Read** `src/gateway/server-methods/sessions.ts` — session management logic
10. **Read** `src/gateway/protocol/schema/agent.ts` — agent event schemas

### Week 3: Understand Infrastructure

11. **Skim** `src/gateway/server/ws-connection/message-handler.ts` — frame dispatch flow
12. **Read** `src/gateway/method-scopes.ts` — authorization rules
13. **Read** `src/gateway/server-broadcast.ts` — event broadcasting + scope guards
14. **Read** `src/gateway/server-constants.ts` — limits and intervals
15. **Read** `src/gateway/auth-rate-limit.ts` — rate limiting

### Ongoing: Reference as Needed

- Method schemas → `src/gateway/protocol/schema/<domain>.ts`
- Method handlers → `src/gateway/server-methods/<domain>.ts`
- Official docs → `docs/gateway/protocol.md`, `docs/gateway/authentication.md`, `docs/gateway/pairing.md`
- Tests as examples → `src/gateway/server-methods/<domain>.test.ts`

---

## 12. Quick Reference Card

```
Protocol version:     src/gateway/protocol/schema/protocol-schemas.ts → PROTOCOL_VERSION
Frame types:          src/gateway/protocol/schema/frames.ts
All methods:          src/gateway/server-methods-list.ts → BASE_METHODS
All events:           src/gateway/server-methods-list.ts → GATEWAY_EVENTS
Method scopes:        src/gateway/method-scopes.ts
Event scope guards:   src/gateway/server-broadcast.ts → EVENT_SCOPE_GUARDS
Client IDs/modes:     src/gateway/protocol/client-info.ts
Error codes:          src/gateway/protocol/schema/error-codes.ts
Constants/limits:     src/gateway/server-constants.ts
RPC dispatcher:       src/gateway/server-methods.ts → handleGatewayRequest()
WS message handler:   src/gateway/server/ws-connection/message-handler.ts
Auth decision:        src/gateway/server/ws-connection/auth-context.ts
Broadcast engine:     src/gateway/server-broadcast.ts → createGatewayBroadcaster()
Server startup:       src/gateway/server.impl.ts → startGatewayServer()
```
