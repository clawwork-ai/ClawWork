# Demo Recording Checklist

Steps to produce the 60-second demo GIF/video for README and launch posts. Tracked in [#6](https://github.com/clawwork-ai/ClawWork/issues/6) and [#11](https://github.com/clawwork-ai/ClawWork/issues/11).

## Demo scenario

Pick a visually compelling workflow that completes in ~30 seconds, e.g. **"Generate a Python CLI tool"**:

1. Create a new task
2. Send a user message
3. Watch AI streaming reply
4. Expand a tool call card
5. Show artifact saved in the file browser

## Recording

- [ ] Record one continuous take (macOS: `Cmd+Shift+5`)
- [ ] Crop to app window only — no desktop clutter
- [ ] Dark theme — verify no layout glitches
- [ ] Test with a real OpenClaw Gateway connection (not mocked)
- [ ] Export as MP4, H.264, 60fps preferred
- [ ] Compress to <15MB

## GIF for README

- [ ] Convert MP4 to GIF (≤60 seconds, optimized for GitHub rendering)
- [ ] Save as `docs/demo.gif`
- [ ] Embed in README:

```markdown
## Demo

![ClawWork 60-second demo](./docs/demo.gif)
```

## Hero screenshot

- [ ] Extract the best frame from the recording
- [ ] Must show: three-column layout, active conversation, file browser with artifacts
- [ ] PNG, at least 1920px wide
- [ ] Save as `docs/screenshot.png` (or update existing)
