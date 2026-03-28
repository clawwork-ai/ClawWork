# Git Conventions

- Branch commits: `type(scope): description` (conventional commits, lowercase)
- PR titles: `[Type] Description` per DEVELOPMENT.md
- Squash merge all PRs to keep `main` log clean with PR title format
- All git text (commit messages, PR titles, PR body, branch names) in English (rule 0)
- Single PR budget: max 500 insertions, max 30 files — exceptions only for generated code, i18n bulk, or migrations
- If a PR exceeds budget, split by domain boundary (main/renderer/shared/pwa/core) or by concern (refactor vs feature)
