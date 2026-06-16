# YouTube Demo Video Script

**Target:** 3–5 minute English demo. Tracked in [#11](https://github.com/clawwork-ai/ClawWork/issues/11).

**Title options:**

- OpenClaw Desktop — The dedicated workspace for self-hosted AI agents
- Stop chatting with agents in Slack — OpenClaw Desktop walkthrough

**Tags:** OpenClaw, AI agents, Electron, open source, local-first, developer tools, self-hosted AI

---

## Outline (≈4 minutes)

### 0:00–0:25 Hook

- Problem: OpenClaw is powerful, but chat channels (Feishu, Slack, DingTalk) collapse under multi-task agent work
- Solution: OpenClaw Desktop — purpose-built three-column workspace

### 0:25–0:55 UI tour

- Left: task list with parallel sessions
- Center: active conversation
- Right: progress panel + artifact browser
- Each task = isolated OpenClaw session (`agent:main:clawwork:task:<id>`)

### 0:55–1:45 Create a task

- Connect to local Gateway (`ws://127.0.0.1:18789`)
- New task → pick agent + model
- Send prompt: "Build a small Python CLI tool"
- Show streaming reply + expandable tool call card

### 1:45–2:35 Artifacts and search

- Artifact auto-saved to local Git workspace
- File browser preview
- Full-text search across tasks, messages, artifacts (SQLite FTS5)

### 2:35–3:25 Power features (pick 2–3)

- Exec approval gate on risky tool calls
- Multi-gateway support
- Cron/scheduled tasks
- Teams multi-agent orchestration (if footage available)

### 3:25–3:55 Install

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

- GitHub Releases for Windows/Linux
- Browser PWA: https://cpwa.pages.dev

### 3:55–4:15 Outro

- Apache 2.0, fully open source
- GitHub + Discord links
- Call to action: star, try it, open issues

---

## Production notes

- Record dark theme, cropped to app window
- Voiceover or live narration — keep pace brisk
- Chapters in description matching outline timestamps
- Thumbnail: three-column layout + bold text "OpenClaw Desktop"
- Description links: GitHub, website, PWA, Discord
- End screen: subscribe + GitHub link card
