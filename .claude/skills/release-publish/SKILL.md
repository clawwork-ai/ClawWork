---
name: release-publish
description: >
  Prepare and publish a ClawWork desktop release or prerelease.
  Use when: user says "release", "publish beta", "发版", "发布 beta",
  "发 beta", "cut a release", or asks to ship a version tag.
---

# Release Publish

Project-specific workflow for publishing ClawWork desktop releases.

## Rules

- Release from `main` only.
- Do not open a PR unless the user explicitly asks for one.
- For prereleases, use tags like `v0.0.15-beta.4`.
- `packages/desktop/package.json` version must exactly match the tag without `v`.
- Commit release prep with `git commit -s`.
- Do not push commits or tags without explicit user approval.
- The canonical local verification gate is `pnpm check`.

## Preflight

1. Read `AGENTS.md`, `docs/agent-rules/git-conventions.md`, and the release section in `DEVELOPMENT.md`.
2. Check repo state:
   ```bash
   git status --short --branch
   git fetch --tags origin
   git tag --sort=-creatordate | head -20
   git log --oneline --decorate -20
   ```
3. Confirm `main` is clean and synced with `origin/main`.
4. Identify the next version from the latest tag and user intent.
5. Review unreleased commits:
   ```bash
   git log --format='%h %s' <previous-tag>..HEAD
   node scripts/generate-release-notes.mjs <previous-tag>..HEAD
   ```

## Prepare Commit

1. Update `packages/desktop/package.json` to the release version.
2. Run:
   ```bash
   pnpm check
   ```
3. Inspect the final diff:
   ```bash
   git diff -- packages/desktop/package.json
   git status --short
   ```
4. Stage only intended files.
5. Commit:
   ```bash
   git commit -s -m "chore(release): prepare vX.Y.Z[-beta.N]"
   ```

## Publish

Only after the user explicitly approves pushing:

1. Create the tag on the release prep commit:
   ```bash
   git tag vX.Y.Z[-beta.N]
   ```
2. Push the commit and tag:
   ```bash
   git push origin main
   git push origin vX.Y.Z[-beta.N]
   ```
3. Monitor the workflow:
   ```bash
   gh run list --workflow release.yml --limit 5
   gh run watch <run-id>
   ```

## Post-Publish Verification

1. Confirm `release.yml` succeeded.
2. Confirm GitHub Release exists and is not draft:
   ```bash
   gh release view vX.Y.Z[-beta.N] --repo clawwork-ai/clawwork --json tagName,isDraft,isPrerelease,isLatest,assets
   ```
3. Confirm expected assets are present:
   - macOS arm64 DMG + zip + blockmaps
   - macOS x64 DMG + zip + blockmaps
   - Windows x64 NSIS installer + blockmap
   - Linux x64 AppImage and deb
   - `latest-mac-arm64.yml`
   - `latest-mac.yml`
   - `latest.yml`
   - `latest-linux.yml`
4. If the release body is empty, confirm `publish-release-notes` filled it.

## Failure Handling

- Version mismatch: update `packages/desktop/package.json`, recommit, move or recreate the tag only after confirming with the user.
- Missing assets: inspect the failed matrix job first; do not re-run blindly.
- macOS notarization failure: `release.yml` has an ad-hoc fallback. Treat non-notarization macOS failures as real blockers.
- Failed local `pnpm check`: fix root cause before publishing.
