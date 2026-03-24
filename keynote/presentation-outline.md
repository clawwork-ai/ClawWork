# ClawWork — The Task Workbench for OpenClaw

> 10-min Talk Outline | OpenClaw Community

---

## Slide 1: Title

**ClawWork — The Task Workbench for OpenClaw**

- Speaker name / date
- One-liner: "Not a better chat window — a parallel task workbench."

---

## Slide 2: Community Signal

**OpenClaw founder Peter starred and followed ClawWork.**

- Screenshot: GitHub Star notification from Peter
- Screenshot: X (Twitter) interaction from Peter

One slide, no narration needed — let the screenshots speak. This establishes legitimacy before you say a single word about the product: the person who built OpenClaw thinks this project is worth watching.

> Speaker note: don't oversell this. Show it, pause 2 seconds, move on. The audience will draw their own conclusion.

---

## Slide 3: The Problem

**"One window, one task, one context."**

- OpenClaw's Agent is powerful, but the interaction model is serial
- Real work is parallel: you need code written, docs drafted, research done — at the same time
- Artifacts (code, files, docs) scatter across conversations — copy-paste to collect them
- Switching tabs to check "where was that task again?" breaks your flow

---

## Slide 4: What is ClawWork

**A desktop client for OpenClaw, built for parallel work.**

Three pillars:

1. **Multi-Session** — multiple Agent conversations running simultaneously
2. **Parallel Tasks** — each task is an independent session, isolated context, tracked progress
3. **Artifact Aggregation** — every Agent output automatically collected, browsable, searchable

Position: part of the OpenClaw ecosystem, connects via standard Gateway protocol, zero server-side changes needed.

---

## Slide 5: Architecture at a Glance

**Single WebSocket, multiple Sessions.**

```
Desktop ──── WS ────► Gateway :18789
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           Session A  Session B  Session C
           (Task 1)   (Task 2)   (Task 3)
```

- One Gateway connection multiplexes all sessions
- Session Key format: `agent:<agentId>:clawwork:task:<taskId>`
- Each task gets isolated message stream, no cross-talk
- Streaming events routed to the correct task panel by sessionKey

**Desktop client vs. text-based client — protocol-level difference:**

```
Telegram / Slack / TUI (text client)          ClawWork (desktop operator client)
─────────────────────────────────────         ──────────────────────────────────
User input → chat.send (text command)         User input → chat.send (message)
                                              Tool approval → exec.approval.resolve (RPC)
Agent needs approval? → reply text again      Agent needs approval? → native UI button
```

Text-based clients (Telegram, Slack, TUI) can only talk to the Agent via `chat.send` — everything is a text message, including tool-call approvals. ClawWork as a desktop operator client has access to the full RPC surface: tool-call approvals go through `exec.approval.resolve`, a dedicated RPC call — not a chat message pretending to be a command. This means:

- **Precise control**: approve/reject specific tool calls, not "reply yes to the last thing"
- **No ambiguity**: RPC is typed and structured, text commands can be misinterpreted
- **Parallel approval**: multiple tasks can request approval simultaneously, each resolved independently via its own RPC call

---

## Slide 6: Three-Panel Layout

**Left — Center — Right, everything visible at once.**

| Panel                  | Role                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **Left Nav**           | Task list — active tasks with streaming indicators, completed tasks, gateway selector |
| **Center (Main Area)** | Active chat view / File browser / Archived tasks — switchable                         |
| **Right Panel**        | Progress tracking + Artifact list for current task                                    |

- Panels are resizable via drag dividers
- Left nav collapses to icon-only mode (Cmd+K)
- Right panel shows per-task context: progress steps, artifacts, metadata

---

## Slide 7: Multi-Session in Action

**Demo: three tasks running in parallel.**

What to show:

1. Create Task A: "Write a Python CLI tool for file renaming"
2. Create Task B: "Draft API documentation for the auth module"
3. Create Task C: "Analyze this CSV and summarize key metrics"
4. All three Agents respond simultaneously — streaming indicators spin on each task in the left nav
5. Click between tasks — each has its own full chat history, no context bleed

Key details:

- Each task shows: title, status badge, gateway/model info, unread indicator
- Active streaming task shows animated spinner icon
- Relative timestamps ("2 min ago") for quick orientation
- Context menu per task: rename, reset session, archive, delete

---

## Slide 8: Task Progress Tracking

**The right panel extracts structure from chaos.**

- Agent responses with checkboxes (`[x]` / `[ ]`) or numbered lists are auto-parsed
- Displayed as a progress step list:
  - Completed (check icon, strikethrough)
  - In progress (spinner icon)
  - Pending (empty square)
- Progress counter: "3 of 7 completed"
- No manual tracking — the Agent's own output becomes your progress view

This turns an Agent conversation into a trackable work item.

---

## Slide 9: Artifact Aggregation

**Every file the Agent produces, automatically collected.**

- Artifacts appear in two places:
  - **Right Panel → Artifacts tab**: per-task list, click to jump to source message
  - **File Browser** (center panel): all artifacts across all tasks, unified view

- File Browser features:
  - Grid layout with type badges (code / markdown / image / generic)
  - Filter by task, sort by date / name / type
  - Full-text search with highlighted snippets
  - Each artifact links back to the task and message that created it

- No copy-paste, no "where did I put that file" — it's all there.

---

## Slide 10: Token & Context Awareness

**You always know how much runway you have.**

- Chat header shows real-time token usage: input / output counts
- Context usage bar with color thresholds:
  - Green: < 70%
  - Amber: 70–90%
  - Red: > 90%
- Cost tracking per task
- Rate limit visibility
- Thinking indicator: expandable view of Agent's reasoning process

---

## Slide 11: Tech Stack

| Layer      | Choice                               |
| ---------- | ------------------------------------ |
| Shell      | Electron 34 + electron-vite          |
| UI         | React 19 + TypeScript + Tailwind v4  |
| Components | shadcn/ui (Radix + cva)              |
| Animation  | Framer Motion                        |
| State      | Zustand 5                            |
| DB         | better-sqlite3 + Drizzle ORM         |
| Gateway    | Standard OpenClaw WebSocket protocol |

Design choices:

- Dark-first theme, accent green `#0FFD0D`, all colors via CSS variables
- Gateway protocol — no fork, no custom API, standard `chat.send` / `chat.history`
- Single-writer message model to prevent the duplication bugs that plague chat clients

---

## Slide 12: Lessons from Gateway Integration

**Things we learned the hard way (so you don't have to).**

- Gateway broadcasts all session events to the connection — client must filter by sessionKey
- `chat.history` has no per-message ID — timestamps are the closest stable identifier
- Streaming content may differ from `chat.history` content (whitespace, encoding)
- `deliver: false` is essential for desktop clients — otherwise your messages get sent to external channels
- Single-writer architecture is not optional if you want reliable message persistence
  These are real issues. Some have open GitHub issues. Happy to discuss after.

---

## Slide 13: Current Status & What's Next

**Done:**

- Full three-panel layout with resize and collapse
- Multi-session parallel task execution
- Streaming with real-time progress extraction
- Artifact aggregation with file browser and search
- SQLite persistence, Gateway reconnect recovery
- macOS Universal Binary packaging

**Next:**

- Artifact version tracking (Git-backed)
- Cross-task artifact referencing
- Plugin system for custom artifact handlers
- Windows / Linux builds

---

## Slide 14: Try It / Contribute

- GitHub: `github.com/samzong/clawwork`
- Connect to your own OpenClaw Gateway instance — just point it at `:18789`
- PRs welcome — especially around artifact handling and new Gateway features

**"Stop switching tabs. Start running tasks."**

---

---

# Optional Slides — Feature Deep Dives

> Pick 2–3 of these if Q&A time is short and you want to fill, or use them as backup when someone asks "can it do X?"

---

## Optional A: Agent Command Approval — "The Safety Net"

**The Agent asks before it acts.**

- When the Agent invokes dangerous tools (shell exec, file edit, browser action), a confirmation dialog appears
- Approve or reject each tool call individually — not a blanket "yes to all"
- This is a protocol-level advantage of being a desktop operator client:
  - Text clients (Telegram/Slack): user replies "yes" in chat → ambiguous, no tool-call binding
  - ClawWork: dedicated RPC per tool call → typed, scoped, parallel-safe
- Visual: inline Tool Call Cards show function name + parameters in real-time as the Agent works

Why this matters to this audience: you can let the Agent run autonomously on low-risk tasks, and intervene precisely on high-risk ones. No more "I told it to fix a bug and it deleted my config."

---

## Optional B: Voice Input — "Talk to Your Agent"

**Hold Space, speak, release. On-device, no cloud.**

- Powered by whisper.cpp — runs entirely on your Mac, zero API calls
- Hold-to-talk UX: press Space in the chat input → recording overlay → release → transcription appears
- First-use onboarding walks you through model download
- Works offline — no network dependency for input

Why show this: it's unexpected for a desktop coding tool and gets an audible reaction from audiences. Good for a "one more thing" moment.

---

## Optional C: @ File Context — "Bring Your Own Context"

**Type `@` to attach local files as Agent context.**

- `@` trigger in chat input opens a file browser overlay
- Browse and select local files — they become part of the Agent's context for that message
- Manage per-session context folders via the folder button below the input
- Combined with the Tools Catalog (toolbar button listing all Agent tools by category), you get full visibility into what the Agent knows and what it can do

Why this matters: other clients send text. ClawWork sends text + structured file context, giving the Agent better input without manual copy-paste.

---

## Optional D: Multi-Gateway — "One Client, Many Brains"

**Connect to multiple OpenClaw instances simultaneously.**

- Left nav shows gateway selector when multiple are connected
- Each gateway can have different models, agents, and capabilities
- Tasks are created under a specific gateway — route work to the right backend
- Pairing code auth: paste a base64 setup code (URL + bootstrap token in one) to connect a new gateway in seconds

Use case: one gateway runs GPT-4o for fast tasks, another runs a local model for sensitive data, a third connects to your team's shared instance. All in one window.

---

## Optional E: Session Management — "Keep It Clean"

**Compact, reset, or delete — session hygiene built in.**

- **Compact**: summarize old messages to free context window, keep working in the same session
- **Reset**: clear context entirely, fresh start without losing the task record
- **Delete**: remove task and its server session completely
- Device-scoped sessions: your sessions don't collide with other devices using the same OpenClaw instance
- Task titles sync back to the server for consistent naming across reconnects

Why this matters: long-running Agent sessions accumulate context debt. These tools let you manage it without starting over.

---

## Optional F: Security Hardening — "Desktop ≠ Unsafe"

**9 security fixes in one release cycle (v0.0.9).**

| Attack Vector                        | Fix                               |
| ------------------------------------ | --------------------------------- |
| Path traversal in artifact filenames | Sanitized on extraction           |
| Symlink traversal in file operations | Resolved before validation        |
| SSRF via remote image auto-fetch     | Blocked + bounded memory          |
| WebSocket frame injection            | Shape validation before dispatch  |
| TOCTOU race in artifact naming       | Serialized git operations         |
| Credential exposure in debug export  | Pairing/bootstrap tokens redacted |

Plus: Electron sandbox enabled, IPC JSON.parse hardened, ErrorBoundary prevents white-screen crashes.

Why show this: desktop apps get the "is it safe?" question. Having a concrete security audit trail builds trust, especially with this technical audience.

---

## Optional G: 10 Days, 13 Releases — Development Velocity

**v0.0.1 → v0.0.9 in 10 days (Mar 13–22).**

| Version | Headline                                                                              |
| ------- | ------------------------------------------------------------------------------------- |
| v0.0.1  | Three-panel layout, multi-task, streaming                                             |
| v0.0.2  | Image messaging, archived chats, CI/CD                                                |
| v0.0.3  | Model/Agent switching, multi-gateway, Homebrew                                        |
| v0.0.4  | Voice input, keyboard shortcuts, slash commands                                       |
| v0.0.5  | macOS mic permission fix                                                              |
| v0.0.6  | System tray, tool approval, stop generating, tool call cards                          |
| v0.0.7  | @ file context, tools catalog, usage dashboard, settings redesign, Apple notarization |
| v0.0.8  | Drag-to-resize, artifact FTS, pairing code auth, workspace migration                  |
| v0.0.9  | Device-scoped sessions, 9 security fixes, message sync stability                      |

Community contributions from day 2. Two external contributors merged PRs.

Why show this: velocity is credibility. It tells the audience "this project is alive and moving fast."

---

## Optional H: Slash Commands & Command Palette — "The Full OpenClaw Surface"

**Every OpenClaw capability, one keystroke away.**

- Type `/` in chat input → floating autocomplete with 20+ native OpenClaw commands
  - Full keyboard navigation: ↑↓ move, Enter/Tab select, Esc dismiss
  - Commands grouped by category with descriptions
- `Cmd/Ctrl+K` → command palette for quick-switch:
  - Model selection
  - Thinking level adjustment
  - Dashboard shortcuts

Why this matters: OpenClaw's power comes from its commands and tools. Text clients require you to memorize command names and type them blind. ClawWork surfaces the entire command catalog — you discover capabilities you didn't know existed, and use them without reading docs.

The goal: **zero gap between what OpenClaw can do and what the user knows it can do.**

---

## Optional K: Usage & Cost Dashboard — "Transparent by Default"

**Every token counted. Every cent visible. No surprises.**

- Click the token indicator in the chat header → full usage breakdown:
  - **Per-session**: input tokens, output tokens, context usage %
  - **Per-instance**: cumulative cost across all tasks
  - **Rate limits**: current provider rate limit status with progress bars
- Context usage bar in the chat header — always visible:
  - Green: < 70% — plenty of room
  - Amber: 70–90% — heads up
  - Red: > 90% — approaching limit
- Cost displayed in real currency, not abstract "credits"

Why this matters: AI usage costs real money. Users deserve to see exactly where every token goes — not get a surprise bill at the end of the month. Transparency is not a feature, it's respect for the user.

---

## Optional L: Attachment Auto-Persistence — "Nothing Gets Lost"

**Every attachment the Agent produces or you send — automatically saved.**

- Images sent in chat are serialized to SQLite — survive app restarts, no re-download needed
- Agent-generated code blocks and files are extracted and persisted to the workspace automatically
- Artifact extraction covers: code blocks (with language detection), images, markdown documents, generic files
- Each artifact records its source: which task, which message, when

The problem this solves: in every other chat client, attachments are ephemeral. Close the window, clear the cache, restart the app — gone. In ClawWork, attachments are first-class data. If the Agent produced it or you sent it, it's persisted and searchable.

---

## Speaker Notes

### Pacing guide

| Slides | Time       | Notes                                                                                                                                          |
| ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1-2    | 0:00–0:30  | Title + Peter's endorsement — screenshots speak, don't narrate                                                                                 |
| 3-4    | 0:30–2:00  | Problem + positioning, keep it fast                                                                                                            |
| 5-6    | 2:00–3:30  | Architecture + layout, don't linger on diagrams                                                                                                |
| 7-9    | 3:30–7:30  | **Core demo section** — this is the talk. Show real parallel sessions, progress tracking, artifact browser. Live demo or polished screenshots. |
| 10-11  | 7:30–8:30  | Token awareness + tech stack, 1 min max                                                                                                        |
| 12     | 8:30–9:15  | Gateway lessons — this audience will appreciate the war stories                                                                                |
| 13-14  | 9:15–10:00 | Status + CTA, close strong                                                                                                                     |

### Key phrase to repeat

> "Not a chat window — a task workbench."

Use this at least twice: once at the opening, once at the close.
