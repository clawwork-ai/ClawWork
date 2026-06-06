# OpenClaw Docs PR Content

Submit to the OpenClaw documentation repository under **Desktop Clients** / **Community Tools** / **Getting Started**.

---

## Suggested page title

ClawWork — Desktop Client

## Summary paragraph

[ClawWork](https://github.com/clawwork-ai/ClawWork) is an open-source, local-first desktop client for OpenClaw. It provides a three-panel workspace for parallel agent tasks, real-time tool call visualization, and Git-native artifact management. Available for macOS, Windows, and Linux, with a browser PWA option.

## Installation

### macOS (Homebrew)

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

### All platforms

Download the latest installer from [GitHub Releases](https://github.com/clawwork-ai/ClawWork/releases/latest).

### PWA (browser)

Open [cpwa.pages.dev](https://cpwa.pages.dev) in any modern browser.

## Quick start

1. Start your OpenClaw Gateway (default: `ws://127.0.0.1:18789`).
2. Open ClawWork → Settings → add your Gateway (token, password, or pairing code).
3. Create a task, select an agent and model, and start working.

## Key features

- Parallel tasks with isolated OpenClaw sessions
- Three-column UI: task list, conversation, progress/artifacts
- Real-time tool call cards with exec approval gates
- Auto-saved artifacts with local Git versioning and full-text search
- Multi-gateway support with per-task model switching
- Scheduled (cron) tasks with run history

## Screenshots

Include these assets in the PR:

1. `docs/screenshot.png` — three-column desktop layout
2. PWA screenshot from README (GitHub user-attachments URL)
3. 60-second demo GIF (once recorded — see [demo-recording.md](./demo-recording.md))

## Links

- Repository: https://github.com/clawwork-ai/ClawWork
- Website: https://clawwork-ai.github.io/ClawWork/
- License: Apache 2.0
- Discord: https://discord.gg/n9fCgBMgm

## Awesome-list entry

For `awesome-openclaw` or similar curated lists:

```markdown
- [ClawWork](https://github.com/clawwork-ai/ClawWork) — Local-first desktop client with parallel tasks, tool call visualization, and Git-native artifact management. (macOS/Windows/Linux/PWA)
```
