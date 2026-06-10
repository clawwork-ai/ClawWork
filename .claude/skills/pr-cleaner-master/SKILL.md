---
name: pr-cleaner-master
description: >
  Maintainer's daily PR sweep tool. Batch-review all open PRs in the current
  repo, classify each into merge / fix-and-merge / request-changes / waiting /
  cached, and present a three-section table. Incremental by default: unchanged
  PRs since last sweep are folded away.
  Use when: "review PRs", "pr cleaner", "pr sweep", "pr triage", "daily PR review",
  "project maintainer PR management", sweeping open PRs as a project owner.
  Passing a PR number narrows the sweep to that PR. Do not use for:
  single-PR deep review or evaluating review comments on your own PR (use
  pr-eval), issue management (use issue-cleaner-master), or automated merging.
argument-hint: "[#PR|PR...] [--repo owner/repo] [--all] [--fresh]"
---

IRON LAW: NEVER POST A COMMENT, APPROVE, OR MERGE A PR WITHOUT SHOWING THE EXACT CONTENT TO THE USER AND GETTING EXPLICIT CONFIRMATION FIRST. NEVER PASTE CODE SNIPPETS TO CONTRIBUTORS — pasting code to a contributor is condescending. The only exception is a `fix-and-merge` row where the user has explicitly asked for a suggested fix in the current turn.

# PR Cleaner Master

Maintainer's daily sweep over open PRs. The goal is "inbox zero for PRs":
scan all open PRs in seconds, classify each, and surface only the ones that
need you today. Unchanged PRs since the last sweep are folded away.

This skill does NOT do deep single-PR review — for that, use `pr-eval`.
This skill does NOT merge PRs automatically — merge is a manual step you take
after seeing the verdict, or invoke `pr-merge-runner` to land snapshot `merge`
rows hands-off.

Use the loaded skill base directory as `SKILL_DIR` when referencing bundled
files (e.g. `references/reply-templates.md`).

## Argument Parsing

| Input                    | Behavior                                                  |
|--------------------------|-----------------------------------------------------------|
| no args                  | sweep all open PRs in current repo (incremental)          |
| `123`                    | sweep only PR #123                                       |
| `#123 #124`              | sweep only the listed PRs                                 |
| `123 124`                | sweep only the listed PRs                                 |
| `--repo owner/repo`      | sweep that repo instead of current git directory          |
| `--all`                  | show Cached section in full instead of folded count       |
| `--fresh`                | ignore snapshot, re-classify every PR from scratch        |

Resolve target repo:

1. If `--repo` given → use it.
2. Else → `gh repo view --json nameWithOwner --jq .nameWithOwner`.
3. If neither works → error: "Not in a GitHub repo. Pass --repo owner/repo."

## Phase 0: Snapshot Load  ⛔ BLOCKING

- [ ] Compute snapshot path: `~/.claude/projects/<project-dir-slug>/pr-cleaner-state.json`
  - `<project-dir-slug>` is the same slug used by the memory system for the
    current project root (e.g. `-Users-x-git-clawwork--bare`).
- [ ] If the file exists, load it. If not, treat as `{}`.
- [ ] Snapshot shape:
  ```json
  {
    "repo": "owner/repo",
    "lastSweep": "2026-04-13T14:32:00Z",
    "prs": {
      "123": {"headSha": "abc...", "comments": 2, "verdict": "merge", "at": "2026-04-13T14:32:00Z"}
    }
  }
  ```
- [ ] If snapshot `repo` differs from target repo, treat as empty. One
      snapshot per repo — do not mix.
- [ ] If `--fresh`, skip loading and treat as empty.

## Phase 1: Batch Fetch  ⛔ BLOCKING

One command gets the batch metadata for a full sweep. Do NOT loop per-PR in
this phase unless the user explicitly passed PR numbers.
Before selecting fields, verify `gh pr list --help` and request only fields
listed under `JSON FIELDS`. If a field is not exposed by the installed `gh`,
omit it and use the fallback behavior below; never pretend unsupported fields
exist.

```bash
gh pr list --repo <repo> --state open --limit 100 --json \
  number,title,author,headRefOid,mergeable,mergeStateStatus,\
state,isDraft,reviewDecision,labels,updatedAt,additions,deletions,changedFiles,\
statusCheckRollup,latestReviews,reviews,comments
```

If the user passed one or more PR numbers, fetch exactly those PRs instead of
listing all open PRs. A bare number such as `123` is equivalent to `#123`.

```bash
gh pr view <number> --repo <repo> --json \
  number,title,author,headRefOid,mergeable,mergeStateStatus,\
state,isDraft,reviewDecision,labels,updatedAt,additions,deletions,changedFiles,\
statusCheckRollup,latestReviews,reviews,comments
```

For multiple explicit PR numbers, repeat `gh pr view` only for those requested
numbers and combine the results into the same in-memory list shape used by the
full sweep.

- [ ] If `gh` is not authenticated → error with `gh auth login` hint.
- [ ] If a requested PR does not exist or is not open → report that PR and do
      not fabricate a row for it.
- [ ] If no open PRs in a full sweep → print
      `No open PRs in <repo>. Nothing to sweep.` and exit.
- [ ] `authorAssociation` is not available in all `gh pr list` versions. If it
      is unavailable, do not display a `*first-time*` marker. Do not infer it
      from author age, commit count, or prior local snapshots.
- [ ] Also fetch the PR template once (best effort, non-blocking):
  ```bash
  gh api "repos/<repo>/contents/.github/pull_request_template.md" 2>/dev/null \
    || gh api "repos/<repo>/contents/.github/PULL_REQUEST_TEMPLATE.md" 2>/dev/null \
    || gh api "repos/<repo>/contents/PULL_REQUEST_TEMPLATE.md" 2>/dev/null
  ```
  Hold it in memory for this sweep only. If not found, no problem — PR
  template compliance is informational.

## Phase 2: Fast Classify  ⚠️ REQUIRED

For each PR, apply the decision tree below. **First matching rule wins.**
This phase uses metadata only — do NOT read diffs here.

| # | Condition                                                                        | Bucket                     |
|---|----------------------------------------------------------------------------------|----------------------------|
| 1 | `isDraft == true`                                                                | `skip` (not shown)         |
| 2 | `mergeable == "CONFLICTING"`                                                     | Waiting: `conflicts`       |
| 3 | `statusCheckRollup` has any `PENDING` / `FAILURE` / `CANCELLED` / `ERROR`        | Waiting: `ci-not-passing`  |
| 4 | `reviewDecision == "CHANGES_REQUESTED"` AND `headRefOid` unchanged from snapshot | Waiting: `awaiting-author` |
| 5 | `headRefOid` AND `comments.length` both unchanged from snapshot                  | `cached` (prior verdict)   |
| — | otherwise                                                                        | → Phase 3                  |

CI is a hard gate. A PR with red or pending CI is the contributor's
responsibility to fix before maintainer review. Do not comment, do not
classify further — just list it under Waiting. A contributor with a failing
CI does not need the maintainer pinging them; GitHub already notified them.

## Phase 3: Deep Decide  ⚠️ REQUIRED (only for PRs that survive Phase 2)

For each PR entering this phase, decide between `merge` / `fix-and-merge` /
`request-changes`. This is where diffs and files get read — and only here.

- [ ] Read existing review activity first using fields supported by the local
      `gh` (`latestReviews`, `reviews`, `comments`). Do NOT re-raise points
      another reviewer already made.
- [ ] If exact unresolved review-thread state is needed and the local `gh`
      does not expose `reviewThreads`, fetch it best-effort through the GitHub
      API/GraphQL. If it still cannot be fetched, do not claim the PR has no
      unresolved threads; classify conservatively and mention that thread state
      was not locally exposed.
- [ ] If existing threads are known to be unresolved and the author has not
      responded, reclassify as Waiting: `awaiting-author`.
- [ ] For small PRs (`additions + deletions <= 20` AND `changedFiles <= 3`):
      read the full diff, lean toward `merge` or `fix-and-merge`.
- [ ] For larger PRs: list changed files first, then read only the
      load-bearing ones (entrypoints, shared types, files crossing layer
      boundaries defined in project rules).

### Decision rules

| Signal                                                                                                       | Verdict            |
|--------------------------------------------------------------------------------------------------------------|--------------------|
| Code is clean, style matches project, tests present where expected, scope fits                              | `merge`            |
| Only trivial blockers (missing DCO sign-off, typo, lint fix, one-char bug) — faster to fix than to request  | `fix-and-merge`    |
| Low-risk project-convention issues caused by unfamiliarity with local workflow, formatting, naming, docs, or small tests | `fix-and-merge` |
| Real questions about scope, approach, correctness, or API surface                                           | `request-changes`  |

Scope rules of thumb:

- Prefer `fix-and-merge` over `request-changes` when the issue is simple,
  mechanical, low risk, and likely caused by the contributor not knowing local
  project conventions. Do this to avoid needless review round-trips for small
  PRs.
- Do not use `fix-and-merge` to paper over real uncertainty. Correctness,
  security, data behavior, public API, architecture direction, and cross-layer
  ownership questions still require `request-changes`.
- A PR that widens public API, touches shared types, or crosses package
  boundaries without prior discussion → `request-changes` (flag the scope,
  don't judge the code).
- A PR that violates a project rule (e.g. comments in code, hardcoded
  colors, content-based dedup, forbidden message persistence paths) →
  `request-changes` with a one-line reference to the rule name. **Do not
  paste the offending code back at the contributor.**
- Uncertainty → `request-changes`. Never merge when in doubt.

## Phase 4: Present Table  ⚠️ REQUIRED

Output exactly this three-section structure. Only sections with content are
shown. The Cached section is folded by default (summary line only) unless
`--all` was passed.

```markdown
## PR Cleaner — <repo>  (sweep <UTC timestamp>, N open / M action / K waiting / C cached)

### 🟢 Action needed (M)

| PR | Author | Title | Action | Why | Draft Reply |
|---|---|---|---|---|---|
| #123 | @alice | feat: X | `merge` | Clean, 40 LOC, tests included | Thanks @alice, looks good to me! |
| #124 | @bob | fix: Y | `fix-and-merge` | Missing DCO sign-off, otherwise LGTM | (locally add sign-off — no reply needed) |
| #125 | @carol | refactor: Z | `request-changes` | Widens shared API without discussion | Thanks @carol! Could we align on the scope of the public surface change before landing? |

### 🟡 Waiting (K) — no action from you

| PR | Author | Reason | Since |
|---|---|---|---|
| #126 | @dave | CI not passing | 3h |
| #127 | @eve | Conflicts | 1d |
| #128 | @frank | Awaiting author response | 2d |

### ⚪ Cached (C)

2 PRs unchanged since last sweep: #101, #115. Run with `--all` to show.
```

Column notes:

- **Author**: if an actually fetched `authorAssociation` is
  `FIRST_TIME_CONTRIBUTOR` or `FIRST_TIMER`, append `*first-time*` after the
  handle (display only — reply template is NOT auto-switched). If the field is
  not available from local metadata, show only the handle.
- **Action**: one of `merge` / `fix-and-merge` / `request-changes`.
- **Why**: max ~10 words, factual, no hedging.
- **Draft Reply**: the exact comment text that will be posted if confirmed.
  If no reply is needed, write `(no reply)` or a short parenthetical note.

## Phase 5: Confirmation Gate  ⛔ NEVER SKIP

After the table, wait for the user. Common commands the user may type:

| User says                         | Meaning                                                  |
|-----------------------------------|----------------------------------------------------------|
| `go` / `post` / `all`             | post every non-empty Draft Reply in the Action section   |
| `post 123 125`                    | post only those rows' replies                            |
| `skip 124`                        | drop that row's reply                                    |
| `edit 125 "<new text>"`           | replace that row's draft with new text, then confirm     |
| `abort` / `cancel`                | exit without posting anything                            |

Never post without an explicit green light. No `--quick` flag bypasses this
gate — if added later, it must still stop here.

## Phase 6: Execute Approved Replies

For each approved reply:

```bash
gh pr comment <N> --repo <repo> --body "<draft text>"
```

- Use `gh pr comment`, NOT `gh pr review --approve` or
  `gh pr review --request-changes`. This skill keeps review state
  lightweight and avoids tangling with project-specific approval settings.
- For `fix-and-merge` rows, the skill does NOT fix code. It prints a
  one-liner telling the user what needs fixing locally. The user then uses
  `/commit` or `/ship` or manual git to handle it.
- The skill NEVER runs `gh pr merge`. Merging is always a manual step taken
  by the user after the sweep.

After posting, report:

```
Posted: #123, #125
Skipped: #124 (local fix), #127 (aborted)
```

## Phase 7: Write Snapshot

Update `pr-cleaner-state.json`:

- [ ] For every PR seen this sweep (action + waiting + cached), write
      `{headSha, comments, verdict, at}`. Skipped drafts are NOT written.
- [ ] Set `lastSweep` to now (UTC ISO8601).
- [ ] Set `repo` to the target repo.
- [ ] Atomic write: write to `<path>.tmp`, then rename over the target.
- [ ] If the parent directory doesn't exist, create it. Do NOT create any
      sibling memory files — this snapshot is the only file this skill
      writes in that directory.

## Reply Style  ⚠️ REQUIRED

See `references/reply-templates.md` for the four canonical templates.

Global rules (IRON LAW scope):

- English only. No CJK in GitHub-facing text.
- Open with `Thanks @<user>!` or `Thanks @<user>, ...`. No "We really
  appreciate", no "Thank you so much for your contribution".
- One or two short sentences. No walls of text.
- **Never paste code blocks to contributors.** Reference files by
  `path/to/file.ts:42` at most. Explaining how to fix something is the
  contributor's job — the maintainer's job is to point at what.
- PR template non-compliance: mention it as FYI in parentheses, never block
  on it. Example:
  `(FYI, we have a PR template at .github/PULL_REQUEST_TEMPLATE.md — no need to backfill)`.
- Conflicts: one line. Never explain how to rebase.
- Never apologize on behalf of the project for a contributor mistake.
- Never promise a timeline ("I'll review this next week").

## Do Not

- Never post a comment without explicit user confirmation — **never**.
- Never paste code snippets to contributors, even for "helpful" suggestions.
- Never run `gh pr merge` automatically.
- Never run `gh pr review --approve` or `--request-changes`. Use plain
  `gh pr comment`.
- Never close a PR, even if it looks like spam. Flag for user judgment.
- Never modify PR labels — that is the triage skill's job.
- Never re-raise a point another reviewer already made. Read existing review
  activity first, and use `reviewThreads` only when it is actually exposed or
  fetched.
- Never classify a Draft PR.
- Never skip the Phase 5 confirmation gate.
- Never read PR diffs in Phase 2 — metadata only until Phase 3.
- Never cache a verdict across repos — the snapshot is keyed to one repo.
- Never fabricate PR data, author handles, or commit SHAs.
- Never claim "CI is green" without verifying `statusCheckRollup`.
- Never ping a contributor about a failing CI run — GitHub already did.
