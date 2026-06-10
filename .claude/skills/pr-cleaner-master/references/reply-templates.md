# Reply Templates

Four canonical templates, one per verdict. All templates are English,
GitHub-short, and never paste code. Fill in `<placeholders>` and adapt
naturally — these are starting points, not rigid forms.

Global rules (from `SKILL.md`):

- Open with `Thanks @<user>!` or `Thanks @<user>, ...`.
- One or two short sentences.
- Never paste code blocks to contributors.
- Never explain how to do something the contributor already knows (rebase,
  fix a typo, add a sign-off).
- Never apologize for the contributor's mistake.
- Never promise a review timeline.

---

## Template: merge

Used when a PR is clean and ready to merge. The skill does NOT auto-merge —
this reply just signals approval in a lightweight way. The user will run
`gh pr merge` manually afterward.

Canonical:

```
Thanks @<user>, looks good to me!
```

Variants (pick one, don't chain):

- `Thanks @<user>! This is a clean change, LGTM.`
- `Thanks @<user>, this does exactly what it should. LGTM.`
- `Thanks @<user>! Happy to land this.`

Never say "I'll merge this now" unless the user is actually about to run
`gh pr merge` in the same breath — dangling promises erode trust.

---

## Template: fix-and-merge

Used when the maintainer plans to fix a small blocker locally and land it.
In most cases **no reply is posted at all** — the user just fixes and
merges. Only post a reply if the contributor explicitly asked what's
missing, or if the blocker is non-obvious and silent merging would be
confusing.

```
Thanks @<user>! Just needs <one-line blocker> — I'll handle it on merge.
```

Valid one-line blockers (examples):

- `missing DCO sign-off`
- `one typo in <file>`
- `a lint fix`
- `a missing import`

Never describe the fix in detail. Never suggest how the contributor should
apply it. The whole point of `fix-and-merge` is that the maintainer absorbs
the cost so the contribution lands fast.

---

## Template: request-changes

Used when there are real questions about scope, approach, or correctness.
Ask, don't prescribe. The goal is to start a conversation, not dictate a
solution.

Shape: `Thanks @<user>! <one-sentence observation>. <one question>?`

General examples:

```
Thanks @<user>! This touches <area>, which is load-bearing across the codebase. Could we align on the scope before landing?
```

```
Thanks @<user>! I'm not sure the current approach handles <concern>. Could you walk me through how it behaves when <scenario>?
```

```
Thanks @<user>! This looks like it might conflict with <rule/convention>. Is there a reason to diverge here, or should we match the existing pattern?
```

Scope call-outs (flag the scope, don't judge the code):

```
Thanks @<user>! This widens the public API surface. Could we discuss the design in an issue first before landing?
```

Rule violations — reference the rule by name, not by code example:

```
Thanks @<user>! This looks like it conflicts with the <rule name> rule. Could you take a look at the rule doc and adjust?
```

**Never** paste the offending code back at the contributor. **Never** paste
a "suggested fix". Both read as condescending and push the contributor into
a narrow compliance task rather than letting them own the solution.

---

## Template: conflicts

Used when `mergeable == CONFLICTING`. This is Waiting, not Action — the
comment just bounces the PR back to the author.

Canonical:

```
Thanks @<user>! Could you rebase on main? Happy to re-review once it's clean.
```

Variants:

- `Thanks @<user>! There are some conflicts with main now — could you resolve and push? I'll re-review right after.`
- `Thanks @<user>! Looks like main has moved. Could you rebase when you get a chance?`

Never explain how to rebase. Never link to a rebase tutorial. The
contributor knows how their own git works.

---

## Non-templates: when NOT to post

- **CI not passing**: do not comment. GitHub already notified the author.
  A maintainer ping on top of the CI email is noise, not help.
- **Awaiting author after a prior `request-changes`**: do not ping. The
  ball is in their court; pinging is nagging.
- **Cached PRs**: no new information, no comment.
- **Draft PRs**: do not comment, do not classify.

---

## Anti-patterns (do not do these)

- `Thank you so much for your contribution to our project! We really appreciate ...`
- `Hi @<user>, hope you are doing well! ...`
- `This is a great PR, I have just a few small suggestions: [wall of text]`
- Pasting a "suggested fix" code block.
- Asking the contributor to "please update the PR description to follow our template" — it is fine to mention as FYI, never block.
- Promising a specific review timeline.
- Apologizing on behalf of the project for a contributor mistake.
- Multiple separate comments stacked on the same PR in one sweep —
  consolidate into one.
- Explaining obvious workflow steps (rebase, sign-off, squash) that any
  active contributor already knows.
