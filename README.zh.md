<div align="center">

<table border="0" cellspacing="0" cellpadding="0"><tr>
<td><img src="./docs/screenshot.png" alt="ClawWork Desktop" height="420" /></td>
<td><img src="https://github.com/user-attachments/assets/3dd775d0-8441-45d9-92f5-19e843f793c4" alt="ClawWork PWA" height="420" /></td>
</tr></table>

[English](./README.md) · **简体中文** · [繁體中文](./README.zh-TW.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md)

# ClawWork

**面向 Agent OS 时代的本地优先工作台。**

[OpenClaw](https://github.com/openclaw/openclaw) 的桌面客户端 —— 让 Agent 任务并行运行、让 artifacts 不丢失、让文件不再消失。

[![GitHub release](https://img.shields.io/github/v/release/clawwork-ai/clawwork?style=flat-square)](https://github.com/clawwork-ai/clawwork/releases/latest)
[![License](https://img.shields.io/github/license/clawwork-ai/clawwork?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/clawwork-ai/clawwork?style=flat-square)](https://github.com/clawwork-ai/clawwork)

[下载](#下载) · [**PWA**](https://cpwa.pages.dev) · [快速开始](#快速开始) · [Teams](#teams) · [功能特性](#功能特性) · [数据与架构](#数据与架构) · [仓库结构](#仓库结构) · [Roadmap](#roadmap) · [贡献](#贡献) · [Keynote](https://clawwork-ai.github.io/ClawWork/keynote/)

</div>

> **⚠️ 官方仓库**
> 这是 ClawWork 的**官方**项目：https://github.com/clawwork-ai/clawwork
>
> 我们发现了山寨仓库（ClawWorkAi/ClawWork）和山寨网站（clawworkai.store），未经授权使用 ClawWork 名称。请认准上方官方链接。
>
> 官网：https://clawwork-ai.github.io/ClawWork/

## 为什么是 ClawWork

**Agent 在爆炸式增长。瓶颈不再是能力，而是操作界面。**

随着 Agent Runtime 越来越多，用户被迫在聊天窗口、网页 UI、终端之间来回切换，每个都有自己的上下文，彼此之间没有共享记忆。正如 IDE 成为了代码的操作层、终端成为了 Unix 的操作层 —— Agent OS 也需要一个工作台层。ClawWork 就是在建这一层：从 OpenClaw 的最佳客户端起步，向多 Runtime 未来演进。

### 现在：OpenClaw，从此不再被聊天记录淹没

OpenClaw 本身很强，但纯聊天是糟糕的承载容器。

一旦你同时跑多个会话、长任务、审批中断、生成的文件、定时自动化、不同的 gateway —— 聊天记录就会变成一滩泥。状态消失、文件消失、上下文消失。

ClawWork 解决这个问题。每个任务都是一个拥有持久会话、artifacts、控制、历史的独立工作台，以三栏布局呈现：左边任务列表、中间正在运行的工作、右边 artifacts 和上下文。

## Teams

一个 Agent 有用，但一群协调好的 Agent 就是一支生产力。

ClawWork Teams 把多个 Agent 打包成一个可部署单元 —— 角色、人格、技能、工作流俱全。**Coordinator** Agent 拆解任务并分派给 **Worker** Agent，每个 Worker 都在自己的子会话里运行。你实时看到完整的编排过程。

```
skill → agent → team
```

### Team 结构

```
teams/clawwork-dev/
├── TEAM.md                  # 团队元数据与工作流
└── agents/
    ├── manager/             # coordinator —— 协调团队
    │   ├── IDENTITY.md      # 角色与提示
    │   ├── SOUL.md          # 人格与风格
    │   └── skills.json      # 技能依赖
    ├── architect/            # worker —— 设计方案
    ├── frontend-dev/         # worker —— 构建 UI
    ├── core-dev/             # worker —— 构建核心逻辑
    └── ...
```

### 获取 Team 的三种方式

- **[TeamsHub](https://github.com/clawwork-ai/teamshub-community)** —— 从 Git 原生仓库浏览并安装社区贡献的 Team。
- **手动创建** —— 用分步向导定义 Agent、身份和技能。
- **AI Builder** —— 描述你的需求，让 LLM 为你设计 Team 结构、角色和提示。

安装后，创建任务时选择一个 Team，Coordinator 会接管后续。

## 下载

### Homebrew (macOS)

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

### 发布版

macOS、Windows、Linux 预构建版本见 [Releases 页面](https://github.com/clawwork-ai/clawwork/releases/latest)。应用自动更新 —— 新版本在后台下载，退出时安装。

### PWA (浏览器)

无需安装 —— 在任意现代浏览器中打开 **[cpwa.pages.dev](https://cpwa.pages.dev)**。支持桌面和移动端，可添加到主屏幕。

## 快速开始

1. 启动一个 OpenClaw Gateway。
2. 打开 ClawWork，在设置中添加 gateway。用 token、密码或配对码认证。默认本地端点：`ws://127.0.0.1:18789`。
3. 创建任务，选择 gateway 和 agent，描述工作内容。
4. 聊天：发送消息、附加图片、用 `@` 引用文件作为上下文、或用 `/` 命令。
5. 跟进任务执行、检查工具调用、保存输出文件。

## 功能特性

### ⚡ 任务优先的工作流

- 多任务并行，每个任务独立 OpenClaw 会话 —— 归档的任务可以重新打开
- 按 gateway 分类的会话目录
- 真正有用的会话控制：停止、重置、压缩、删除、同步
- 后台工作保持可读，不会全部挤成一条长线程
- 用 `cron`、`every`、`at` 表达式定时任务 —— 从预设选或自己写，查看运行历史，随时手动触发
- 导出任意会话为 Markdown，在应用外留下干净的记录

### 👁 一目了然

- 实时流式响应
- Agent 工作时内联显示工具调用卡片
- 侧边栏显示进度和 artifacts
- 花多少钱一目了然 —— 各 gateway 用量状态、各会话成本明细、30 天滚动仪表盘

### 🎛 更好的控制

- 多 gateway 支持
- 按任务切换 agent 和模型
- 直接管理你的 agents —— 创建、编辑、删除、浏览工作区文件，无需离开应用
- 浏览每个 gateway 的完整工具目录，清楚知道 agent 能做什么
- 思考级别控制和 slash 命令
- 敏感操作执行前的审批确认
- 后台事件会通知你 —— 任务完成、审批请求、gateway 断连 —— 点击通知跳回任务。每类事件可单独开关，噪音自己控制。

### 📂 更好的文件处理

- 真正有用的上下文：图片、`@` 文件引用、语音输入、监视文件夹
- 最多监视 10 个文件夹，自动检测变化并重建索引，上下文永远新鲜
- 本地 artifact 存储
- 助手回复中的代码块和远程图片会被自动提取并保存到工作区 —— 无需手动复制粘贴
- 跨任务、消息、artifacts 的全文搜索

### 🖥 更好的桌面体验

- 系统托盘支持
- 全局快捷键呼出的快速启动窗口（默认 `Alt+Space`，可自定义）
- 应用内完整的键盘快捷键
- 后台自动更新 —— 在设置里看到进度，退出时安装
- 根据你的舒适度缩放界面，记住偏好
- 明暗主题 + 8 种语言

### 🔧 调试

- 出问题时导出调试包（日志、gateway 状态、脱敏配置）—— 方便提 bug
- 设置里直接显示连接的 Gateway 服务器版本

## 数据与架构

ClawWork 通过单条 Gateway WebSocket 连接与 OpenClaw 通信。每个任务有自己的 session key 用于隔离，所有数据都存在你选定的本地工作区目录 —— 无云同步、无外部数据库。

- **Tasks** —— 每个任务映射到独立的 OpenClaw 会话，并行工作互不干扰。
- **Messages** —— 用户、助手、系统消息（包括工具调用和图片附件）全部本地持久化。
- **Artifacts** —— Agent 产出的代码块、图片、文件。从助手输出中自动提取，不会丢失。
- **全文搜索** —— 跨以上所有内容搜索。不记得是哪个任务里的代码片段？三周前的也能找回来。

<div align="center">
<img src="./docs/architecture.svg" alt="ClawWork Architecture" width="840" />
</div>

## 仓库结构

```
packages/shared/       — 协议类型、常量（零依赖）
packages/core/         — 共享业务逻辑：stores、services、ports
packages/desktop/
  src/main/            — Electron 主进程：gateway WS、IPC、DB、artifacts、OS 集成
  src/preload/         — 类型化的 window.clawwork 桥接层
  src/renderer/        — React UI：components、layouts、stores、hooks、i18n
packages/pwa/          — Progressive Web App（浏览器 + 移动端）
docs/                  — 设计文档、架构约束
e2e/                   — Playwright E2E 测试（冒烟 + gateway 集成）
scripts/               — 构建和检查脚本
website/               — 项目官网（React + Vite）
keynote/               — 演示文稿（Slidev）
```

## 技术栈

Electron 34、React 19、TypeScript、Tailwind CSS v4、Zustand、SQLite（Drizzle ORM + better-sqlite3）、Framer Motion。

## 平台说明

- 语音输入需要本地 [whisper.cpp](https://github.com/ggerganov/whisper.cpp) 可执行文件和模型。
- 自动更新器仅对打包版本生效；开发模式会跳过。
- 上下文文件夹监视：最多 10 个目录、4 层深、单文件 10 MB 以内。

## Roadmap

### ✅ 已发布

- 多任务并行执行，每个任务会话隔离
- 多 gateway 认证（token、密码、配对码）
- 定时（cron）任务 + 运行历史
- 跨 gateway 和会话的用量与成本仪表盘
- 跨任务、消息、artifacts 的全文搜索
- Teams 和 TeamsHub —— 构建、分享、安装多 Agent 编队
- Skills（基于 ClawHub）—— 发现与安装
- AI Builder —— LLM 辅助的 Team 创建
- PWA 离线支持和移动端 UI（[cpwa.pages.dev](https://cpwa.pages.dev)）
- 跨平台：macOS、Windows、Linux (AppImage + deb)，带自动更新

### 🔮 下一步

- 对话分支
- Artifact diff 视图
- 自定义主题
- 定期工作流的会话模板
- Skills、Teams、Adapters 的扩展 API 文档

### 🌐 愿景 —— Agent OS 的工作台层

ClawWork 目前针对 OpenClaw 优化。我们正在构建一个未来：工作台层与 runtime 无关 —— 所有 Agent 都在同一个界面里操作。

- **多 Runtime 适配器** —— 把其他 Runtime 的 Agent 纳入同一套 task / session / artifact 模型
- **更丰富的团队编排** —— 超越 coordinator / worker 的协调模式
- **企业友好的本地优先** —— 更强的数据边界和团队协作模式，同时不放弃本地数据所有权

列表里的条目成熟后会挪到 _下一步_。本节不承诺任何时间表。

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=clawwork-ai/ClawWork&type=date&legend=top-left)](https://www.star-history.com/?repos=clawwork-ai%2FClawWork&type=date&legend=top-left)

## 贡献

参与方式：

- 阅读 [DEVELOPMENT.md](DEVELOPMENT.md) 了解环境搭建和项目结构
- 查看 [Issues](https://github.com/clawwork-ai/clawwork/issues)
- 发起 [Pull Request](https://github.com/clawwork-ai/clawwork/pulls)
- 提交前运行 `pnpm check` —— 会检查 lint、架构、UI 契约、渲染层文案、i18n、死代码、格式、类型、测试。

翻译可能会滞后英文版本。如果你发现内容偏离，欢迎发 PR。

## License

[Apache 2.0](LICENSE)

<div align="center">

为 [OpenClaw](https://github.com/openclaw/openclaw) 而建。致敬 [Peter Steinberger](https://github.com/steipete) 的杰出工作。

</div>
