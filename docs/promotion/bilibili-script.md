# Bilibili Demo Video Script

**Target:** 3–5 minute Chinese demo. Tracked in [#11](https://github.com/clawwork-ai/ClawWork/issues/11).

**Title options:**

- OpenClaw 专用桌面客户端：告别飞书聊 Agent
- 开源 OpenClaw Desktop — 三栏工作区 + 本地 Git 产物管理

**Tags:** OpenClaw, AI Agent, Electron, 开源, 本地优先, 开发者工具

---

## Outline (≈4 minutes)

### 0:00–0:20 开场

- 痛点：用飞书/钉钉和 OpenClaw Agent 聊天，多任务时上下文混乱、工具调用看不见、产物丢在历史里
- 一句话定位：OpenClaw Desktop = OpenClaw 的专用桌面工作区

### 0:20–0:50 界面总览

- 展示三栏布局：左侧任务列表、中间对话、右侧进度/产物
- 强调：每个任务独立 Session，可并行切换

### 0:50–1:40 创建任务 + 对话

- 新建任务，选择 Agent 和模型
- 发送一条真实指令（建议：「写一个 Python CLI 工具」）
- 展示流式回复和工具调用卡片展开

### 1:40–2:30 产物与 Git

- 右侧文件浏览器展示自动保存的代码/文件
- 说明本地 Git 版本化 + SQLite 全文搜索
- 快速演示搜索历史任务/消息

### 2:30–3:20 进阶功能（选 2–3 个）

- 多 Gateway 切换
- 定时任务（cron）面板
- Teams 多 Agent 编排（如有录制素材）

### 3:20–3:50 安装方式

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

- 或 GitHub Releases 下载 Windows/Linux 安装包
- PWA：https://cpwa.pages.dev

### 3:50–4:10 结尾

- 开源 Apache 2.0
- GitHub 链接 + 求 Star/反馈
- Discord 社区

---

## Production notes

- 深色主题录制，窗口裁切干净
- 字幕：中文为主，关键术语保留英文（OpenClaw, Gateway, Session）
- BGM 轻快但不抢人声；音量 -18 LUFS 左右
- 封面：三栏布局 + 大标题「OpenClaw 专用桌面客户端」
- 简介区放 GitHub、官网、Discord 链接
