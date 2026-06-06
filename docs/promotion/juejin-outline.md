# Juejin Technical Article Outline

**Title:** 用 Electron + React 19 构建 OpenClaw 专用桌面客户端 — ClawWork 技术实践

**Target:** Week 2–4, technical depth audience

---

## Outline

### 1. 背景：为什么聊天界面承载不了 Agent 工作流

- OpenClaw 的能力 vs 飞书/Slack 通道的结构性缺陷
- 多任务并行、工具调用、产物管理的真实痛点
- 产品定位：OpenClaw 的 GitHub Desktop

### 2. 架构总览

- Monorepo 分层：`shared` → `core` → `desktop` / `pwa`
- 单 Gateway WebSocket，Session Key 隔离：`agent:main:clawwork:task:<taskId>`
- 本地数据：SQLite (Drizzle ORM + FTS5) + Git 产物仓库
- 配图：`docs/architecture.svg`

### 3. Electron 主进程设计

- Gateway WebSocket 连接管理与事件分发
- IPC 通道设计（类型安全的 preload bridge）
- 产物自动提取管线（代码块、远程图片 → 本地文件）
- SQLite 消息持久化与去重

### 4. React 19 渲染层

- 三栏布局与 Zustand store 拆分
- 工具调用卡片的流式渲染
- Tailwind v4 踩坑记录（@theme、CSS 变量迁移）
- Zustand 无限循环调试经验

### 5. Gateway 协议逆向

- OpenClaw Gateway 消息格式与事件类型
- Session 生命周期：创建、重置、压缩、删除
- 多 Gateway 认证（token / password / pairing code）
- 参考：`docs/openclaw-gateway-source-guide.md`

### 6. 关键工程决策

- 为什么选 SQLite 而非云端同步
- FTS5 全文搜索的实现与性能
- 跨平台打包（electron-builder + Homebrew cask）
- 自动更新策略

### 7. 开源与贡献

- Apache 2.0，欢迎 PR
- `pnpm check` 验证门禁
- GitHub: https://github.com/clawwork-ai/ClawWork

**Estimated length:** 3000–5000 字
