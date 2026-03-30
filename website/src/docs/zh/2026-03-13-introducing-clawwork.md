---
title: 为什么我要给 OpenClaw 做一个桌面客户端
description: 聊天界面管不了并行任务，所以我做了 ClawWork
date: 2026-03-13
---

# 为什么我要给 OpenClaw 做一个桌面客户端

在 AI Agent 工具越来越强大的今天，很多开发者已经把 OpenClaw 部署在自己的电脑或服务器上，让它帮自己处理复杂任务、调用工具、操作文件。然而，当你同时运行多个任务时，传统聊天界面（Telegram、Slack 或普通 Web UI）很快就变得混乱：上下文混在一起、工具执行过程看不清、生成的文件转眼就淹没在历史消息里。

我每天都在用 OpenClaw。写代码、发邮件、整理文档、跑数据分析——它确实能干很多事。但用的越多，越受不了聊天界面。

当你同时跑 5 个任务，全挤在一个对话框里，根本分不清谁是谁。工具调用埋在消息流里，看不到执行过程。AI 生成的文件刷两下就找不到了。

**ClawWork** 正是为解决这些痛点而生的开源桌面客户端。它让每个 AI 任务都拥有独立的「工作空间」，把散乱的 Agent 流程变成清晰、可控、高效的桌面生产力工具。

## 为什么需要 ClawWork

OpenClaw 本身非常强大，能真正「做事」——发邮件、管理日历、操作文件、调用外部工具。但当任务变多、变复杂时，聊天界面就力不从心了：

- 多个任务混在一个对话里，上下文容易丢失；
- 工具调用埋在消息流中，进度不透明；
- 生成的文件稍纵即逝，事后很难快速找到；
- 切换模型、Agent 或思考深度时操作繁琐。

## 做了什么

**并行任务**。每个任务跑在自己的 OpenClaw Session 里，互相隔离。开 10 个同时跑，随时切换、暂停、重置。三栏布局一目了然：任务列表、对话区、上下文面板。

**工具调用透明**。每次工具调用都是内联卡片，实时显示状态。高风险操作（exec、文件删除等）弹审批对话框，你确认了才执行。不是黑盒。

**本地持久化**。所有产物——代码、图片、文档——自动按任务保存在本地。SQLite FTS5 全文索引，跨任务搜索。文件不会丢。

**定时任务**。用 cron、every 或 at 表达式让任务定时执行。比如每天早上跑一次日报汇总。查看执行历史，随时手动触发。

**Agent 与工具管理**。直接在界面里创建、编辑 Agent，浏览每个 Gateway 的完整工具目录。不用去改配置文件。

**多 Gateway 与模型**。连多个 OpenClaw Gateway，每个任务独立选模型和思考级别。一个任务用 Claude 写代码，另一个用 GPT 做翻译，互不干扰。

**PWA 移动端**。不在电脑旁也能用。打开浏览器扫码配对你的 Gateway，手机上就能管理任务。装到主屏幕，支持离线。

**全平台**。macOS（Apple Silicon + Intel）、Windows、Linux 都有安装包。

## 怎么开始

1. 启动 OpenClaw Gateway：`openclaw gateway start`
2. 安装 ClawWork：
   - macOS：`brew tap clawwork-ai/clawwork && brew install --cask clawwork`
   - 或去 GitHub Releases 下载
3. 设置里添加 Gateway 地址（默认 `ws://127.0.0.1:18789`）
4. 新建 Task，选 Agent 和模型，开始用

几分钟的事。所有数据在你本地，没有云端依赖。

## 现状

ClawWork 是完全开源的（Apache 2.0 协议），代码采用 Electron + React + TypeScript + SQLite 构建，结构清晰，欢迎社区贡献。

## 总结

如果你正在本地运行 OpenClaw，并希望把 AI Agent 从「偶尔聊天助手」升级为「真正能并行工作的 AI 同事」，ClawWork 是目前最值得尝试的桌面客户端。它不只是一个聊天工具的替代品，而是把 OpenClaw 的潜力彻底释放出来的生产力放大器。

**GitHub**：https://github.com/clawwork-ai/ClawWork

感兴趣的开发者可以直接用 Homebrew 一键安装试用，欢迎在 GitHub 上 star、提 issue 或提交 PR，一起把 ClawWork 打造成 OpenClaw 生态里最趁手的桌面利器！
