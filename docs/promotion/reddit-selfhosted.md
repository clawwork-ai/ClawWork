# Reddit r/selfhosted

**Title:** I built an open-source desktop client for OpenClaw that auto-versions all AI outputs to a local Git repo

---

## Post body

I've been running [OpenClaw](https://github.com/openclaw/openclaw) on my homelab for agent workflows — code generation, file management, scheduled tasks. The default experience is chatting through messaging channels (Feishu, Slack, Telegram) or a basic web UI.

For self-hosters who care about data ownership, that has real problems:

- All conversation data lives on third-party IM servers (or gets lost in a single chat thread)
- AI-generated files scroll away and aren't versioned
- Running multiple agent tasks in parallel turns one chat into chaos

So I built **ClawWork** — a local-first desktop client (Electron + React + SQLite) that:

- Keeps **100% of data on your machine** (SQLite + local Git repo for artifacts)
- Runs **parallel tasks** with isolated OpenClaw sessions
- **Auto-saves** every code block, image, and file the agent produces
- Shows **tool calls in real time** with approval gates for risky exec operations
- Works with your existing OpenClaw Gateway (`ws://127.0.0.1:18789` by default)

Cross-platform: macOS (Homebrew cask), Windows, Linux (AppImage/deb). There's also a PWA if you want browser access.

- GitHub: https://github.com/clawwork-ai/ClawWork
- Releases: https://github.com/clawwork-ai/ClawWork/releases
- Apache 2.0

Would love feedback from other self-hosters — especially around Gateway pairing, artifact storage, and what you'd want in a local-first agent workspace.

**Attach:** demo GIF or screenshot gallery.
