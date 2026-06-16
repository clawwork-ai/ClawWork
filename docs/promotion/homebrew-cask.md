# Homebrew Cask Distribution

Frictionless macOS install for launch promotion ([#11](https://github.com/clawwork-ai/ClawWork/issues/11)).

## Current state (custom tap)

OpenClaw Desktop is available via the **clawwork-ai/clawwork** Homebrew tap:

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

The tap is updated automatically on each GitHub Release via `.github/workflows/update-homebrew.yml` and `scripts/update-homebrew-tap.sh`.

## Pre-launch checklist

- [ ] Verify latest release DMG assets exist for both `arm64` and `x64`
- [ ] Confirm `brew tap clawwork-ai/clawwork && brew install --cask clawwork` works on Apple Silicon and Intel Macs
- [ ] Update cask `desc` and `homepage` if rebranding to OpenClaw Desktop (see `RENAME-PLAN.md`)
- [ ] Mention Homebrew install in all launch posts (drafts already include the command)

## Path to Homebrew core (optional, Phase 3+)

Submitting to [homebrew-cask](https://github.com/Homebrew/homebrew-cask) removes the `brew tap` step:

```bash
brew install --cask clawwork
```

### Requirements

- Stable public releases with signed/notarized macOS DMG (or universal build)
- Verifiable download URL and SHA-256 checksums per architecture
- App passes `brew audit --cask --strict clawwork`
- No vendor-specific install scripts that bypass Homebrew conventions

### Submission steps

1. Fork `Homebrew/homebrew-cask`
2. Add `Casks/c/clawwork.rb` (or `openclaw-desktop.rb` after rename) following [cask cookbook](https://docs.brew.sh/Cask-Cookbook)
3. Use the same `url`, `sha256`, and `app` stanza as the custom tap cask
4. Run locally:

   ```bash
   brew audit --cask --strict clawwork
   brew install --cask --no-quarantine clawwork
   ```

5. Open PR with title: `Add clawwork cask`
6. Respond to maintainer feedback (notarization, livecheck, naming)

### Cask template (starting point)

Adapt from `scripts/update-homebrew-tap.sh` output in `clawwork-ai/homebrew-clawwork`:

```ruby
cask "clawwork" do
  arch arm: "arm64", intel: "x64"

  version "0.1.0"
  sha256 arm:   "<arm64-sha256>",
         intel: "<x64-sha256>"

  url "https://github.com/clawwork-ai/ClawWork/releases/download/v#{version}/ClawWork-#{version}-mac-#{arch}.dmg"
  name "OpenClaw Desktop"
  desc "Desktop client for OpenClaw"
  homepage "https://github.com/clawwork-ai/ClawWork"

  app "ClawWork.app"

  postflight do
    system_command "xattr", args: ["-cr", "#{appdir}/ClawWork.app"]
  end
end
```

## Promotion copy

Use in launch posts:

> macOS: `brew tap clawwork-ai/clawwork && brew install --cask clawwork`

After core acceptance:

> macOS: `brew install --cask clawwork`
