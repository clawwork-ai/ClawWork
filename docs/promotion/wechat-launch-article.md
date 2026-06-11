# WeChat Official Account — Launch Article

**Title:** 别再用飞书和 Agent 聊天了：ClawWork 是 OpenClaw 的专用桌面客户端

**Target:** Launch day or Week 1

---

## Article body

### 开篇

如果你已经在本地或服务器上部署了 OpenClaw，大概率是通过飞书、钉钉或 Slack 跟 Agent 对话。

单个问题还行。但当任务变多、变长、变复杂——多个 Agent 并行、工具调用频繁、生成大量文件——聊天记录就变成一团浆糊。

**今天推荐一个开源项目：ClawWork。**

### 一句话定位

**OpenClaw 的专用 UI —— 就像 GitHub Desktop 之于 Git。**

### 和飞书通道比，强在哪？

|          | 飞书 / 钉钉 / Slack | ClawWork                 |
| -------- | ------------------- | ------------------------ |
| 布局     | 单聊线程            | 三栏：任务 + 对话 + 进度 |
| 多任务   | 一次一个            | 并行隔离                 |
| 工具调用 | 看不见              | 实时卡片                 |
| 产物文件 | 淹没在聊天里        | 本地 Git 自动保存        |
| 数据     | 第三方服务器        | 100% 本地                |

### 核心功能

1. **多任务并行** — 每个任务独立 Session，互不干扰
2. **工具调用可视化** — 实时状态，敏感操作需审批
3. **产物自动管理** — 代码、图片、文件自动提取保存
4. **全文搜索** — 跨任务、跨消息、跨文件
5. **定时任务** — cron 表达式，自动执行
6. **全平台** — macOS / Windows / Linux + PWA 浏览器版

### 怎么安装

macOS 用户：

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

其他平台下载安装包：
https://github.com/clawwork-ai/ClawWork/releases

连接本地 Gateway（默认 `ws://127.0.0.1:18789`），创建任务即可开始。

### 技术栈

Electron 34 + React 19 + TypeScript + SQLite，Apache 2.0 开源。

GitHub：https://github.com/clawwork-ai/ClawWork

欢迎 Star、提 Issue、加入社区一起打磨 OpenClaw 生态最好的桌面工具。

### 结尾 CTA

- 扫码关注 / 加入用户群（维护者填写）
- 回复「ClawWork」获取快速入门指南（维护者填写）
