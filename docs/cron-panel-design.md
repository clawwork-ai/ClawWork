# Cron Panel — Production Design Document

## 1. Problem Statement

OpenClaw Gateway exposes a full cron scheduling system (`cron.*` RPCs) for recurring agent tasks. ClawWork needs a first-class UI for managing these — not buried in Settings, but a main area view on par with Files and Archived.

The server API is significantly richer than a simple "expression + command" model. A production client must model the real data faithfully, even if the UI exposes a subset of options initially.

## 2. Server API Reality (vs. todo.md assumptions)

### 2.1 What the todo.md got wrong

| Aspect        | todo.md assumed                                     | Server reality                                                                                                                               |
| ------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| CronJob shape | `{ id, expression, command, description, enabled }` | 15+ fields: schedule (3 kinds), sessionTarget (4 modes), payload (2 kinds), delivery, failureAlert, state, agentId, wakeMode, deleteAfterRun |
| Schedule      | Single cron expression string                       | Union: `at` (one-shot ISO timestamp), `every` (interval ms), `cron` (expr + tz + stagger)                                                    |
| Payload       | Plain command string                                | Union: `systemEvent` (text) or `agentTurn` (message + model + thinking + timeout + ...)                                                      |
| Session model | Not considered                                      | `main` / `isolated` / `current` / `session:<id>` — determines how runs execute                                                               |
| Delivery      | Not considered                                      | `none` / `announce` (to channel) / `webhook` (HTTP POST)                                                                                     |
| Job state     | Not considered                                      | Rich runtime: nextRunAtMs, lastRunAtMs, lastRunStatus, consecutiveErrors, lastDurationMs, deliveryStatus                                     |
| Run history   | Not considered                                      | `cron.runs` returns paginated JSONL log with summary, model, usage, duration, delivery status                                                |
| List RPC      | Returns flat array                                  | Paginated: `{ jobs, total, offset, limit, hasMore, nextOffset }` with query/sort/filter                                                      |
| `cron.status` | Per-job status                                      | Global scheduler health: `{ enabled, jobs, nextWakeAtMs }`                                                                                   |
| `cron.run`    | No params                                           | Takes `mode: "due"                                                                                                                           | "force"` |
| Error model   | Not considered                                      | Exponential backoff, consecutiveErrors, failureAlerts after N errors                                                                         |

### 2.2 Actual RPC surface

| RPC           | Params (key fields)                                                         | Response                                                         |
| ------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `cron.list`   | `{ enabled?, query?, sortBy?, sortDir?, limit?, offset? }`                  | `{ jobs: CronJob[], total, offset, limit, hasMore, nextOffset }` |
| `cron.status` | `{}`                                                                        | `{ enabled, storePath, jobs, nextWakeAtMs }`                     |
| `cron.add`    | `CronJobCreate` (name, schedule, sessionTarget, wakeMode, payload required) | `CronJob`                                                        |
| `cron.update` | `{ jobId, patch: CronJobPatch }`                                            | `CronJob`                                                        |
| `cron.remove` | `{ jobId }`                                                                 | `{ removed: boolean }`                                           |
| `cron.run`    | `{ jobId, mode?: "due" \| "force" }`                                        | `{ enqueued, runId }` or `{ ran: false, reason }`                |
| `cron.runs`   | `{ jobId?, scope?, limit?, offset?, statuses?, query?, sortDir? }`          | `{ entries: CronRunLogEntry[], total, offset, limit, hasMore }`  |

### 2.3 CronJob full shape (from server types.ts)

```typescript
interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  createdAtMs: number;
  updatedAtMs: number;

  agentId?: string;
  sessionKey?: string;
  description?: string;
  deleteAfterRun?: boolean;

  schedule: CronSchedule;
  sessionTarget: CronSessionTarget;
  wakeMode: CronWakeMode;
  payload: CronPayload;
  delivery?: CronDelivery;
  failureAlert?: CronFailureAlert | false;

  state: CronJobState;
}
```

## 3. Architecture Decisions

### 3.1 Main area view (confirmed)

Same as todo.md: `MainView = '... | cron'`, sidebar Clock icon, `<CronPanel />` in MainArea. No changes here.

### 3.2 No local persistence (confirmed)

All data lives on Gateway. Component local state + fetch-on-mount. No Zustand store.

### 3.3 Types: client-canonical types derived from server contract

Shared package defines client-side canonical types that cover the server's public RPC contract. Differences from the raw server schema are intentional and documented:

- **Field canonicalization**: Server accepts `id | jobId` in update/remove/run/runs. Client always sends `jobId`. GatewayClient is the normalization boundary.
- **Deprecated/alias fields omitted**: Server's `CronListParams.includeDisabled` is superseded by `enabled: 'all' | 'enabled' | 'disabled'`. Server's singular `status`/`deliveryStatus` aliases are omitted in favor of the array forms `statuses`/`deliveryStatuses`.
- **No wholesale re-export of server internals**: Types like `FailoverReason`, `HookExternalContentSource`, `CronJobState.scheduleErrorCount` are server implementation details not surfaced in RPC responses. They are excluded.

The client types are NOT a verbatim mirror of the server schema. They are a **canonical projection** — every field present is real, but not every server field is present.

### 3.4 RPC: all 7 methods, canonical params

All 7 cron RPCs are implemented. Parameter types reflect the canonical projection above. The RPC layer accepts the full set of params useful to the UI; server-only aliases are normalized at the GatewayClient boundary.

### 3.5 Two-tier UI complexity

- **Simple mode (default)**: Create dialog with name + cron expression + agent message + session target. Covers 90% of use cases.
- **Advanced fields** (collapsible): timezone, description, delivery, model override, thinking mode, failure alerts, deleteAfterRun.

This avoids overwhelming users while keeping the full API accessible.

### 3.6 Source-of-truth boundary

This document draws from two sources. They are NOT interchangeable:

**Public RPC contract** (stable, what the client depends on):

- RPC method names, parameter schemas, response shapes
- CronJob/CronRunLogEntry field names and types
- Error codes and response envelope (`ok`/`error`)
- Schedule/payload/delivery/failureAlert union shapes

**Server implementation details** (used for design rationale only, NOT depended on at runtime):

- `normalizeHttpWebhookUrl()` validates `delivery.to` as HTTP/HTTPS URL — tells us the field IS a URL, but client doesn't call this function
- `sessionContext.sessionKey` resolution for `current` target — tells us "current" silently falls back, so we exclude it from UI
- `CronUpdateParamsSchema` accepting `id | jobId` union — tells us we can canonicalize to `jobId` only
- `resolveCronSession()` auto-creating sessions — tells us named session IDs don't need a lookup mechanism

If the server implementation changes but the RPC contract stays the same, the client still works. If a design decision in this document cites a server internal, it is marked with its source file in the appendix so the rationale can be re-evaluated if needed.

## 4. Type Definitions (shared package)

```typescript
// --- Schedule ---

export type CronSchedule =
  | { kind: 'at'; at: string }
  | { kind: 'every'; everyMs: number; anchorMs?: number }
  | { kind: 'cron'; expr: string; tz?: string; staggerMs?: number };

// --- Session ---

export type CronSessionTarget = 'main' | 'isolated' | 'current' | `session:${string}`;
export type CronWakeMode = 'next-heartbeat' | 'now';

// --- Payload ---

export type CronPayload =
  | { kind: 'systemEvent'; text: string }
  | {
      kind: 'agentTurn';
      message: string;
      model?: string;
      fallbacks?: string[];
      thinking?: string;
      timeoutSeconds?: number;
      allowUnsafeExternalContent?: boolean;
      lightContext?: boolean;
      deliver?: boolean;
      channel?: string;
      to?: string;
      bestEffortDeliver?: boolean;
    };

// --- Delivery ---

export type CronDeliveryMode = 'none' | 'announce' | 'webhook';

export interface CronFailureDestination {
  channel?: string;
  to?: string;
  accountId?: string;
  mode?: 'announce' | 'webhook';
}

export interface CronDelivery {
  mode: CronDeliveryMode;
  channel?: string;
  to?: string;
  accountId?: string;
  bestEffort?: boolean;
  failureDestination?: CronFailureDestination;
}

// --- Failure Alert ---

export interface CronFailureAlert {
  after?: number;
  channel?: string;
  to?: string;
  cooldownMs?: number;
  mode?: 'announce' | 'webhook';
  accountId?: string;
}

// --- Job State (runtime, read-only) ---

export type CronRunStatus = 'ok' | 'error' | 'skipped';
export type CronDeliveryStatus = 'delivered' | 'not-delivered' | 'unknown' | 'not-requested';

export interface CronJobState {
  nextRunAtMs?: number;
  runningAtMs?: number;
  lastRunAtMs?: number;
  lastRunStatus?: CronRunStatus;
  lastError?: string;
  lastDurationMs?: number;
  consecutiveErrors?: number;
  lastDelivered?: boolean;
  lastDeliveryStatus?: CronDeliveryStatus;
  lastDeliveryError?: string;
  lastFailureAlertAtMs?: number;
}

// --- CronJob ---

export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  agentId?: string;
  sessionKey?: string;
  description?: string;
  deleteAfterRun?: boolean;
  schedule: CronSchedule;
  sessionTarget: CronSessionTarget;
  wakeMode: CronWakeMode;
  payload: CronPayload;
  delivery?: CronDelivery;
  failureAlert?: CronFailureAlert | false;
  state: CronJobState;
}

// --- Create/Patch ---

export type CronJobCreate = Omit<CronJob, 'id' | 'createdAtMs' | 'updatedAtMs' | 'state'>;

export interface CronJobPatch {
  name?: string;
  description?: string;
  enabled?: boolean;
  agentId?: string;
  sessionKey?: string;
  deleteAfterRun?: boolean;
  schedule?: CronSchedule;
  sessionTarget?: CronSessionTarget;
  wakeMode?: CronWakeMode;
  payload?: CronPayload;
  delivery?: CronDelivery;
  failureAlert?: CronFailureAlert | false;
}

// --- Run Log ---

export interface CronRunLogEntry {
  ts: number;
  jobId: string;
  action: 'finished';
  status?: CronRunStatus;
  error?: string;
  summary?: string;
  delivered?: boolean;
  deliveryStatus?: CronDeliveryStatus;
  deliveryError?: string;
  sessionId?: string;
  sessionKey?: string;
  runAtMs?: number;
  durationMs?: number;
  nextRunAtMs?: number;
  model?: string;
  provider?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
  };
  jobName?: string;
}

// --- RPC Params ---

export interface CronListParams {
  enabled?: 'all' | 'enabled' | 'disabled';
  query?: string;
  sortBy?: 'nextRunAtMs' | 'updatedAtMs' | 'name';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CronListResult {
  jobs: CronJob[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface CronStatusResult {
  enabled: boolean;
  storePath: string;
  jobs: number;
  nextWakeAtMs?: number;
}

export interface CronRunParams {
  jobId: string;
  mode?: 'due' | 'force';
}

export interface CronRunResult {
  enqueued?: boolean;
  runId?: string;
  ran?: boolean;
  reason?: string;
}

export interface CronRunsParams {
  scope?: 'job' | 'all';
  jobId?: string;
  limit?: number;
  offset?: number;
  statuses?: CronRunStatus[];
  deliveryStatuses?: CronDeliveryStatus[];
  query?: string;
  sortDir?: 'asc' | 'desc';
}

export interface CronRunsResult {
  entries: CronRunLogEntry[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}
```

## 5. RPC Layer Design (3-layer)

### 5.1 GatewayClient methods

| Method                        | RPC           | Params → sendReq       |
| ----------------------------- | ------------- | ---------------------- |
| `listCronJobs(params?)`       | `cron.list`   | `CronListParams \| {}` |
| `getCronStatus()`             | `cron.status` | `{}`                   |
| `addCronJob(params)`          | `cron.add`    | `CronJobCreate`        |
| `updateCronJob(jobId, patch)` | `cron.update` | `{ jobId, patch }`     |
| `removeCronJob(jobId)`        | `cron.remove` | `{ jobId }`            |
| `runCronJob(jobId, mode?)`    | `cron.run`    | `{ jobId, mode? }`     |
| `listCronRuns(params?)`       | `cron.runs`   | `CronRunsParams \| {}` |

### 5.2 IPC channels

| Channel          | Payload (renderer → main)                   |
| ---------------- | ------------------------------------------- |
| `ws:cron-list`   | `{ gatewayId, ...CronListParams }`          |
| `ws:cron-status` | `{ gatewayId }`                             |
| `ws:cron-add`    | `{ gatewayId, ...CronJobCreate }`           |
| `ws:cron-update` | `{ gatewayId, jobId, patch: CronJobPatch }` |
| `ws:cron-remove` | `{ gatewayId, jobId }`                      |
| `ws:cron-run`    | `{ gatewayId, jobId, mode? }`               |
| `ws:cron-runs`   | `{ gatewayId, ...CronRunsParams }`          |

### 5.3 Preload methods

Mirror of IPC channels with typed signatures. All return `Promise<IpcResult<T>>` with specific result types.

## 6. UI Component Design

### 6.1 Component tree

```
MainArea
└── CronPanel/
    ├── index.tsx              — main panel (header with inline scheduler status + filter bar + job list + pagination + empty state)
    ├── CronJobCard.tsx        — single job card in list
    ├── CronJobDialog.tsx      — create/edit dialog
    └── CronRunHistory.tsx     — per-job run history table with pagination
```

> Scheduler status bar is inlined in `CronPanel/index.tsx` header, not a separate component. It's a single line of text with a dot indicator — not worth the indirection of a standalone file.

### 6.2 CronPanel layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Header                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⏰ Scheduled Tasks    [Search...]  [Gateway ▾] [+ New Job]  │ │
│ │ Scheduler: ● active · 12 jobs · next wake in 4m            │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Filter bar                                                      │
│ [All] [Enabled] [Disabled]     Sort: [Next run ▾]              │
├─────────────────────────────────────────────────────────────────┤
│ Job list (scrollable)                                           │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [toggle] Daily standup summary              ● ok  2m ago   │ │
│ │          ┌ cron  0 9 * * 1-5 (Asia/Shanghai)              │ │
│ │          │ agentTurn: "summarize today's plan"             │ │
│ │          │ isolated · next: Mon 09:00                      │ │
│ │          └────────────── [▶ Run] [History] [✏] [🗑]       │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ [toggle] Weekly report                      ● error  1d   │ │
│ │          ┌ cron  0 17 * * 5                               │ │
│ │          │ agentTurn: "/new write weekly report"           │ │
│ │          │ isolated · next: Fri 17:00                      │ │
│ │          │ ⚠ 3 consecutive errors: rate_limit              │ │
│ │          └────────────── [▶ Run] [History] [✏] [🗑]       │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ [toggle] DB backup check                    ○ disabled     │ │
│ │          ┌ every  3600000ms (1h)                          │ │
│ │          │ systemEvent: "check backup status"              │ │
│ │          │ main · last: 2h ago                             │ │
│ │          └────────────── [▶ Run] [History] [✏] [🗑]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ── pagination: showing 1–20 of 35 [← Prev] [Next →] ──       │
│                                                                 │
│ ── or if empty ──                                               │
│                                                                 │
│           ⏰                                                    │
│    No scheduled tasks                                           │
│    Create recurring agent tasks on a schedule                   │
│              [+ Create Schedule]                                │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 CronJobCard — what each card shows

| Element           | Source                        | Display                                                   |
| ----------------- | ----------------------------- | --------------------------------------------------------- |
| Name              | `job.name`                    | Primary text, bold                                        |
| Enabled toggle    | `job.enabled`                 | Switch, calls `cron.update` on toggle                     |
| Schedule type     | `job.schedule.kind`           | Badge: "cron" / "every" / "at"                            |
| Schedule detail   | `job.schedule.*`              | Cron: expr + tz. Every: human interval. At: ISO date      |
| Payload preview   | `job.payload`                 | `systemEvent`: text preview. `agentTurn`: message preview |
| Session target    | `job.sessionTarget`           | Label: "isolated" / "main" / raw `session:xxx` string     |
| Next run          | `job.state.nextRunAtMs`       | Relative time ("in 4m") or absolute if >24h               |
| Last run status   | `job.state.lastRunStatus`     | Dot indicator: green (ok), red (error), yellow (skipped)  |
| Last run time     | `job.state.lastRunAtMs`       | Relative time ("2m ago")                                  |
| Error indicator   | `job.state.consecutiveErrors` | Warning badge if > 0, shows lastError on hover            |
| Running indicator | `job.state.runningAtMs`       | Spinner if currently running                              |
| Actions           | —                             | Run Now, History, Edit, Delete                            |

### 6.4 CronJobDialog — create/edit form

**Two sections: Essential (always visible) + Advanced (collapsible)**

#### Essential fields

| Field            | Type              | Default     | Notes                                                                                   |
| ---------------- | ----------------- | ----------- | --------------------------------------------------------------------------------------- |
| Name             | text input        | —           | Required                                                                                |
| Schedule type    | segmented control | `cron`      | `cron` / `every` / `at`                                                                 |
| — if cron        | text input        | —           | Placeholder: `0 9 * * 1-5`                                                              |
| — if cron: tz    | text input        | —           | Optional, placeholder: `Asia/Shanghai`                                                  |
| — if every       | number input      | —           | Interval in minutes (UI converts to ms)                                                 |
| — if at          | datetime picker   | —           | ISO timestamp                                                                           |
| Payload type     | segmented control | `agentTurn` | `agentTurn` / `systemEvent`                                                             |
| — if agentTurn   | textarea          | —           | The message to send. Required                                                           |
| — if systemEvent | textarea          | —           | The event text. Required                                                                |
| Session target   | select            | `task`      | `task` / `main`                                                                         |
| — if main        | —                 | —           | Force payload to `systemEvent`, show note                                               |
| — if task        | read-only note    | —           | ClawWork allocates a stable task-bound session and stores `sessionTarget=session:<key>` |
| Enabled          | switch            | `true`      | —                                                                                       |

> **Why no `current` or `isolated`?** `current` depends on ambient session context, which CronPanel does not have. `isolated` currently does not preserve ClawWork task/session identity through the OpenClaw cron execution path. Until upstream behavior is fixed, CronPanel only offers a stable task-bound session (`session:<key>`) or `main`.

#### Advanced fields (collapsed by default)

| Field                  | Type                    | Default       | Notes                                                                                                                                           |
| ---------------------- | ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Description            | textarea                | —             | Optional                                                                                                                                        |
| Agent                  | select from agents list | default agent | Fetched via `agents.list`                                                                                                                       |
| Model override         | select from models list | —             | Only for `agentTurn` payload                                                                                                                    |
| Thinking mode          | select                  | —             | Only for `agentTurn` payload                                                                                                                    |
| Timeout (seconds)      | number                  | —             | Only for `agentTurn`                                                                                                                            |
| Wake mode              | select                  | `now`         | `now` / `next-heartbeat`                                                                                                                        |
| Delete after run       | switch                  | `false`       | For one-shot `at` schedules                                                                                                                     |
| Delivery mode          | select                  | `none`        | `none` / `announce` / `webhook`                                                                                                                 |
| — if announce: channel | text                    | —             | `delivery.channel`: channel ID or "last"                                                                                                        |
| — if webhook: endpoint | text                    | —             | `delivery.to`: HTTP/HTTPS URL. Server validates via `normalizeHttpWebhookUrl()`. No separate `url` field — `to` IS the URL when mode is webhook |
| Failure alert          | switch + config         | `false`       | After N errors, alert destination                                                                                                               |

#### Session target constraints

| Target | Allowed payload    | Notes                                                                                       |
| ------ | ------------------ | ------------------------------------------------------------------------------------------- |
| `main` | `systemEvent` only | Server enforces this; UI disables `agentTurn` when `main` selected                          |
| `task` | both               | Reuses a stable ClawWork-owned session across runs; implemented as `session:<clawwork-key>` |

> `current` and `isolated` are deliberately excluded from the create/edit form — see rationale above. If a job was created elsewhere with another target, the card display still shows the raw server value for compatibility.

#### Validation rules (client-side)

- `name`: non-empty
- `schedule`: non-empty expression/value for the chosen kind
- `payload`: non-empty message/text
- `sessionTarget = main` → `payload.kind` must be `systemEvent`
- All other validation deferred to server (cron expression syntax, timestamp range, etc.)

### 6.5 CronRunHistory — run log viewer

Triggered by "History" button on a job card. Opens as an inline expandable section or a slide-over panel.

```
┌─────────────────────────────────────────────────────────────────┐
│ Run History: Daily standup summary                    [Close]   │
├───────┬──────────┬───────────┬──────────┬──────────┬───────────┤
│ Time  │ Status   │ Duration  │ Model    │ Summary  │ Delivery  │
├───────┼──────────┼───────────┼──────────┼──────────┼───────────┤
│ 09:00 │ ● ok     │ 12.3s     │ o3       │ "Done…"  │ delivered │
│ 09:00 │ ● ok     │ 8.1s      │ o3       │ "Done…"  │ delivered │
│ 09:00 │ ● error  │ 45.2s     │ o3       │ —        │ —         │
│       │          │           │          │ rate_limit           │
│ ...   │          │           │          │          │           │
├───────┴──────────┴───────────┴──────────┴──────────┴───────────┤
│ Showing 1–20 of 156                    [← Prev] [Next →]      │
└─────────────────────────────────────────────────────────────────┘
```

Fields displayed per entry:

- `ts` → formatted timestamp
- `status` → dot + label (ok/error/skipped)
- `durationMs` → human format (e.g., "12.3s")
- `model` → model name if available
- `summary` → truncated with expand on click
- `error` → shown below entry if status=error
- `deliveryStatus` → badge
- `usage` → token counts (tooltip or expandable)

### 6.6 Scheduler status (inline in CronPanel header)

Displayed as a secondary line in the panel header, below the title.

```
Scheduler: ● active · 12 jobs · next wake in 4m
```

Or if disabled:

```
Scheduler: ○ disabled
```

Fetched via `cron.status` on mount AND refreshed after every mutation (add/update/remove/run). This keeps job count and next-wake time consistent with list state.

### 6.7 Empty state

Standard pattern: centered icon + title + subtitle + CTA button.

### 6.8 Error states

| Scenario                        | UI behavior                                    |
| ------------------------------- | ---------------------------------------------- |
| Gateway disconnected            | Disabled panel with "Not connected" overlay    |
| `cron.list` fails               | Error banner with retry button                 |
| `cron.add` fails                | Toast/inline error in dialog, keep dialog open |
| `cron.update` fails             | Toast, revert optimistic toggle                |
| `cron.remove` fails             | Toast                                          |
| `cron.run` returns `ran: false` | Toast showing `reason`                         |
| Job has `consecutiveErrors > 0` | Warning badge on card with error details       |

### 6.9 State management

```typescript
// CronPanel local state
const [jobs, setJobs] = useState<CronJob[]>([]);
const [total, setTotal] = useState(0);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);
const [schedulerStatus, setSchedulerStatus] = useState<CronStatusResult | null>(null);

// Filters & pagination
const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState<'nextRunAtMs' | 'updatedAtMs' | 'name'>('nextRunAtMs');
const [offset, setOffset] = useState(0);
const PAGE_SIZE = 20;

// Dialog state
const [dialogOpen, setDialogOpen] = useState(false);
const [editingJob, setEditingJob] = useState<CronJob | null>(null);

// Run history
const [historyJobId, setHistoryJobId] = useState<string | null>(null);
```

### 6.10 Data fetching strategy

All mutation flows call a single `refreshData()` function that re-fetches BOTH `cron.list` (with current filter/sort/page params) AND `cron.status`. This is the **sole refresh path** — lifecycle flows (section 8) reference it by name.

- **On mount**: `refreshData()` for default gateway
- **On gateway change**: full state reset (see 6.11), then `refreshData()`
- **On filter/sort/page change**: re-fetch `cron.list` only (status doesn't depend on filters)
- **After mutation** (add/update/remove): `refreshData()`
- **After `cron.run`** (enqueue): `refreshData()` immediately (picks up `runningAtMs`). Additionally, schedule a single delayed `refreshData()` after 5 seconds to pick up completion state (the run itself is async). This is NOT polling — it is a one-shot deferred refresh. If the user navigates away or switches gateway before the timer fires, cancel it.
- **Toggle enabled**: optimistic update → `cron.update` → `refreshData()` on success; revert toggle on error
- **Run history**: fetch `cron.runs` on demand when history panel opens; not part of `refreshData()`
- **Manual refresh**: header refresh button calls `refreshData()`
- **No polling / no WS push**: server does not emit cron state change events. The deferred re-fetch after `cron.run` is the only automatic refresh. All other state updates require user action.

### 6.11 Gateway switching — state cleanup

When `selectedGatewayId` changes, the following state MUST be reset before fetching new data:

| State             | Reset to | Why                                                                                 |
| ----------------- | -------- | ----------------------------------------------------------------------------------- |
| `jobs`            | `[]`     | Old jobs belong to previous gateway                                                 |
| `total`           | `0`      | Stale count                                                                         |
| `schedulerStatus` | `null`   | Different gateway, different scheduler                                              |
| `loading`         | `true`   | New fetch in progress                                                               |
| `error`           | `null`   | Clear previous errors                                                               |
| `offset`          | `0`      | Reset pagination                                                                    |
| `dialogOpen`      | `false`  | Close any open create/edit dialog — the job being edited belongs to the old gateway |
| `editingJob`      | `null`   | Clear reference to old gateway's job                                                |
| `historyJobId`    | `null`   | Close run history panel — job doesn't exist on new gateway                          |

Filter and sort preferences (`filter`, `searchQuery`, `sortBy`) are **preserved** across gateway switches — they are user preferences, not gateway-bound state.

The deferred re-fetch timer from `cron.run` (section 6.10) must be cancelled on gateway switch.

## 7. Component File Inventory

### New files (4)

| File                                                                 | Purpose                                                                                              |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `packages/desktop/src/renderer/layouts/CronPanel/index.tsx`          | Main panel: header (with inline scheduler status) + filter bar + job list + pagination + empty state |
| `packages/desktop/src/renderer/layouts/CronPanel/CronJobCard.tsx`    | Single job card with toggle, status, actions                                                         |
| `packages/desktop/src/renderer/layouts/CronPanel/CronJobDialog.tsx`  | Create/edit dialog with essential + advanced sections                                                |
| `packages/desktop/src/renderer/layouts/CronPanel/CronRunHistory.tsx` | Per-job run history table with pagination                                                            |

> `CronScheduleBadge` is inlined in `CronJobCard` — it's just a conditional rendering of 3 schedule kinds, not worth a separate file. Same for scheduler status — inlined in `CronPanel` header.

### Modified files (10)

| File                                                       | Change                                |
| ---------------------------------------------------------- | ------------------------------------- |
| `packages/shared/src/types.ts`                             | Add all cron types (section 4)        |
| `packages/desktop/src/main/ws/gateway-client.ts`           | Add 7 cron methods                    |
| `packages/desktop/src/main/ipc/ws-handlers.ts`             | Add 7 IPC handlers                    |
| `packages/desktop/src/preload/index.ts`                    | Add 7 preload methods                 |
| `packages/desktop/src/preload/clawwork.d.ts`               | Add 7 type declarations               |
| `packages/desktop/src/renderer/stores/uiStore.ts`          | Add `'cron'` to MainView              |
| `packages/desktop/src/renderer/layouts/LeftNav/index.tsx`  | Add Clock icon (expanded + collapsed) |
| `packages/desktop/src/renderer/layouts/MainArea/index.tsx` | Add cron route                        |
| `packages/desktop/src/renderer/i18n/locales/en.json`       | Add cron i18n keys                    |
| `packages/desktop/src/renderer/i18n/locales/zh.json`       | Add cron i18n keys                    |

## 8. Job Lifecycle

### 8.1 Creation flow

```
User clicks [+ New Job]
  → Dialog opens (create mode)
  → User fills essential fields
  → [Optional] User expands advanced section
  → User clicks Save
  → Client builds CronJobCreate:
      {
        name,
        enabled: true,
        schedule: { kind: 'cron', expr: '0 9 * * 1-5', tz: 'Asia/Shanghai' },
        sessionTarget: 'isolated',
        wakeMode: 'now',
        payload: { kind: 'agentTurn', message: '/new summarize today' },
        // delivery, failureAlert, agentId, etc. if configured
      }
  → cron.add RPC
  → Server validates (expression, timestamp, constraints)
  → On success: close dialog, refreshData(), toast "Job created"
  → On error: show server error in dialog, keep open
```

### 8.2 Edit flow

```
User clicks [✏] on a job card
  → Dialog opens (edit mode) pre-filled with current values
  → User modifies fields
  → User clicks Save
  → Client computes diff → builds CronJobPatch (only changed fields)
  → cron.update RPC with { jobId, patch }
  → On success: close dialog, refreshData()
  → On error: show error in dialog
```

### 8.3 Enable/disable toggle

```
User flips toggle on a card
  → Optimistic UI: update local state immediately
  → cron.update({ jobId, patch: { enabled: !current } })
  → On success: refreshData() (reconciles optimistic state with server truth)
  → On error: revert toggle, show toast
```

### 8.4 Run Now

```
User clicks [▶ Run]
  → cron.run({ jobId, mode: 'force' })
  → On success (enqueued: true):
      toast "Job enqueued"
      refreshData() immediately (picks up runningAtMs)
      schedule deferred refreshData() after 5s (picks up completion state)
  → On success (ran: false): toast with reason
  → On error: toast with error
```

### 8.5 Delete

```
User clicks [🗑]
  → Confirmation dialog: "Delete '{job.name}'? This cannot be undone."
  → On confirm: cron.remove({ jobId })
  → On success: refreshData(), toast "Job deleted"
  → On error: toast with error
```

### 8.6 One-shot jobs (schedule.kind = 'at')

- Created with a future timestamp
- Server auto-disables after successful run
- If `deleteAfterRun: true`, server removes the job entirely
- UI shows "One-time" badge and the target time

**Visibility of completion state:** The server disables/removes the job asynchronously after execution. The client has no WS push for cron state changes. The user will see the updated state:

- After `cron.run` (manual): the deferred 5s `refreshData()` picks up the change
- After natural trigger (server-side cron fire): only visible on next manual refresh or navigation back to CronPanel
- This is an inherent limitation of the pull model. The UI does NOT promise real-time state updates for naturally-triggered one-shot jobs. The manual refresh button and the "last refreshed" timestamp in the status bar make this transparent to the user.

### 8.7 Error recovery (server-managed)

The server handles retry/backoff automatically. The UI's role:

- Show `consecutiveErrors` count as a warning badge
- Show `lastError` message on hover/expand
- Show backoff-adjusted `nextRunAtMs` (may be later than natural schedule)
- User can manually [▶ Run] to test a fix
- User can edit the job to fix the root cause

## 9. i18n Keys

```
leftNav.scheduledTasks
cron.title
cron.subtitle
cron.schedulerActive
cron.schedulerDisabled
cron.jobCount (with interpolation)
cron.nextWake
cron.addJob
cron.editJob
cron.deleteJob
cron.deleteConfirm
cron.runNow
cron.runEnqueued
cron.runNotRun
cron.noJobs
cron.noJobsDesc
cron.createSchedule
cron.name
cron.description
cron.enabled
cron.schedule
cron.scheduleType.cron
cron.scheduleType.every
cron.scheduleType.at
cron.cronExpression
cron.timezone
cron.interval
cron.runAt
cron.payloadType
cron.payloadType.agentTurn
cron.payloadType.systemEvent
cron.message
cron.eventText
cron.sessionTarget
cron.sessionTarget.isolated
cron.sessionTarget.main
cron.sessionTarget.named
cron.sessionId
cron.advanced
cron.agent
cron.model
cron.thinking
cron.timeout
cron.wakeMode
cron.wakeMode.now
cron.wakeMode.nextHeartbeat
cron.deleteAfterRun
cron.delivery
cron.delivery.none
cron.delivery.announce
cron.delivery.webhook
cron.deliveryChannel
cron.deliveryWebhookUrl
cron.failureAlert
cron.failureAlertAfter
cron.nextRun
cron.lastRun
cron.lastStatus
cron.consecutiveErrors
cron.runHistory
cron.runHistory.time
cron.runHistory.status
cron.runHistory.duration
cron.runHistory.model
cron.runHistory.summary
cron.runHistory.delivery
cron.runHistory.usage
cron.runHistory.error
cron.filterAll
cron.filterEnabled
cron.filterDisabled
cron.sortNextRun
cron.sortUpdated
cron.sortName
cron.save
cron.cancel
cron.refresh
cron.showingRange
cron.prev
cron.next
cron.oneTime
cron.completed
cron.running
cron.mainSessionNote
```

## 10. Implementation Order

| Step | What                        | Files                               | Depends on |
| ---- | --------------------------- | ----------------------------------- | ---------- |
| 1    | Shared types                | `packages/shared/src/types.ts`      | —          |
| 2    | GatewayClient methods       | `gateway-client.ts`                 | Step 1     |
| 3    | IPC handlers                | `ws-handlers.ts`                    | Step 2     |
| 4    | Preload + type declarations | `preload/index.ts`, `clawwork.d.ts` | Step 3     |
| 5    | MainView routing            | `uiStore.ts`, `MainArea/index.tsx`  | —          |
| 6    | LeftNav icon                | `LeftNav/index.tsx`                 | Step 5     |
| 7    | CronJobCard                 | `CronPanel/CronJobCard.tsx`         | Step 1     |
| 8    | CronPanel (main)            | `CronPanel/index.tsx`               | Steps 4, 7 |
| 9    | CronJobDialog               | `CronPanel/CronJobDialog.tsx`       | Steps 4, 1 |
| 10   | CronRunHistory              | `CronPanel/CronRunHistory.tsx`      | Step 4     |
| 11   | i18n                        | `en.json`, `zh.json`                | —          |
| 12   | Verify                      | `pnpm check`                        | All        |

Steps 1–4 (RPC plumbing) can be done as one batch.
Steps 5–6 (routing) can be done in parallel with 1–4.
Steps 7–10 (UI components) are sequential but can be parallelized by component.
Step 11 (i18n) can be done at any point.

## 11. What is NOT in scope

- Cron expression visual editor (plain text input)
- Client-side cron expression validation (server validates)
- Cron expression parser library
- Local cron job persistence
- Real-time job status updates (no WS events for cron state changes)
- Zustand store for cron data
- Job cloning
- Bulk operations (enable/disable all)
- Global run history view (only per-job for now)

## 12. Verification

```bash
pnpm check  # typecheck + lint + test
```

Manual:

1. Clock icon in LeftNav (expanded + collapsed), before Settings
2. Click → CronPanel loads, Settings closes
3. Gateway selector works, scheduler status displayed
4. Filter tabs (All/Enabled/Disabled) + search + sort
5. Create job → fills form → save → appears in list
6. Edit job → modify → save → list updated
7. Toggle enabled → immediate optimistic update
8. Run Now → toast with result
9. History → run log table with pagination
10. Delete → confirmation → removed
11. Error job → warning badge visible
12. Empty state with CTA
13. Disconnected gateway → appropriate error state
14. One-shot (at) job → shows "One-time" badge
15. Both dark/light themes
16. Scheduler status line updates after add/delete/toggle
17. Switch gateway → dialog closes, history closes, list resets, filter preserved
18. Run Now on one-shot job → deferred refresh shows disabled state after ~5s
19. Manual refresh button works from header

## Appendix A: Design Review — Resolved Issues

Issues found during review, with resolution and server-side evidence.

### P1: delivery.to IS the webhook URL (not a separate field)

**Problem:** Type definition has `to?: string` in CronDelivery, but UI design showed "Webhook URL" as if it were a separate field.

**Resolution:** When `mode: "webhook"`, `delivery.to` is the HTTP/HTTPS URL. Server validates via `normalizeHttpWebhookUrl()` in `src/cron/webhook-url.ts`. No additional field needed. UI label "Webhook endpoint" maps directly to `delivery.to`.

### P1: sessionTarget "current" excluded from CronPanel create form

**Problem:** "current" resolves via `sessionContext.sessionKey` at normalization time (`src/cron/normalize.ts`). CronPanel has no ambient session, so "current" would silently fall back to "isolated" on the server.

**Resolution:** CronPanel form offers only `isolated` / `main` / `session:<id>`. Jobs created via agent tool with `current` will have been normalized to `session:<key>` server-side before we see them. Card display handles any raw value gracefully.

### P2: cron.update takes `{ jobId, patch }`, not flat fields

**Problem:** GatewayClient section wrote `{ jobId, ...patch }` (flat), IPC section wrote `{ jobId, patch }` (nested). Server schema (`CronUpdateParamsSchema`) requires `{ (id | jobId), patch: CronJobPatch }`.

**Resolution:** All 3 layers standardized on `{ jobId, patch: CronJobPatch }`. GatewayClient sends `this.sendReq('cron.update', { jobId, patch })`.

### P2: scheduler status refreshed after mutations

**Problem:** Status bar fetched once on mount but never refreshed, showing stale job count and next-wake after add/remove.

**Resolution:** Data fetching strategy updated: re-fetch BOTH `cron.list` AND `cron.status` after every mutation (add/update/remove/run).

### P2: session:\<id\> is free-form text input

**Problem:** No defined UX for entering a named session identifier.

**Resolution:** When user selects "Named session" target, a text input appears for the session identifier. Value is stored as `session:<user-input>`. At runtime, cron service resolves via `resolveCronSession()` which loads/creates the session store entry automatically. No lookup mechanism needed.

### P3: CronStatusBar / CronScheduleBadge inlined

**Problem:** Component tree listed CronStatusBar.tsx but file inventory said "5 new files" without it.

**Resolution:** Both CronStatusBar and CronScheduleBadge are inlined — status bar is a single line in CronPanel header, schedule badge is conditional rendering in CronJobCard. Neither justifies a separate file. New file count: 4.

---

### Review Round 2

### P1: one-shot completion state honest about pull model

**Problem:** Document claimed one-shot jobs would show "disabled + Completed" and `deleteAfterRun` jobs would disappear, but the refresh model (no polling, no WS push) can't guarantee when the user sees these changes.

**Resolution:** Section 8.6 rewritten. For manual `cron.run`: the deferred 5s `refreshData()` picks up completion. For naturally-triggered cron fires: visible only on next manual refresh. This limitation is made explicit. The refresh button and status bar timestamp make the pull model transparent.

### P1: "complete mirror" claim replaced with "canonical projection"

**Problem:** Architecture section 3.3 claimed "complete server type definitions" but `CronListParams` omitted `includeDisabled`, `CronRunsParams` omitted singular aliases, and `id | jobId` was canonicalized to `jobId` only.

**Resolution:** Section 3.3 rewritten as "client-canonical types derived from server contract". Each deviation documented: `includeDisabled` superseded by `enabled` enum, singular aliases omitted in favor of array forms, `id` canonicalized to `jobId`. The types are a **canonical projection**, not a mirror.

### P2: lifecycle sections unified under refreshData()

**Problem:** Data fetching section defined "re-fetch BOTH" but lifecycle flows still said "refresh list" (create, delete) or "no-op" (toggle success).

**Resolution:** All lifecycle flows now reference `refreshData()` by name. Toggle success calls `refreshData()` to reconcile optimistic state. `cron.run` documents immediate + deferred refresh. Single refresh path, no ambiguity.

### P2: gateway switching state cleanup rules defined

**Problem:** No rules for what happens to `editingJob`, `historyJobId`, `dialogOpen` when gateway changes.

**Resolution:** New section 6.11 defines the full state reset table: dialog closes, history panel closes, jobs/total/status cleared, offset reset to 0, deferred timer cancelled. Filter/sort preferences preserved (user preference, not gateway-bound).

### P2: source-of-truth boundary made explicit

**Problem:** Document mixed public RPC contract facts with server implementation internals without marking which is which.

**Resolution:** New section 3.6 separates the two sources. Lists which server internals were used and why. States the invariant: if server implementation changes but RPC contract stays, client still works.

### P3: CronRunHistory scope locked to per-job only

**Problem:** Component tree said "per-job or global" but out-of-scope said no global history.

**Resolution:** Component tree and file inventory both say "per-job" only. `CronRunsParams.scope` hardcoded to `'job'` in the UI layer.
