# ClawWork Code Review Style Guide

## Instructions for Gemini Code Assist

Before reviewing any code, **read the following files** to understand
the architectural context. Your review should be grounded in these rules.

- `.claude/rules/architecture.md` — product identity, layer ownership, invariants
- `.claude/rules/frontend.md` — TypeScript, React, styling, state management
- `.claude/rules/main-process.md` — Electron main process, IPC, security
- `.claude/rules/message-persistence.md` — message write paths (**CRITICAL**)
- `.claude/rules/git-conventions.md` — commit format, PR size budget

## Core Principles

- **Message Integrity**: the single-writer-per-role table is the hardest
  invariant. Any new DB write path for messages has caused production
  duplication — block merge and escalate.
- **Security Boundary**: the Electron IPC surface and preload bridge are
  security boundaries. Minimize exposure, validate paths, guard URLs.
- **Layer Discipline**: `shared` <- `core` <- `desktop`/`pwa`. Types flow
  down, never up. Cross-boundary imports are architectural violations.

## Review Categories

Apply the corresponding checklist based on what the PR touches.

### Message & Session Changes

Check against `.claude/rules/message-persistence.md`. Any change that
introduces a new write path, dedup mechanism, or persistence call for
messages is CRITICAL and must block merge.

### Electron Main Process Changes

Check against `.claude/rules/main-process.md`. Watch for IPC handler
registration timing, preload surface leaks, SSRF on user-supplied URLs,
TOCTOU on file paths, and `fileURLToPath` usage.

### Renderer / UI Changes

Check against `.claude/rules/frontend.md`. Key areas: no hardcoded
colors (must use `var(--xxx)`), granular Zustand selectors, `t()` for
all user-facing strings, `lucide-react` for icons, design-token presets
for animations.

### Cross-Package / Architecture Changes

Check against `.claude/rules/architecture.md`. Verify dependency
direction, session key construction via `buildSessionKey()`, no Node
imports in renderer, no type forking across packages.

### PR Scope

Flag PRs exceeding 500 insertions or 30 files unless the diff is
generated code, i18n bulk, or migrations.

## CI-Enforced — Do Not Flag

These are caught by `pnpm check` — commenting on them is noise:

- TypeScript strict mode violations including implicit `any`
- Unused imports/variables (ESLint)
- Formatting and whitespace (Prettier)
