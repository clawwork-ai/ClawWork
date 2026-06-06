# Reddit r/opensource

**Title:** [Project] ClawWork — open-source desktop client for OpenClaw with local Git artifact versioning

---

## Post body

**ClawWork** is an open-source desktop client for [OpenClaw](https://github.com/openclaw/openclaw), the self-hosted AI agent runtime.

### The problem

OpenClaw is powerful, but most users interact through generic chat channels (Feishu, Slack, Telegram). Chat is a poor container for agent work: no parallel tasks, no structured progress, no durable artifact management.

### What ClawWork does

- **Three-panel workspace** — tasks, conversation, progress/artifacts
- **Parallel multi-task** — each task maps to an isolated OpenClaw session
- **Tool call transparency** — inline cards, expandable details, exec approval prompts
- **Git-native artifacts** — auto-extract and version AI outputs locally
- **Full-text search** — SQLite FTS5 across tasks, messages, and files

### Tech stack

Electron 34 · React 19 · TypeScript · Tailwind v4 · Zustand · SQLite (Drizzle ORM)

### Get it

- Repo: https://github.com/clawwork-ai/ClawWork
- License: Apache 2.0
- macOS: `brew tap clawwork-ai/clawwork && brew install --cask clawwork`
- All installers: https://github.com/clawwork-ai/ClawWork/releases

Contributions welcome — issues tagged `good first issue` for newcomers.

**Attach:** screenshot or demo GIF.
