# Awesome List PR Template

Submit OpenClaw Desktop to curated OpenClaw ecosystem lists ([#11](https://github.com/clawwork-ai/ClawWork/issues/11), Phase 1.5 / Phase 3).

---

## Target repositories

Search for and PR against:

- `awesome-openclaw` or similar community-maintained lists
- OpenClaw org README "Ecosystem" / "Community Tools" section (coordinate with maintainers)
- General lists: `awesome-electron`, `awesome-local-first`, `awesome-ai-agents` (if criteria match)

## PR title

```
Add OpenClaw Desktop to Desktop Clients section
```

## Entry (markdown)

Add under **Desktop Clients** or **Community Tools**:

```markdown
- [OpenClaw Desktop](https://github.com/clawwork-ai/ClawWork) — Local-first desktop client with parallel tasks, real-time tool call visualization, and Git-native artifact management. macOS (Homebrew cask), Windows, Linux, and PWA. Apache-2.0.
```

## Short description (for list maintainers)

OpenClaw Desktop is the purpose-built desktop workspace for OpenClaw — a three-column UI (task list, conversation, progress/artifacts) with per-task session isolation, SQLite + Git local storage, multi-gateway support, and Teams multi-agent orchestration. It replaces using Feishu/Slack/DingTalk as ad-hoc agent channels.

## PR body template

```markdown
## Summary

Adds OpenClaw Desktop to the Desktop Clients section.

## Project details

- **Repo:** https://github.com/clawwork-ai/ClawWork
- **License:** Apache-2.0
- **Install:** GitHub Releases; macOS via `brew tap clawwork-ai/clawwork && brew install --cask clawwork`
- **Website:** https://clawwork-ai.github.io/ClawWork/

OpenClaw Desktop is an actively maintained open-source client for the OpenClaw agent runtime, with 8-language i18n and cross-platform installers.

## Checklist

- [x] Project is open source with a clear license
- [x] Project has documentation and install instructions
- [x] Entry follows the list's existing format
- [x] Link points to the canonical repository
```

## After merge

- [ ] Verify link renders correctly on the awesome list
- [ ] Cross-link from OpenClaw Desktop README if the list is authoritative
- [ ] Mention inclusion in launch posts (HN, Reddit, V2EX) for social proof
