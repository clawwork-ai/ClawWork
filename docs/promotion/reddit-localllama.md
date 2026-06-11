# Reddit r/LocalLLaMA

**Title:** ClawWork — a dedicated desktop UI for self-hosted OpenClaw agents (parallel tasks, local artifacts)

---

## Post body

If you run [OpenClaw](https://github.com/openclaw/openclaw) locally with your own models and gateways, you might be using Feishu/Slack/Telegram as the chat front-end. It works, but it's not built for agent workflows.

**ClawWork** is an open-source desktop client designed specifically for OpenClaw:

- Run **multiple agent tasks in parallel**, each with its own session and context
- **Switch models and thinking levels per task** across multiple gateways
- See **tool calls live** — no more black-box agent execution
- **Artifacts stay local** — code, images, and files auto-saved with Git versioning and FTS search
- **Approval gates** for sensitive shell commands

It's local-first (SQLite + Git on disk), cross-platform (macOS/Windows/Linux), and Apache 2.0.

- https://github.com/clawwork-ai/ClawWork
- PWA (no install): https://cpwa.pages.dev

Built for people who self-host agents and want a real workspace, not another chat window.

**Attach:** demo GIF showing parallel tasks + tool call cards.
