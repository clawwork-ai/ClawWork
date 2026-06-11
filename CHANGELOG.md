# Changelog

All notable changes to ClawWork are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - TBD

First public launch release. Prior `0.0.x` builds were pre-release iterations.

### Added

- Three-column desktop workspace: task list, conversation, progress/artifacts panel
- Parallel multi-task execution with per-task OpenClaw session isolation
- Real-time tool call cards with expandable details and exec approval gates
- Local artifact management — auto-extract code, images, and files to a Git-backed workspace
- Full-text search across tasks, messages, and artifacts (SQLite FTS5)
- Multi-gateway support with token, password, and pairing-code authentication
- Per-task agent and model switching with thinking-level controls
- Scheduled (cron) tasks with run history and manual trigger
- Usage and cost dashboard across gateways and sessions
- Teams and TeamsHub — multi-agent orchestration with coordinator/worker roles
- Skills via ClawHub — discovery and install
- AI Builder — LLM-assisted team creation
- Progressive Web App with offline support and mobile UI
- Cross-platform installers: macOS (DMG + Homebrew cask), Windows, Linux (AppImage + deb)
- Background auto-update for packaged builds
- System tray, global quick-launch shortcut, and desktop notifications
- Light/dark themes with 8-language i18n support
- Launch promotion materials in `docs/promotion/`
- Agent guide (`AGENTS.md`) and contributing sign-off requirements (`CONTRIBUTING.md`)

### Changed

- README rewritten with OpenClaw positioning, channel comparison table, and architecture overview
- Root `package.json` metadata: repository, homepage, and license fields

[0.1.0]: https://github.com/clawwork-ai/ClawWork/releases/tag/v0.1.0
