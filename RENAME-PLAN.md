# Rename Plan: ClawWork → OpenClaw Desktop

> Closes the naming strategy for [#95](https://github.com/clawwork-ai/ClawWork/issues/95).
> Product display name changes in this PR; repo/npm migration is phased below.

## Problem

GitHub search for "clawwork" returns 10+ similarly named repositories. The most visible collision is [HKUDS/ClawWork](https://github.com/HKUDS/ClawWork) ("OpenClaw as Your AI Coworker"), which causes SEO confusion, brand ambiguity, and potential package-registry conflicts.

## Chosen Name: **OpenClaw Desktop**

| Criterion                           | OpenClaw Desktop                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| Conveys desktop client for OpenClaw | Yes — matches positioning ("GitHub Desktop is to Git…")                       |
| Unique on GitHub/npm                | `openclaw-desktop` and `@openclaw/desktop` are unclaimed (checked 2026-06-16) |
| Short CLI / Homebrew                | `openclaw-desktop` or `ocd` alias                                             |
| Distinct from HKUDS/ClawWork        | Yes                                                                           |

**Former display name:** ClawWork (retained only in internal identifiers during migration).

## Availability (2026-06-16)

| Resource                              | Target                                                            | Status                    |
| ------------------------------------- | ----------------------------------------------------------------- | ------------------------- |
| npm `openclaw-desktop`                | CLI / meta package                                                | Available                 |
| npm `@openclaw/desktop`               | Scoped packages (future)                                          | Available                 |
| GitHub `clawwork-ai/openclaw-desktop` | Canonical repo slug                                               | Available                 |
| Homebrew cask `openclaw-desktop`      | `brew install --cask openclaw-desktop`                            | Available                 |
| Domain                                | TBD — recommend `openclawdesktop.dev` or pages under OpenClaw org | Not registered in this PR |

## Phase 1 — This PR (code, no infra)

- [x] User-facing strings → **OpenClaw Desktop** (README, i18n, website, tray, electron `productName`)
- [x] Central `PRODUCT_DISPLAY_NAME` in `@clawwork/shared`
- [x] Rename plan doc (this file)
- [ ] GitHub repo rename (`clawwork-ai/ClawWork` → `clawwork-ai/openclaw-desktop`) — maintainer action
- [ ] GitHub redirect from old URL — automatic after rename

## Phase 2 — Registry & release (follow-up)

- [ ] Homebrew tap: `brew tap clawwork-ai/openclaw-desktop && brew install --cask openclaw-desktop`
- [ ] Update `electron-builder.yml` `publish.repo` after GitHub rename
- [ ] npm scope migration `@clawwork/*` → `@openclaw/desktop-*` (optional; breaking for downstream)

## Phase 3 — Internal identifiers (breaking; defer)

Keep unchanged until a major version with migration tooling:

| Identifier               | Current                   | Notes                           |
| ------------------------ | ------------------------- | ------------------------------- |
| Session key segment      | `agent:…:clawwork:task:…` | OpenClaw Gateway protocol       |
| Config file              | `clawwork-config.json`    | Auto-migrate on first launch    |
| SQLite DB                | `.clawwork.db`            | Same                            |
| Default workspace folder | `ClawWork-Workspace`      | Same                            |
| Preload API              | `window.clawwork`         | Alias period, then deprecate    |
| macOS bundle ID          | `com.clawwork.app`        | Requires re-sign / notarization |
| Avatar protocol          | `clawwork-avatar://`      | Register parallel scheme first  |

## Copycat / collision note

References to **ClawWorkAi/ClawWork** (copycat) and **HKUDS/ClawWork** stay explicit in docs so users can tell projects apart.

## Verification

```bash
pnpm check
# Manual: launch app — window title, tray tooltip, welcome screen say "OpenClaw Desktop"
```
