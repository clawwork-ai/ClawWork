# V2EX — #share-creation

**Title:** ClawWork — OpenClaw 专用桌面客户端，别再在飞书里和 Agent 聊天了

---

## Post body

大家好，分享一个我最近一直在用的开源项目：**ClawWork**。

如果你在用 [OpenClaw](https://github.com/openclaw/openclaw) 跑本地 Agent，大概率是通过飞书、钉钉或 Slack 当对话通道。单个任务还行，但多任务并行、长时运行、工具调用、生成文件一多，聊天记录就变成一团浆糊——状态看不清、文件找不到、上下文串台。

ClawWork 的定位很简单：**OpenClaw 的专用 UI**，就像 GitHub Desktop 之于 Git。

### 和飞书/钉钉/Slack 通道对比

|          | 飞书 / 钉钉 / Slack | ClawWork                         |
| -------- | ------------------- | -------------------------------- |
| 布局     | 单聊线程            | 三栏：任务列表 + 对话 + 进度面板 |
| 多任务   | 一次一个对话        | 并行任务，独立 Session           |
| 工具调用 | 隐藏或纯文本        | 实时可视化，可展开详情           |
| 产物文件 | 淹没在聊天记录里    | 自动保存到本地 Git 仓库，可搜索  |
| 进度追踪 | 无结构化追踪        | 分步进度面板                     |
| 数据归属 | 第三方服务器        | 100% 本地（SQLite + Git）        |

### 核心能力

- 多任务并行，每个任务独立 OpenClaw Session
- 工具调用实时卡片 + 敏感操作审批
- 产物自动提取保存，SQLite FTS5 全文搜索
- 支持 macOS / Windows / Linux，也有 PWA 浏览器版

### 安装

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

或直接下载：https://github.com/clawwork-ai/ClawWork/releases

开源协议 Apache 2.0，欢迎 Star 和 Issue：https://github.com/clawwork-ai/ClawWork

**配图：** README 截图或 60 秒演示 GIF。
