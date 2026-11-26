# Changelog

All notable changes to ClawWork are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Stable releases (`X.Y.Z`) are recorded here before tagging. Prereleases (`X.Y.Z-alpha.N`, `X.Y.Z-beta.N`, `X.Y.Z-rc.N`) are published on GitHub Releases and consolidated into their target `X.Y.Z` entry.

## [Unreleased]

## [0.0.18] - 2026-11-25

### Changed

- Package macOS desktop releases with ad-hoc signing without Apple Developer signing or notarization

## [0.0.17] - 2026-11-25

### Added

- French (`fr`) translation support (#555)
- Session preview snippets in the LeftNav task list (#521)
- Gateway secret reveal control in Settings (#504)
- Launch promotion materials in `docs/promotion/`, scheduled workflow recipes, and design token documentation (#531, #533)
- Unified workspace SemVer parity gate, aligned release-history generation, canonical `clawwork-ai/ClawWork` slugs, and non-destructive Homebrew cask updates (#569)

### Changed

- Consolidated `AGENTS.md` as the canonical agent guide, and updated `CONTRIBUTING.md` and README translations (#497, #566)
- Extracted app bootstrap hooks (#558)
- Updated root `package.json` repository, homepage, and license metadata
- Hardened `ci-bot.yml` against workflow injection (#520)

### Fixed

- Restored inbox attachment reads on macOS after an app restart
- Restored window dragging on title bars, and re-hydrated renderer stores after workspace changes (#491, #528)
- Hardened `safeFetch` DNS pinning, redirect handling, and incremental `maxSize` cancellation (#523, #524)
- Hardened conductor prompt injection in `initConductor`, `listSessionsBySpawner` validation, and Windows `readContextFile` path handling (#516, #519, #530)
- Fixed FTS query minimum length guard, `chat-composer` `sessionKey` attachment, and `AgentsSection` spinner error reset (#561, #562)
- Added debug log size rotation and pre-init buffer flushing

## [0.0.16] - 2026-05-16

### Changed

- Published GitHub Release before triggering Homebrew tap updates (#493)
- Updated keynote speaker notes (#495)
- Bumped `@clawwork/desktop` version to `0.0.16` (`0861d49`)

### Fixed

- Widened Gateway protocol compatibility range (`ea65c56`)
- Anchored stable release notes to the previous stable tag (#496)

## [0.0.15] - 2026-05-10

### Added

- Usage and cost dashboard with breakdowns and a 30-day token chart (#393)
- Non-image file attachments (PDF, Office documents, ZIP, text) with persisted assistant media and message survival across restarts (#424, #471)
- Live Gateway slash commands sourced from the connected Gateway with source badges (#429)
- Opt-in Beta update channel and in-progress update download cancellation in Settings (#441, #444)
- Resizable team file trees, persisted team skill bindings, and a shared Gateway selector (#459, #464, #468)
- Artifact thumbnails, overlay preview drawer, and type-filtered File Manager search (#472, #473)
- Engineering deck and refreshed product tour (#418)

### Changed

- Refreshed default light and dark themes, consolidated theme choices to `auto`, `light`, and `dark`, and grouped left-nav tasks by date (#457)
- Added `zh`, `zh-TW`, `ja`, and `ko` README translations (#447)

### Fixed

- Hardened `settings:update` field filtering, `GatewaysSection` IPC error handling, and `FileBrowser` stale search guards (#368, #449, #452)
- Enforced HTTP/HTTPS allowlists in `shell.openExternal` and rate-limited `debug:renderer-event` payloads (#369, #414)
- Fixed pasted multiline messages and session running indicators (#466, #467)

## [0.0.14] - 2026-04-09

### Added

- Full Teams lifecycle with creation wizard, `TEAM.md` parser, virtual file tree editor, AI Builder dialog, and TeamsHub marketplace (#258, #288, #299)
- Multi-agent orchestration rooms with conductor/performer model, `@All` mentions, and `sessions.changed` event routing (#210, #260, #319)
- Encrypted Gateway credentials via Electron `safeStorage`, single-instance lock, and developer mode `deviceId` isolation (#297, #322, #323)
- WelcomeScreen tab selection, Skills management with ClawHub discovery, and agent avatar uploads (#245, #302, #304)
- System Sessions decoupled from Task/Chat and PWA offline caching with GitHub Pages deployment (#205, #255)

### Fixed

- Fixed tool-call timeout exclusion, horizontal message bubble overflow, and `ResizeObserver` auto-scroll (#316, #317, #324)
- Fixed QR code regeneration, eager team chat creation, and WebSocket send after close errors (#292, #295, #301)

## [0.0.13] - 2026-03-27

### Added

- PWA mobile companion with native chat UI, swipe gestures, and QR pairing (#183)
- Linux desktop builds (AppImage and deb for x64) integrated into the release pipeline (#174)
- Glass surface tokens, glow effects, and reduced-motion support (#200, #201)

### Changed

- Extracted `@clawwork/core` with port-based dependency injection and refactored `ChatInput` (#178, #180)
- Added `knip` dead-code detection and `vitest` coverage (#176)

### Fixed

- Removed unused renderer preload backdoor, hardened SSRF guard with numeric IP checks, fixed context-file TOCTOU race, and fixed artifact `fileURLToPath` path traversal (#184, #185, #189, #194)
- Fixed macOS dock re-open crash, streaming forced reflow, and hardcoded PWA client version (#191, #195, #196)

## [0.0.12] - 2026-03-26

### Added

- Multi-language support across 8 locales with CI key parity check (#166)
- Local workspace file tab in `@` mention picker and 7-tap developer mode trigger (#164, #172)

### Changed

- Split macOS builds into dedicated `arm64` and `x64` DMGs (#168)
- Introduced semantic `type-*` typography utilities and UI contract tokens (#165, #170)

### Fixed

- Added explicit menu item accelerators on macOS and `--clobber` asset upload handling (#169, #171)

## [0.0.11] - 2026-03-24

### Added

- Cron task management panel with schedule presets, run history, and scheduler status (#161)
- Native OS notifications, live context folder `fs.watch` updates, and Gateway server version badge (#156, #157, #159)

### Fixed

- Scoped titlebar drag regions per panel header and corrected cron filter and session identity handling (#161)

## [0.0.10] - 2026-03-23

### Added

- In-app auto-updater, Settings agent management, cross-task `@` mention picker, Markdown session export, and task renaming (#140, #150, #152, #154, #155)

### Changed

- Removed Git dependency from local artifact persistence (#147)

### Fixed

- Stabilized updater quit-before-install flow and exec approval state (#141, #145)

## [0.0.9] - 2026-03-22

### Added

- Device-scoped sessions with task title synchronization across reconnects (#119)

### Fixed

- Fixed path traversal, symlink traversal, remote image SSRF, WebSocket frame validation, artifact TOCTOU race, and debug bundle secret redaction (#111, #112, #114, #115, #117, #120, #123, #125)
- Trusted Windows system root certificates for Gateway connections and eliminated startup/post-final message duplication (#126, #128, #136)

## [0.0.8] - 2026-03-18

### Added

- Responsive draggable panels, FTS5 artifact search, base64 pairing code auth, workspace migration, and standalone marketing website (#88, #93, #96, #106, #108)

### Fixed

- Persisted image attachments across restarts and fixed titlebar click interception on connection banners (#87, #107)

## [0.0.7] - 2026-03-17

### Added

- `@` file context attachment, tools catalog, usage/cost dashboard, session compact/reset/delete, Settings sidebar, and Auto theme (#67, #68, #69, #70, #81)
- Code-signed and notarized macOS release pipeline (#82, #84)

### Fixed

- Created workspace directory before opening SQLite database on Windows and ignored unknown session keys (#73, #74)

## [0.0.6] - 2026-03-16

### Added

- System tray, quick-launch window, per-gateway session catalogs, command approval dialog, Stop button, ToolCallCards, and `⌘/Ctrl+K` command palette (#51, #53, #55, #56, #60, #64)

### Fixed

- Enabled Electron sandbox, added root ErrorBoundary, and stopped infinite Gateway reconnect on auth failure (#44, #45, #47)

## [0.0.5] - 2026-03-16

### Fixed

- Persisted macOS microphone permission via ad-hoc entitlement signing (#42)

## [0.0.4] - 2026-03-15

### Added

- Local `whisper.cpp` voice input, keyboard shortcuts, slash command autocomplete, left-nav gateway selector, and structured debug bundle export (#34, #36, #38, #40, #41)

### Fixed

- Fixed ToolCallCard placement and archived tasks selector infinite re-render loop (#35, #37)

## [0.0.3] - 2026-03-14

### Added

- Per-conversation model and agent switching, multi-gateway support, in-app update check, and Homebrew Cask distribution (#26, #29, #31, #32)

### Changed

- Completed Gateway-only architecture migration and added `ci-bot` workflow and PR/issue templates (#27, #28, #33)

## [0.0.2] - 2026-03-13

### Added

- Direct image messaging, archived chats view, official app icon, and GitHub Actions release workflows (#10, #18, #20)

### Fixed

- Fixed chat auto-scroll during streaming and ToolCallCard rendering (#4, #22)

## [0.0.1] - 2026-03-13

### Added

- Initial pre-release with three-column desktop workspace, parallel task isolation, streaming responses, local Git artifact versioning, SQLite FTS5 search, light/dark themes, and challenge-response Gateway auth

[Unreleased]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.18...HEAD
[0.0.18]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.17...v0.0.18
[0.0.17]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.16...v0.0.17
[0.0.16]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.15...v0.0.16
[0.0.15]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.14...v0.0.15
[0.0.14]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.13...v0.0.14
[0.0.13]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.12...v0.0.13
[0.0.12]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.11...v0.0.12
[0.0.11]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.10...v0.0.11
[0.0.10]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/clawwork-ai/ClawWork/releases/tag/v0.0.1
