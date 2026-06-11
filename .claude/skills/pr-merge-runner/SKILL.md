---
name: pr-merge-runner
description: >
  Auto-merge PRs after pr-cleaner-master. Processes only open PRs whose last
  pr-cleaner verdict is merge, oldest first: post Thanks + /lgtm + /approve,
  wait for ci-bot squash merge, git pull origin main, skip on any blocker.
  Never rebase, retest, or fix CI. Always skip workflow-file PRs.
  Use when: "merge safe PRs", "auto merge", "ship merge rows",
  "pr-merge-runner", "/pr-merge-runner", after pr-cleaner when user wants
  hands-off landing. Chains after pr-cleaner-master; does not replace review.
argument-hint: "[#PR|PR...] [--repo owner/repo] [--dry-run] [--fresh]"
---

# PR Merge Runner

Companion to `pr-cleaner-master`. That skill classifies; this skill **lands**
only rows already marked `merge`. The user invoking this skill is the
confirmation gate — no second approval step.

This skill does **not** run deep review (use `pr-cleaner-master` or `pr-eval`).
It does **not** fix code, rebase branches, retest CI, or call `gh pr merge`.

Use the loaded skill base directory as `SKILL_DIR`.

## Argument Parsing

| Input | Behavior |
|---|---|
| no args | merge all eligible PRs from snapshot (`--from-snapshot`, default on) |
| `517 521` | only those PR numbers |
| `#517 #521` | same |
| `--repo owner/repo` | target repo instead of current git directory |
| `--dry-run` | preflight + plan only; no comments, no pull |
| `--fresh` | ignore snapshot verdict filter; preflight all open PRs instead |
| `--from-snapshot` | default **on**; only PRs with snapshot `verdict == "merge"` |

Resolve target repo:

1. If `--repo` given → use it.
2. Else → `gh repo view --json nameWithOwner --jq .nameWithOwner`.
3. If neither works → error: "Not in a GitHub repo. Pass --repo owner/repo."

## Phase 0: Load Snapshot  ⛔ BLOCKING

Same path as `pr-cleaner-master`:

`~/.claude/projects/<project-dir-slug>/pr-cleaner-state.json`

- `<project-dir-slug>` matches the memory-system slug for the current project root.
- If missing or repo mismatch → treat as `{}`.
- With default `--from-snapshot`: candidate PR numbers are keys in `snapshot.prs`
  where `verdict == "merge"`. Still must pass live preflight (PR may have
  closed, CI may have regressed).
- With `--fresh`: candidate set = all open non-draft PRs from batch fetch.

If `--from-snapshot` yields zero candidates → print
`No merge-verdict PRs in snapshot. Run pr-cleaner-master first.` and exit.

## Phase 1: Batch Fetch  ⛔ BLOCKING

Fetch metadata for every candidate (and all open PRs when `--fresh`):

```bash
gh pr view <number> --repo <repo> --json \
  number,title,author,createdAt,headRefOid,mergeable,mergeStateStatus,\
state,isDraft,reviewDecision,labels,updatedAt,additions,deletions,changedFiles,\
statusCheckRollup,comments
```

Or list all open when building `--fresh` set:

```bash
gh pr list --repo <repo> --state open --limit 100 --json \
  number,title,author,createdAt,headRefOid,mergeable,mergeStateStatus,\
state,isDraft,reviewDecision,labels,updatedAt,additions,deletions,changedFiles,\
statusCheckRollup,comments
```

Sort candidates by `createdAt` ascending (oldest first).

## Phase 2: Preflight  ⛔ BLOCKING

For each candidate, **first failing rule → skip** (record reason, continue).
Do **not** attempt any fix.

| # | Condition | Skip reason |
|---|---|---|
| 1 | `state != "OPEN"` or `isDraft` | `not-open` |
| 2 | `--from-snapshot` and snapshot verdict ≠ `merge` | `not-merge-verdict` |
| 3 | `mergeable == "CONFLICTING"` | `conflicts` |
| 4 | `mergeStateStatus == "BLOCKED"` | `blocked` |
| 5 | `statusCheckRollup` has `PENDING` / `FAILURE` / `CANCELLED` / `ERROR` | `ci-fail` |
| 6 | diff touches `.github/workflows/**` (see below) | `workflow-permission` |
| — | all pass | → Phase 3 |

### Workflow-file gate (always skip)

Bot merge fails when the PR updates workflow files without `workflows`
permission (e.g. `.github/workflows/ci-bot.yml`). Detect before commenting:

```bash
gh pr diff <number> --repo <repo> --name-only | rg '^\.github/workflows/'
```

Any match → skip with `workflow-permission`. **Never** add a bypass flag.

### Hard prohibitions

- Never `gh pr update-branch`, rebase, merge main into PR, or `/rebase`.
- Never `/retest`, fix CI, or push commits to the PR branch.
- Never `gh pr merge`, `gh pr review --approve`, or close PRs.
- Never post `/merge` as a fallback (comment body is fixed; see Phase 3).

## Phase 3: Execute Merge Loop  ⚠️ REQUIRED

Process preflight-pass PRs **one at a time** (oldest first). Parallel batching
is forbidden unless the user explicitly says several named PRs may run together
in the same turn — default remains serial.

For each PR:

### Step A — Comment (exact three lines)

```bash
gh pr comment <N> --repo <repo> --body "$(cat <<'EOF'
Thanks @<author>!
/lgtm
/approve
EOF
)"
```

Replace `<author>` with `author.login`. No other text. No code blocks.

Skip Step A in `--dry-run` (log the would-be body instead).

### Step B — Wait for merge

Poll every **10 seconds**, up to **36** attempts (~6 minutes):

```bash
gh pr view <N> --repo <repo> --json state,mergedAt --jq '.state'
```

- `MERGED` → Step C.
- Still `OPEN` after 36 polls → skip `timeout`, next PR.
- `CLOSED` without merge → skip `not-open`, next PR.

Do not post again on timeout.

### Step C — Sync local main

```bash
git pull origin main
```

Run from the current git workspace root. Skip in `--dry-run`.

### Step D — Record

Append to in-memory results: `{ number, title, author, mergedAt }`.

Then continue to the next PR.

## Phase 4: Report  ⚠️ REQUIRED

```markdown
## PR Merge Runner — <repo>  (<UTC timestamp>)

### Merged (N)

| PR | Author | Title |
|---|---|---|
| #517 | @alice | fix: … |

### Skipped (M)

| PR | Reason | Note |
|---|---|---|
| #520 | workflow-permission | touches .github/workflows/ |
| #516 | ci-fail | gateway / e2e failed |

Local main: `<git rev-parse --short HEAD>` (after last pull)
Dry run: yes/no
```

Skip reason codes (use exactly):

| Code | Meaning |
|---|---|
| `ci-fail` | CI red or pending |
| `conflicts` | mergeable CONFLICTING |
| `blocked` | mergeStateStatus BLOCKED |
| `workflow-permission` | diff touches `.github/workflows/**` |
| `timeout` | labels posted but not merged in 6 min |
| `not-open` | closed, merged already, or draft |
| `not-merge-verdict` | snapshot verdict ≠ merge |

## Phase 5: Update Snapshot

After the run, update `pr-cleaner-state.json` for every candidate seen:

```json
"123": {
  "headSha": "...",
  "comments": 4,
  "verdict": "merge",
  "mergeResult": "merged",
  "skipReason": null,
  "at": "2026-06-10T18:00:00Z"
}
```

- `mergeResult`: `"merged"` | `"skipped"` | `"dry-run"`
- `skipReason`: null when merged; otherwise the code above.

Atomic write: `<path>.tmp` then rename. Same repo key as pr-cleaner.

## Chaining With pr-cleaner-master

Typical maintainer flow:

1. `/pr-cleaner-master` — classify, user reviews Action table.
2. `/pr-merge-runner` — land every snapshot `merge` row that still passes
   preflight.

`pr-cleaner-master` never merges; this skill never re-classifies.

## Do Not

- Never fix, rebase, retest, or manually merge.
- Never merge PRs not marked `merge` in snapshot (unless `--fresh`).
- Never merge PRs that touch `.github/workflows/**`.
- Never paste code to contributors.
- Never parallelize by default.
- Never skip the final Merged/Skipped report.
- Never claim CI is green without checking `statusCheckRollup`.
