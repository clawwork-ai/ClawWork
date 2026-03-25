## Summary

Describe the change and the problem it solves.

## Type of change

- [ ] `[Feat]` new feature
- [ ] `[Fix]` bug fix
- [ ] `[UI]` UI or UX change
- [ ] `[Docs]` documentation-only change
- [ ] `[Refactor]` internal cleanup
- [ ] `[Build]` CI, packaging, or tooling change
- [ ] `[Chore]` maintenance

## Why is this needed?

Explain the user problem, engineering problem, or follow-up this PR addresses.

## What changed?

-

## Architecture impact

- Owning layer: shared / main / preload / renderer
- Cross-layer impact: none / yes (explain)
- Invariants touched from `docs/architecture-invariants.md`:
- Why those invariants remain protected:

## Linked issues

Closes #

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm check:ui-contract`
- [ ] Manual smoke test
- [ ] Not run

Commands, screenshots, or notes:

```text

```

## Screenshots or recordings

If the change affects the UI, add screenshots or a short recording.

If the change touches renderer styles, layout, spacing, component states, or interaction polish, explain which tokens, variables, states, or `pnpm check:ui-contract` rules were intentionally preserved or changed.

## Release note

- [ ] No user-facing change. Release note is `NONE`.
- [ ] User-facing change. Release note is included below.

```release-note
NONE
```

## Checklist

- [ ] The PR title uses at least one approved prefix: `[Feat]`, `[Fix]`, `[UI]`, `[Docs]`, `[Refactor]`, `[Build]`, or `[Chore]`
- [ ] The summary explains both what changed and why
- [ ] Validation reflects the commands actually run for this PR
- [ ] Architecture impact is described and references any touched invariants
- [ ] Cross-layer changes are explicitly justified
- [ ] The release note block is accurate
