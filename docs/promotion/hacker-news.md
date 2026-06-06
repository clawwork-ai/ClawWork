# Hacker News — Show HN

**Title:** Show HN: ClawWork – Open-source desktop client for OpenClaw (replaces Feishu/Slack channels)

**Best time:** Tuesday–Thursday, 8–10 AM Pacific. Stay online for 2–3 hours after posting.

---

## Post body

Hi HN — I built ClawWork, an open-source desktop client for [OpenClaw](https://github.com/openclaw/openclaw).

If you run OpenClaw agents locally, you probably talk to them through Feishu, Slack, or a web chat UI. That works for one-off questions, but breaks down fast: multiple tasks bleed together, tool calls disappear in the message stream, and generated files vanish into chat history.

ClawWork is a purpose-built workspace instead of a chat workaround:

- **Three-column layout** — task list, conversation, progress/artifacts panel
- **Parallel tasks** — each task gets its own isolated OpenClaw session
- **Tool call visibility** — real-time cards with expandable details; risky exec actions require approval
- **Local-first artifacts** — code, images, and files auto-saved to a local Git repo with full-text search
- **100% local data** — SQLite + Git on your machine, no cloud sync

Stack: Electron 34, React 19, TypeScript, SQLite (Drizzle + FTS5).

Install:

- macOS: `brew tap clawwork-ai/clawwork && brew install --cask clawwork`
- All platforms: https://github.com/clawwork-ai/ClawWork/releases
- Browser PWA: https://cpwa.pages.dev

Apache 2.0, fully open source: https://github.com/clawwork-ai/ClawWork

Happy to answer questions about the Gateway protocol, session isolation, or why chat UIs are a bad container for agent work.

**Attach:** 60-second demo GIF from README.
