# Zhihu Column Article Outline

**Title:** 为什么 OpenClaw 需要一个专用桌面客户端？

**Target:** Week 2–4, product/thought leadership audience

---

## Outline

### 1. 引子：Agent 时代的工作界面问题

- 能力爆炸，界面停滞
- 类比：IDE 之于代码，终端之于 Unix，Workspace 之于 Agent OS

### 2. OpenClaw 改变了什么

- 自托管 Agent 运行时
- 邮件、日历、文件、工具调用——真正的数字同事
- 但默认交互仍是「聊天」

### 3. 聊天通道的结构性缺陷

用对比表展开（飞书/钉钉/Slack vs ClawWork）：

- 单线程 vs 三栏工作区
- 单任务 vs 并行隔离
- 工具调用不可见 vs 实时可视化
- 产物丢失 vs Git 版本化
- 数据在第三方 vs 100% 本地

### 4. ClawWork 的产品哲学

- Task-first，不是 Chat-first
- 每个任务 = 持久工作区（Session + 产物 + 控制 + 历史）
- Local-first：SQLite + Git，无云依赖

### 5. 实际使用场景

- 并行跑 5 个开发任务
- 定时报告生成（cron）
- 多 Gateway、多模型切换
- Teams 多 Agent 编排

### 6. 对 Agent OS 的展望

- 从 OpenClaw 专用到多 Runtime 控制面
- Workspace 层的长远价值

### 7. 结语

- 开源地址与安装方式
- 邀请读者试用并反馈

**Estimated length:** 2000–3000 字
