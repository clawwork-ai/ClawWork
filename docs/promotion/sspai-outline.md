# Sspai Product Experience Article Outline

**Title:** 本地优先的 AI 工作台：OpenClaw Desktop 使用体验

**Target:** Week 2–4, product/experience audience (sspai.com)

**Angle:** Product experience — not a deep technical dive. Complement the Juejin technical article and Zhihu thought piece.

---

## Outline

### 1. 开场：Agent 能力有了，工作界面还停在聊天里

- 自托管 OpenClaw 让 Agent 能调用工具、读写文件、跑 cron
- 很多人仍用飞书/钉钉当「控制台」——能聊，但不好「干活」
- 引出：专用桌面客户端解决的是**工作流**，不是聊天体验

### 2. 第一印象：三栏工作区

- 左：任务列表（并行多任务，一眼看到状态）
- 中：对话（流式回复 + 工具调用卡片）
- 右：进度/产物（结构化跟踪，不是聊天记录里的附件）
- 配图：三栏截图 + 暗色主题

### 3. 一个完整任务走一遍

以「生成一个 Python CLI 小工具」为例（与 demo GIF 场景一致）：

1. 新建任务，选 Agent/模型
2. 发送指令，看流式回复
3. 展开工具调用卡片（exec、文件读写）
4. 产物自动落到本地 Git 仓库，文件浏览器可搜
5. 切换另一个任务 — 上下文完全隔离

### 4. 和飞书/Slack 通道对比（体验维度）

| 维度     | 聊天通道           | OpenClaw Desktop             |
| -------- | ------------------ | ---------------------------- |
| 多任务   | 单线程，易串上下文 | 并行任务，Session 隔离       |
| 工具调用 | 文本里一闪而过     | 实时卡片，可展开审批         |
| 产物     | 历史消息里难找     | Git 版本化 + 全文搜索        |
| 数据     | 第三方服务器       | SQLite + 本地 Git，100% 本地 |

### 5. 几个日常场景

- **并行开发**：同时跑前端重构 + 文档生成 + 定时报告
- **定时任务**：cron 面板，手动触发，看运行历史
- **多 Gateway**：不同任务连不同 OpenClaw 实例/模型
- **Teams**：多 Agent 编排（协调者 + 执行者）

### 6. 安装与上手成本

- macOS：`brew tap clawwork-ai/clawwork && brew install --cask clawwork`
- 其他平台：GitHub Releases 下载 DMG/AppImage/deb
- PWA：浏览器打开 cpwa.pages.dev
- 首次启动：Gateway 配对（token / 密码 / pairing code）

### 7. 适合谁 / 不适合谁

**适合：**

- 已跑 OpenClaw，受困于聊天通道局限的开发者
- 重视本地数据、Git 产物、多任务并行的 power user

**暂不适合：**

- 还没部署 OpenClaw（需要先搭 Gateway）
- 只要单轮问答、不需要工具链和产物管理

### 8. 结语

- 开源地址：https://github.com/clawwork-ai/ClawWork
- Discord 反馈：https://discord.gg/n9fCgBMgm
- 邀请读者试用并留言使用场景

**Estimated length:** 1500–2500 字

**Assets needed:** 3–4 截图 + demo GIF 链接
