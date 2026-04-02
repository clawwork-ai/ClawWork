# ClawWork Gateway Capability Map

> ClawWork 实际使用了哪些 Gateway 能力，每个接口在哪里调用，Gateway 完整能力怎么查。
> 版本: ClawWork main @ 2026-04-02, OpenClaw Gateway 2026.4.2

---

## How to Use This Document

```
新功能开发:
  1. 在 §1 "已用能力" 中查找 → 有现成调用? 直接复用
  2. 在 §2 "未用能力" 中查找 → Gateway 已支持? 直接接入
  3. 都没有? → 去 whitepaper §5 查完整方法列表, 或去 openclaw 源码看 schema

排错:
  1. 在 §1 找到出问题的方法 → 看 "ClawWork 调用位置" 列
  2. 对照 "Gateway Schema" 列 → 去 openclaw 源码确认参数/返回值
  3. 看 §3 事件表 → 确认事件是否正确处理/是否缺少处理
```

---

## 1. ClawWork 已使用的 Gateway RPC 方法 (30 个)

### 1.1 Chat — 核心对话

| Gateway 方法   | ClawWork 调用                               | IPC Channel                           | 用途                                            |
| -------------- | ------------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| `chat.send`    | `gateway-client.ts:535` `sendChatMessage()` | `ws:send-message`                     | 发送用户消息，触发 AI 流式响应                  |
| `chat.history` | `gateway-client.ts:542` `getChatHistory()`  | `ws:chat-history`, `ws:sync-sessions` | 获取会话历史 (默认 limit=50, sync 时 limit=200) |
| `chat.abort`   | `gateway-client.ts:538` `abortChat()`       | `ws:abort-chat`                       | 中止正在运行的 AI 回复                          |

> Gateway Schema: `src/gateway/protocol/schema/logs-chat.ts`
> Gateway Handler: `src/gateway/server-methods/chat.ts`

**ClawWork 使用细节:**

- `chat.send` 固定传 `deliver: false` (不投递到外部渠道), `idempotencyKey: randomUUID()`
- `chat.history` 在 sync-sessions 批量拉历史时使用 limit=200
- `chat.abort` 仅中止当前 run (不传 runId)

### 1.2 Sessions — 会话管理

| Gateway 方法                | ClawWork 调用                                     | IPC Channel                   | 用途                                      |
| --------------------------- | ------------------------------------------------- | ----------------------------- | ----------------------------------------- |
| `sessions.list`             | `gateway-client.ts:546` `listSessions()`          | `ws:list-sessions`            | 拉取全部会话列表                          |
| `sessions.list` (spawnedBy) | `gateway-client.ts:550` `listSessionsBySpawner()` | `ws:list-sessions-by-spawner` | 按 parent 过滤会话 (子 agent)             |
| `sessions.create`           | `gateway-client.ts:554` `createSession()`         | `ws:create-session`           | 创建新会话 (key + agentId + 可选初始消息) |
| `sessions.patch`            | `gateway-client.ts:601` `patchSession()`          | `ws:session-patch`            | 修改会话属性 (model, thinkingLevel 等)    |
| `sessions.reset`            | `gateway-client.ts:605` `resetSession()`          | `ws:session-reset`            | 重置会话 (reason: "new" \| "reset")       |
| `sessions.delete`           | `gateway-client.ts:609` `deleteSession()`         | `ws:session-delete`           | 删除会话 (固定 deleteTranscript=true)     |
| `sessions.compact`          | `gateway-client.ts:613` `compactSession()`        | `ws:session-compact`          | 压缩会话上下文                            |
| `sessions.usage`            | `gateway-client.ts:643` `getSessionUsage()`       | `ws:session-usage`            | 单会话 token 用量分析                     |

> Gateway Schema: `src/gateway/protocol/schema/sessions.ts`
> Gateway Handler: `src/gateway/server-methods/sessions.ts`

**ClawWork 未使用的 sessions 参数:**

- `sessions.list`: 未使用 `activeMinutes`, `includeGlobal`, `includeUnknown`, `includeDerivedTitles`, `includeLastMessage`, `search` 过滤
- `sessions.patch`: 传入泛型 `Record<string, unknown>`, 但 Gateway 支持 17 个可 patch 字段 (见 whitepaper §5.3)
- `sessions.usage`: 未使用 `startDate/endDate/mode/utcOffset/includeContextWeight`
- `sessions.delete`: 未使用 `emitLifecycleHooks` 参数

### 1.3 Agents — Agent 管理

| Gateway 方法        | ClawWork 调用                              | IPC Channel            | 用途                                        |
| ------------------- | ------------------------------------------ | ---------------------- | ------------------------------------------- |
| `agents.list`       | `gateway-client.ts:562` `listAgents()`     | `ws:agents-list`       | 列出所有 agent                              |
| `agents.create`     | `gateway-client.ts:566` `createAgent()`    | `ws:agents-create`     | 创建 agent (name, workspace, emoji, avatar) |
| `agents.update`     | `gateway-client.ts:575` `updateAgent()`    | `ws:agents-update`     | 更新 agent (name, workspace, model, avatar) |
| `agents.delete`     | `gateway-client.ts:585` `deleteAgent()`    | `ws:agents-delete`     | 删除 agent                                  |
| `agents.files.list` | `gateway-client.ts:589` `listAgentFiles()` | `ws:agents-files-list` | 列出 agent 文件                             |
| `agents.files.get`  | `gateway-client.ts:593` `getAgentFile()`   | `ws:agents-files-get`  | 读取 agent 文件                             |
| `agents.files.set`  | `gateway-client.ts:597` `setAgentFile()`   | `ws:agents-files-set`  | 写入 agent 文件                             |

> Gateway Schema: `src/gateway/protocol/schema/agents-models-skills.ts`
> Gateway Handler: `src/gateway/server-methods/agents.ts`

### 1.4 Models & Tools — 模型和工具

| Gateway 方法    | ClawWork 调用                               | IPC Channel        | 用途                                    |
| --------------- | ------------------------------------------- | ------------------ | --------------------------------------- |
| `models.list`   | `gateway-client.ts:558` `listModels()`      | `ws:models-list`   | 列出可用 AI 模型                        |
| `tools.catalog` | `gateway-client.ts:619` `getToolsCatalog()` | `ws:tools-catalog` | 获取工具目录 (固定 includePlugins=true) |
| `skills.status` | `gateway-client.ts:625` `getSkillsStatus()` | `ws:skills-status` | 获取技能状态                            |

> Gateway Schema: `src/gateway/protocol/schema/agents-models-skills.ts`

**ClawWork 未使用:** `tools.effective` (获取会话级实际可用工具), `skills.install`, `skills.update`, `skills.bins`

### 1.5 Usage — 用量统计

| Gateway 方法   | ClawWork 调用                              | IPC Channel       | 用途                    |
| -------------- | ------------------------------------------ | ----------------- | ----------------------- |
| `usage.status` | `gateway-client.ts:631` `getUsageStatus()` | `ws:usage-status` | 总用量概览              |
| `usage.cost`   | `gateway-client.ts:635` `getUsageCost()`   | `ws:usage-cost`   | 费用明细 (支持日期范围) |

> Gateway Schema: 见 whitepaper §5.17

### 1.6 Cron — 定时任务

| Gateway 方法  | ClawWork 调用                             | IPC Channel      | 用途             |
| ------------- | ----------------------------------------- | ---------------- | ---------------- |
| `cron.list`   | `gateway-client.ts:651` `listCronJobs()`  | `ws:cron-list`   | 列出定时任务     |
| `cron.status` | `gateway-client.ts:655` `getCronStatus()` | `ws:cron-status` | 定时服务状态     |
| `cron.add`    | `gateway-client.ts:659` `addCronJob()`    | `ws:cron-add`    | 创建定时任务     |
| `cron.update` | `gateway-client.ts:663` `updateCronJob()` | `ws:cron-update` | 更新定时任务     |
| `cron.remove` | `gateway-client.ts:667` `removeCronJob()` | `ws:cron-remove` | 删除定时任务     |
| `cron.run`    | `gateway-client.ts:671` `runCronJob()`    | `ws:cron-run`    | 手动执行定时任务 |
| `cron.runs`   | `gateway-client.ts:677` `listCronRuns()`  | `ws:cron-runs`   | 执行历史         |

> Gateway Schema: `src/gateway/protocol/schema/cron.ts`

### 1.7 Approvals — 执行审批

| Gateway 方法            | ClawWork 调用                             | IPC Channel                | 用途              |
| ----------------------- | ----------------------------------------- | -------------------------- | ----------------- |
| `exec.approval.resolve` | `ws-handlers.ts:556` `sendReq()` 直接调用 | `ws:exec-approval-resolve` | 批准/拒绝执行请求 |

> Gateway Schema: `src/gateway/protocol/schema/exec-approvals.ts`

**ClawWork 未使用:** `exec.approval.request`, `exec.approval.waitDecision`, `exec.approvals.get`, `exec.approvals.set`

### 1.8 System — 系统

| Gateway 方法 | ClawWork 调用                            | IPC Channel | 用途               |
| ------------ | ---------------------------------------- | ----------- | ------------------ |
| `health`     | `gateway-client.ts:706` heartbeat 定时器 | — (内部)    | 心跳保活，定时发送 |

---

## 2. ClawWork 未使用的 Gateway 能力 (80+ 个方法)

按功能域分组，标注潜在用途。

### 2.1 可直接接入的高价值能力

| Gateway 方法                    | 潜在用途                                          | Gateway Schema            |
| ------------------------------- | ------------------------------------------------- | ------------------------- |
| `sessions.subscribe`            | 实时监听会话列表变化，替代轮询                    | `sessions.ts`             |
| `sessions.unsubscribe`          | 配合 subscribe 使用                               | `sessions.ts`             |
| `sessions.messages.subscribe`   | 实时监听单会话消息，支持多窗口同步                | `sessions.ts`             |
| `sessions.messages.unsubscribe` | 配合 subscribe 使用                               | `sessions.ts`             |
| `sessions.preview`              | 批量获取会话预览片段 (比逐个 chat.history 更高效) | `sessions.ts`             |
| `tools.effective`               | 获取会话级实际工具列表 (比 tools.catalog 更精确)  | `agents-models-skills.ts` |
| `agent.identity.get`            | 获取 agent 头像/名称 (agent 切换时展示)           | `agent.ts`                |
| `chat.inject`                   | 注入系统消息 (admin/调试用)                       | `logs-chat.ts`            |
| `config.get` / `config.set`     | 读写 Gateway 配置 (设置面板)                      | `config.ts`               |
| `config.schema`                 | 获取配置 JSON Schema (动态生成设置表单)           | `config.ts`               |
| `status`                        | 系统状态概览 (Dashboard)                          | —                         |
| `channels.status`               | 渠道连接状态 (连接管理面板)                       | `channels.ts`             |

### 2.2 次优先级能力

| Gateway 方法                | 潜在用途                                | Gateway Schema |
| --------------------------- | --------------------------------------- | -------------- |
| `agent`                     | 完整 agent 调用 (比 chat.send 更多参数) | `agent.ts`     |
| `agent.wait`                | 等待 agent 运行完成 (同步工作流)        | `agent.ts`     |
| `sessions.send`             | 高级会话发送 (比 chat.send 更多控制)    | `sessions.ts`  |
| `sessions.abort`            | 会话级中止 (比 chat.abort 更高级)       | `sessions.ts`  |
| `talk.speak`                | TTS 文本转语音                          | `channels.ts`  |
| `talk.config` / `talk.mode` | 语音模式配置                            | `channels.ts`  |
| `update.run`                | 触发 Gateway 软件更新                   | —              |
| `logs.tail`                 | 流式读取 Gateway 日志 (调试面板)        | `logs-chat.ts` |
| `doctor.memory.status`      | 内存诊断 (健康面板)                     | —              |
| `wake`                      | 唤醒 agent                              | `agent.ts`     |

### 2.3 设备/节点/插件管理 (当前不需要)

| 方法组                                                                 | 方法数 | Gateway Schema            |
| ---------------------------------------------------------------------- | ------ | ------------------------- |
| `device.pair.*` / `device.token.*`                                     | 6      | `devices.ts`              |
| `node.*`                                                               | 15     | `nodes.ts`                |
| `plugin.approval.*`                                                    | 3      | `plugin-approvals.ts`     |
| `exec.approvals.*` (settings)                                          | 4      | `exec-approvals.ts`       |
| `wizard.*`                                                             | 4      | `wizard.ts`               |
| `tts.*`                                                                | 6      | `channels.ts`             |
| `voicewake.*`                                                          | 2      | —                         |
| `secrets.*`                                                            | 2      | `secrets.ts`              |
| `skills.install` / `skills.update` / `skills.bins`                     | 3      | `agents-models-skills.ts` |
| `send` / `poll` / `push.test`                                          | 3      | `agent.ts`, `push.ts`     |
| `config.apply` / `config.patch` / `config.schema.lookup`               | 3      | `config.ts`               |
| `gateway.identity.get` / `system-presence` / `system-event`            | 3      | —                         |
| `channels.logout` / `web.login.*`                                      | 3      | `channels.ts`             |
| `last-heartbeat` / `set-heartbeats` / `node.canvas.capability.refresh` | 3      | —                         |

---

## 3. ClawWork 事件处理状态

### 3.1 已处理的事件 (6 个)

| Gateway 事件              | 处理位置                                           | 处理逻辑                                                                     |
| ------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `connect.challenge`       | `gateway-client.ts:216`                            | 触发 connect 握手 (发送设备签名 + auth)                                      |
| `tick`                    | `gateway-client.ts:239`                            | 日志记录，无操作 (心跳由 client 主动发 health RPC)                           |
| `chat`                    | `gateway-dispatcher.ts:582` → `handleChatEvent()`  | 流式响应: delta→累加文本, final→持久化消息, error→toast, aborted→清除        |
| `agent`                   | `gateway-dispatcher.ts:584` → `handleAgentEvent()` | 工具调用: tool stream→更新工具状态, lifecycle→处理中标记, error→去重错误提示 |
| `exec.approval.requested` | `gateway-dispatcher.ts:586`                        | 添加到 ApprovalStore, 桌面通知, TTL 过期计时                                 |
| `exec.approval.resolved`  | `gateway-dispatcher.ts:588`                        | 从 ApprovalStore 移除                                                        |

### 3.2 未处理的事件 (18 个) — 扩展机会

| Gateway 事件                | 潜在用途                                    | 接入难度                |
| --------------------------- | ------------------------------------------- | ----------------------- |
| `sessions.changed`          | **高价值** — 实时更新会话列表，替代手动刷新 | 低 (加 dispatcher case) |
| `session.message`           | **高价值** — 多窗口消息同步，子 agent 进度  | 低 (需先 subscribe)     |
| `session.tool`              | **高价值** — 多窗口工具状态同步             | 低 (需先 subscribe)     |
| `presence`                  | 显示谁在线 (多设备场景)                     | 低                      |
| `health`                    | 系统健康指示器 (状态栏)                     | 低                      |
| `shutdown`                  | 优雅处理 Gateway 关闭 (提示用户)            | 低                      |
| `update.available`          | 提示用户 Gateway 可更新                     | 低                      |
| `plugin.approval.requested` | 插件安装审批 UI                             | 中                      |
| `plugin.approval.resolved`  | 插件审批结果                                | 中                      |
| `cron`                      | 定时任务执行通知                            | 中                      |
| `device.pair.requested`     | 设备配对审批                                | 中                      |
| `device.pair.resolved`      | 设备配对结果                                | 中                      |
| `node.pair.requested`       | 节点配对审批                                | 中                      |
| `node.pair.resolved`        | 节点配对结果                                | 中                      |
| `node.invoke.request`       | 节点任务分发                                | 高 (需节点支持)         |
| `voicewake.changed`         | 语音唤醒配置变更                            | 低                      |
| `talk.mode`                 | 语音模式切换                                | 低                      |
| `heartbeat`                 | Agent 心跳确认                              | 低                      |

---

## 4. 架构总览: 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│ Renderer (React)                                                │
│                                                                 │
│  Components                                                     │
│    ↕ useGatewayBootstrap()  hooks/useGatewayBootstrap.ts        │
│    ↕ platform adapter       platform/electron-adapter.ts        │
│                                                                 │
│  Stores (Zustand)                                               │
│    MessageStore   → chat/agent 事件更新                          │
│    UiStore        → 连接状态, catalog, 版本信息                   │
│    ApprovalStore  → exec approval 事件更新                       │
│                                                                 │
├─── IPC Bridge ──────────────────────────────────────────────────┤
│                                                                 │
│  preload/index.ts                                               │
│    gateway.invoke(channel, params)  → ipcRenderer.invoke()      │
│    gateway.onEvent(callback)        → ipcRenderer.on()          │
│    gateway.onStatus(callback)       → ipcRenderer.on()          │
│                                                                 │
├─── Main Process ────────────────────────────────────────────────┤
│                                                                 │
│  ipc/ws-handlers.ts (30 IPC handlers)                           │
│    ws:send-message    → gw.sendChatMessage()                    │
│    ws:chat-history    → gw.getChatHistory()                     │
│    ws:abort-chat      → gw.abortChat()                          │
│    ws:list-sessions   → gw.listSessions()                       │
│    ws:create-session  → gw.createSession()                      │
│    ws:session-patch   → gw.patchSession()                       │
│    ws:session-reset   → gw.resetSession()                       │
│    ws:session-delete  → gw.deleteSession()                      │
│    ws:session-compact → gw.compactSession()                     │
│    ws:session-usage   → gw.getSessionUsage()                    │
│    ws:models-list     → gw.listModels()                         │
│    ws:agents-*        → gw.listAgents/create/update/delete()    │
│    ws:agents-files-*  → gw.listAgentFiles/get/set()             │
│    ws:tools-catalog   → gw.getToolsCatalog()                    │
│    ws:skills-status   → gw.getSkillsStatus()                    │
│    ws:usage-*         → gw.getUsageStatus/Cost()                │
│    ws:cron-*          → gw.listCronJobs/add/update/remove/run() │
│    ws:exec-approval-* → gw.sendReq('exec.approval.resolve')    │
│    ws:sync-sessions   → batch listSessions + getChatHistory     │
│    ...                                                          │
│                                                                 │
│  ws/gateway-client.ts (WebSocket client)                        │
│    sendReq(method, params) → JSON frame → WebSocket             │
│    handleEvent(event)      → IPC → Renderer                     │
│    heartbeat               → health RPC every N ms              │
│    reconnect               → exponential backoff                │
│                                                                 │
├─── WebSocket ───────────────────────────────────────────────────┤
│                                                                 │
│  ws://localhost:18789                                            │
│                                                                 │
└───── OpenClaw Gateway ──────────────────────────────────────────┘
```

---

## 5. ConnectParams — ClawWork 连接参数

> Source: `packages/desktop/src/main/ws/gateway-client.ts:277-310`

```typescript
{
  minProtocol: 3,
  maxProtocol: 3,
  client: {
    id: "gateway-client",         // ⚠️ 应该用 "openclaw-macos" (见 whitepaper §3.3)
    displayName: "ClawWork Desktop",
    version: app.getVersion(),
    platform: process.platform,
    mode: "backend"               // ⚠️ 应该用 "ui" (见 whitepaper §3.3)
  },
  caps: ["tool-events"],
  role: "operator",
  scopes: [
    "operator.admin",
    "operator.write",
    "operator.read",
    "operator.approvals",
    "operator.pairing"
  ],
  device: {
    id: "<sha256-of-public-key>",
    publicKey: "<base64url-ed25519>",
    signature: "<base64url-signature>",
    signedAt: Date.now(),
    nonce: "<from-connect.challenge>"
  },
  auth: {
    token?: string,
    password?: string,
    bootstrapToken?: string,
    deviceToken?: string          // 首次配对后由 Gateway 签发，后续重连使用
  }
}
```

---

## 6. 关键文件清单

### ClawWork 侧

| 文件                                                         | 职责                                                |
| ------------------------------------------------------------ | --------------------------------------------------- |
| `packages/desktop/src/main/ws/gateway-client.ts`             | WebSocket 客户端: 连接、握手、RPC、事件、心跳、重连 |
| `packages/desktop/src/main/ws/index.ts`                      | 多 Gateway 管理: init/add/remove/reconnect          |
| `packages/desktop/src/main/ipc/ws-handlers.ts`               | IPC Handler 注册: 30 个 `ipcMain.handle()`          |
| `packages/desktop/src/preload/index.ts`                      | IPC Bridge: renderer ↔ main 通信                    |
| `packages/core/src/services/gateway-dispatcher.ts`           | 事件分发: chat/agent/approval 事件处理              |
| `packages/desktop/src/renderer/hooks/useGatewayBootstrap.ts` | Renderer 初始化: 事件订阅、catalog 拉取             |
| `packages/core/src/stores/message-store.ts`                  | 消息状态: 流式累加、工具调用、持久化                |
| `packages/core/src/stores/ui-store.ts`                       | UI 状态: 连接状态、catalog、版本                    |
| `packages/desktop/src/renderer/stores/approvalStore.ts`      | 审批状态: pending approvals + TTL                   |
| `packages/shared/src/gateway-protocol.ts`                    | 类型定义: Frame types, ConnectParams, Auth          |

### OpenClaw Gateway 侧 (按查找频率排序)

| 文件                                                  | 职责                                                    |
| ----------------------------------------------------- | ------------------------------------------------------- |
| `src/gateway/protocol/schema/logs-chat.ts`            | chat.send/history/abort schema                          |
| `src/gateway/protocol/schema/sessions.ts`             | sessions.\* schema                                      |
| `src/gateway/protocol/schema/agent.ts`                | agent/send/poll schema + AgentEvent                     |
| `src/gateway/protocol/schema/agents-models-skills.ts` | agents/models/tools/skills schema                       |
| `src/gateway/protocol/schema/cron.ts`                 | cron.\* schema                                          |
| `src/gateway/protocol/schema/frames.ts`               | ConnectParams, HelloOk, Frame types                     |
| `src/gateway/protocol/schema/exec-approvals.ts`       | exec.approval.\* schema                                 |
| `src/gateway/server-methods-list.ts`                  | 完整方法列表 (BASE_METHODS) + 事件列表 (GATEWAY_EVENTS) |
| `src/gateway/method-scopes.ts`                        | 方法→scope 权限映射                                     |
| `src/gateway/server-broadcast.ts`                     | 事件广播 + scope guard                                  |
| `src/gateway/server-methods/chat.ts`                  | chat handler 实现                                       |
| `src/gateway/server-methods/sessions.ts`              | sessions handler 实现                                   |

---

## 7. 添加新 Gateway 能力的 Checklist

当你要在 ClawWork 中接入一个新的 Gateway 方法时:

```
□ 1. 确认方法存在
     → 查 openclaw: src/gateway/server-methods-list.ts (BASE_METHODS)
     → 查 whitepaper §5 方法列表

□ 2. 理解方法参数和返回值
     → 查 openclaw: src/gateway/protocol/schema/<domain>.ts
     → 查 whitepaper 对应小节的 TypeScript 定义

□ 3. 确认权限要求
     → 查 openclaw: src/gateway/method-scopes.ts
     → ClawWork 默认请求 operator.admin, 所以几乎所有方法都能调用

□ 4. 在 GatewayClient 添加方法
     → 编辑: packages/desktop/src/main/ws/gateway-client.ts
     → 模式: async methodName(params): Promise<Record<string, unknown>> {
              return this.sendReq('<gateway.method>', params);
            }

□ 5. 在 IPC Handler 暴露给 Renderer
     → 编辑: packages/desktop/src/main/ipc/ws-handlers.ts
     → 模式: ipcMain.handle('ws:<method-name>', async (_event, payload) =>
              gatewayRpc(payload.gatewayId, (gw) => gw.methodName(payload))
            );

□ 6. 在 Preload 声明 IPC Channel (如果需要新 channel)
     → 编辑: packages/desktop/src/preload/index.ts

□ 7. 在 Renderer 调用
     → 通过 platform adapter 或直接 invoke('ws:<method-name>', params)

□ 8. 如果方法触发新事件，在 Dispatcher 添加处理
     → 编辑: packages/core/src/services/gateway-dispatcher.ts
     → 添加 else if (data.event === '<event-name>') 分支
```

当你要处理一个新的 Gateway 事件时:

```
□ 1. 确认事件存在
     → 查 openclaw: src/gateway/server-methods-list.ts (GATEWAY_EVENTS)
     → 查 whitepaper §4 事件表

□ 2. 确认事件 scope 要求
     → 查 openclaw: src/gateway/server-broadcast.ts (EVENT_SCOPE_GUARDS)
     → 部分事件需要 operator.read / operator.approvals / operator.pairing

□ 3. 确认是否需要订阅
     → sessions.changed 需要 sessions.subscribe
     → session.message / session.tool 需要 sessions.messages.subscribe
     → 其他事件自动广播

□ 4. 在 Dispatcher 添加 handler
     → 编辑: packages/core/src/services/gateway-dispatcher.ts
     → 在 dispatch switch 中添加分支

□ 5. 更新 Store
     → 根据事件性质更新 MessageStore / UiStore / 新 Store
```

---

## 8. Coverage Summary

```
Gateway 方法总计:    110+ (BASE_METHODS)
ClawWork 已使用:     30 (27%)
ClawWork 未使用:     80+ (73%)

Gateway 事件总计:    24
ClawWork 已处理:     6 (25%)
ClawWork 未处理:     18 (75%)

高价值未接入:
  - sessions.subscribe/unsubscribe        → 实时会话列表
  - sessions.messages.subscribe/unsubscribe → 多窗口消息同步
  - sessions.preview                      → 高效批量预览
  - tools.effective                       → 精确工具列表
  - config.get/set/schema                 → 设置面板
  - sessions.changed 事件                  → 替代轮询
  - session.message/session.tool 事件      → 多窗口同步
  - shutdown 事件                          → 优雅断开
  - update.available 事件                  → 更新提示
```
