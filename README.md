<div align="center">

<img src="./docs/screenshot.png" alt="ClawWork" width="800" />

# ClawWork

**A desktop workspace for [OpenClaw](https://github.com/openclaw/openclaw).**

Parallel tasks, structured artifacts, scheduled automation — and files you can actually find later.

[![GitHub release](https://img.shields.io/github/v/release/clawwork-ai/clawwork?style=flat-square)](https://github.com/clawwork-ai/clawwork/releases/latest)
[![License](https://img.shields.io/github/license/clawwork-ai/clawwork?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/clawwork-ai/clawwork?style=flat-square)](https://github.com/clawwork-ai/clawwork)

[Download](#download) · [Quick start](#quick-start) · [What you get](#what-you-get) · [What it stores](#what-clawwork-stores) · [How it works](#how-it-works) · [Repo layout](#repo-layout) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

## Why ClawWork

OpenClaw is powerful. Plain chat is a bad container for the kind of work it can do.

Once you have multiple sessions, long-running jobs, approval stops, generated files, recurring automation, and different gateways, chat history turns into mud. Status vanishes. Files vanish. Context vanishes.

ClawWork fixes that. Every task becomes a durable workspace with its own session, artifacts, controls, and history — laid out in a three-panel UI: tasks on the left, active work in the center, artifacts and context on the right.

## Why it feels better

- Each task runs in its own OpenClaw session, so you can switch between parallel jobs without mixing context.
- Streaming replies, thinking traces, tool call cards, and artifacts live in one place instead of being buried in chat history.
- Gateway, agent, model, and thinking settings are scoped per task.
- Files produced by the agent are saved to a local workspace and stay easy to browse later.
- Risky exec actions can stop for approval before they run.
- Scheduled tasks run on their own cadence without you watching.

## Download

### Homebrew (macOS)

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

### Releases

Prebuilt macOS and Windows builds are available on the [Releases page](https://github.com/clawwork-ai/clawwork/releases/latest). The app updates itself — new versions download in the background and install when you quit.

## Quick start

1. Start an OpenClaw Gateway.
2. Open ClawWork and add a gateway in Settings. Authenticate with a token, password, or pairing code. Default local endpoint: `ws://127.0.0.1:18789`.
3. Create a task, pick a gateway and agent, and describe the work.
4. Chat: send messages, attach images, `@` files for context, or use `/` commands.
5. Follow the task as it runs, inspect tool activity, and keep the output files.
6. Use search, artifacts, and cron when the work stops being small.

## What you get

### ⚡ Task-first workflow

- Parallel tasks with isolated OpenClaw sessions — archived tasks can be reopened later
- Per-gateway session catalogs
- Session controls that matter: stop, reset, compact, delete, and sync
- Background work that stays readable instead of collapsing into one long thread
- Set tasks on a schedule with `cron`, `every`, or `at` expressions — pick from presets or write your own, check run history, trigger manually anytime
- Export any session as Markdown to keep a clean record outside the app

### 👁 Better visibility

- Streaming responses in real time
- Inline tool call cards while the agent works
- Progress and artifacts in a side panel
- See what you're spending — usage status per gateway, cost breakdown per session, 30-day rolling dashboard

### 🎛 Better control

- Multi-gateway support
- Per-task agent and model switching
- Manage your agents directly — create, edit, delete, and browse their workspace files without leaving the app
- Browse the full tools catalog for each gateway so you know what the agent can reach
- Thinking level controls and slash commands
- Approval prompts for sensitive exec actions
- Get notified when things happen in the background — task completions, approval requests, gateway disconnects — click a notification and it jumps back to the task. Per-event toggles so you control the noise.

### 📂 Better file handling

- Context that is actually useful: images, `@` file references, voice input, watched folders
- Point the app at up to 10 folders and it watches for changes, re-indexing automatically so your context stays fresh
- Local artifact storage
- Code blocks and remote images in assistant replies are auto-extracted and saved to your workspace — no manual copy-paste
- Full-text search across tasks, messages, and artifacts

### 🖥 Better desktop ergonomics

- System tray support
- Quick-launch window with a global shortcut (`Alt+Space` by default, customizable)
- Keyboard shortcuts throughout the app
- The app updates itself in the background — you see progress in Settings and it installs on quit
- Zoom in or out to your comfort level, and the app remembers your preference
- Light and dark themes, plus English and Chinese UI

### 🔧 Debugging

- Export a debug bundle (logs, gateway status, sanitized config) when something goes wrong — useful for bug reports
- See which Gateway server version you're connected to right in Settings

## What ClawWork stores

Everything lives in a local workspace directory you choose. No cloud sync, no external database.

- **Tasks** — each one maps to an independent OpenClaw session, so parallel work never collides.
- **Messages** — user, assistant, and system messages, including tool calls and image attachments, all persisted locally.
- **Artifacts** — code blocks, images, and files the agent produces. Automatically extracted from assistant output so nothing gets lost.
- **Full-text search** — search across all of the above. Find that one code snippet from three weeks ago without remembering which task it came from.

## How it works

ClawWork talks to OpenClaw through a single Gateway WebSocket connection. Each task gets its own session key, which keeps concurrent work isolated. Everything — tasks, messages, artifacts, search indexes — is stored locally in your workspace directory.

<div align="center">
<img src="./docs/architecture.svg" alt="ClawWork Architecture" width="840" />
</div>

## Repo layout

```
packages/shared/       — protocol types, constants (zero deps)
packages/desktop/
  src/main/            — Electron main: gateway WS, IPC, DB, artifacts, OS integration
  src/preload/         — typed window.clawwork bridge
  src/renderer/        — React UI: components, layouts, stores, hooks, i18n
website/               — project website (React + Vite)
keynote/               — presentation slides (Slidev)
```

## Tech stack

Electron 34, React 19, TypeScript, Tailwind CSS v4, Zustand, SQLite (Drizzle ORM + better-sqlite3), Framer Motion.

## Platform notes

- Voice input requires a local [whisper.cpp](https://github.com/ggerganov/whisper.cpp) binary and model.
- Auto-updater works on packaged builds only; dev mode skips updates.
- Context folder watcher: max 10 directories, 4 levels deep, files up to 10 MB.

## Roadmap

✅ Already shipping:

- Multi-task parallel execution
- Multi-gateway with token, password, and pairing code auth
- Tool call cards and approval dialogs
- Slash commands and thinking controls
- File context, artifact browsing, and auto-extract
- Agent management and tools catalog
- Scheduled (cron) tasks
- Usage and cost dashboard
- Native desktop notifications
- Folder watcher with auto-reindex
- Session export and debug bundle export
- Auto-update
- Tray, quick launch, and voice input
- Gateway server version display

🔮 Next up:

- Linux packages
- Conversation branching
- Artifact diff view
- Custom themes

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=clawwork-ai/ClawWork&type=date&legend=top-left)](https://www.star-history.com/?repos=clawwork-ai%2FClawWork&type=date&legend=top-left)

## Contributing

The project is early and moving fast. If you want to help:

- Read [DEVELOPMENT.md](DEVELOPMENT.md) for setup and project structure
- Check [Issues](https://github.com/clawwork-ai/clawwork/issues)
- Open a [Pull Request](https://github.com/clawwork-ai/clawwork/pulls)
- Run `pnpm check` before submitting — it gates lint, architecture checks, formatting, typecheck, and tests.

## License

[Apache 2.0](LICENSE)

<div align="center">

Built for [OpenClaw](https://github.com/openclaw/openclaw). Inspired by the great work of [Peter Steinberger](https://github.com/steipete).

</div>
