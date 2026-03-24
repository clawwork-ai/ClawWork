---
theme: default
title: ClawWork — The Task Workbench for OpenClaw
info: |
  ## ClawWork
  A desktop client for OpenClaw, built for parallel work.

  [GitHub](https://github.com/samzong/clawwork)
author: samzong
keywords: openclaw,desktop,agent,parallel-tasks
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
favicon: ''
---

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-120px;right:20%;"></div>
<div class="glow-orb glow-purple cw-pulse" style="bottom:-100px;left:-60px;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="top:50%;right:-80px;width:350px;height:350px;"></div>
<div class="cw-scanline"></div>
<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:40px;height:100%;align-items:center;position:relative;z-index:10;">
<div style="display:flex;flex-direction:column;justify-content:center;">
<div style="display:flex;align-items:center;gap:20px;margin-bottom:32px;">
<img src="/images/clawwork-logo.png" class="cw-float cw-logo-glow" style="width:64px;height:64px;" alt="ClawWork" />
<span style="font-size:1.8rem;opacity:0.2;font-weight:100;">×</span>
<div class="cw-float-slow" style="width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;background:linear-gradient(135deg,#ef4444,#f97316);box-shadow:0 8px 20px rgba(249,115,22,0.2);">🦞</div>
</div>
<h1 style="font-size:3.2rem;font-weight:900;letter-spacing:-0.02em;line-height:1.1;margin:0;">
<span class="cw-shimmer">ClawWork</span>
</h1>
<p style="font-size:1.25rem;font-weight:300;color:#9ca3af;margin-top:8px;letter-spacing:0.03em;">The Task Workbench for OpenClaw</p>
<div class="cw-gradient-border" style="margin-top:24px;padding:12px 24px;background:rgba(17,24,39,0.6);width:fit-content;">
<p style="font-size:1rem;color:#d1d5db;font-weight:300;font-style:italic;margin:0;">"Not a better chat window —<br/>a <strong style="color:#4ade80;font-weight:600;">parallel task workbench</strong>."</p>
</div>
<div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap;">
<span style="padding:4px 12px;background:rgba(74,222,128,0.1);color:#4ade80;font-size:12px;border-radius:9999px;border:1px solid rgba(74,222,128,0.3);font-weight:600;">Electron 34</span>
<span style="padding:4px 12px;background:rgba(34,211,238,0.1);color:#22d3ee;font-size:12px;border-radius:9999px;border:1px solid rgba(34,211,238,0.3);font-weight:600;">React 19</span>
<span style="padding:4px 12px;background:rgba(192,132,252,0.1);color:#c084fc;font-size:12px;border-radius:9999px;border:1px solid rgba(192,132,252,0.3);font-weight:600;">Gateway Protocol</span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-top:32px;font-size:0.875rem;opacity:0.4;">
<span>samzong</span><span>·</span><span>OpenClaw Community</span><span>·</span><span>2026</span>
</div>
</div>
<div style="display:flex;align-items:center;justify-content:center;position:relative;">
<div class="cw-screenshot-glow"></div>
<img src="/images/clawwork-screenshot.png" class="cw-float" style="position:relative;border-radius:12px;border:1px solid rgba(55,65,81,0.5);box-shadow:0 25px 50px rgba(0,0,0,0.5),0 0 40px rgba(15,253,13,0.08);max-height:400px;width:auto;" alt="ClawWork App" />
</div>
</div>

---

## transition: fade-out

# Community Signal

<div class="grid grid-cols-2 gap-8 mt-8">

<div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
  <div class="font-semibold mb-3 text-sm opacity-60">GitHub Star Notification</div>
  <img src="/images/peter-github-star.png" class="rounded-lg border border-gray-600" alt="Peter starred ClawWork on GitHub" />
</div>

</div>

<div class="mt-8 text-center text-sm opacity-50 italic">
  The person who built OpenClaw thinks this project is worth watching.
</div>

---

# The Problem

<div class="text-lg font-light italic text-gray-400 border-l-4 border-green-400 pl-4 my-4">"One window, one task, one context."</div>

<div class="grid grid-cols-2 gap-3 mt-3">

<div class="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50">
<div class="flex items-center gap-2 mb-1"><span class="text-lg">🔗</span><h3 class="text-red-400 font-semibold text-sm m-0">Serial Interaction</h3></div>
<p class="text-xs opacity-70 m-0">Agent is powerful, but forces one task at a time. Real work is parallel.</p>
</div>

<div class="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50">
<div class="flex items-center gap-2 mb-1"><span class="text-lg">📂</span><h3 class="text-red-400 font-semibold text-sm m-0">Scattered Artifacts</h3></div>
<p class="text-xs opacity-70 m-0">Code, files, docs scatter across conversations. Copy-paste to collect.</p>
</div>

<div class="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50">
<div class="flex items-center gap-2 mb-1"><span class="text-lg">🔄</span><h3 class="text-red-400 font-semibold text-sm m-0">Context Switching</h3></div>
<p class="text-xs opacity-70 m-0">Switching tabs to check status breaks flow. No structured progress tracking.</p>
</div>

<div class="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50">
<div class="flex items-center gap-2 mb-1"><span class="text-lg">💬</span><h3 class="text-red-400 font-semibold text-sm m-0">Text-Only Control</h3></div>
<p class="text-xs opacity-70 m-0">"Reply yes" for tool approvals. Ambiguous, no tool-call binding.</p>
</div>

</div>

---

# What is ClawWork

A desktop client for OpenClaw, **built for parallel work**.

<div class="grid grid-cols-3 gap-6 mt-8">

<div class="bg-gray-800/40 rounded-xl p-6 border-t-3 border-green-400 border border-gray-700/50">
  <div class="text-3xl mb-4">⚡</div>
  <h3 class="text-green-400 font-semibold text-lg mb-2">Multi-Session</h3>
  <p class="text-sm opacity-70">Multiple Agent conversations running simultaneously. No more waiting.</p>
</div>

<div class="bg-gray-800/40 rounded-xl p-6 border-t-3 border-cyan-400 border border-gray-700/50">
  <div class="text-3xl mb-4">🎯</div>
  <h3 class="text-cyan-400 font-semibold text-lg mb-2">Parallel Tasks</h3>
  <p class="text-sm opacity-70">Each task is an independent session — isolated context, tracked progress.</p>
</div>

<div class="bg-gray-800/40 rounded-xl p-6 border-t-3 border-purple-400 border border-gray-700/50">
  <div class="text-3xl mb-4">📦</div>
  <h3 class="text-purple-400 font-semibold text-lg mb-2">Artifact Aggregation</h3>
  <p class="text-sm opacity-70">Every Agent output automatically collected, browsable, searchable.</p>
</div>

</div>

<div class="mt-6 flex items-center gap-3">
  <span class="px-3 py-1 bg-cyan-400/10 text-cyan-400 text-xs rounded-full border border-cyan-400/30 font-semibold">ZERO SERVER CHANGES</span>
  <span class="text-sm opacity-60">Connects via standard Gateway protocol</span>
</div>

---

# Architecture at a Glance

Single WebSocket, **Multiple Sessions**

<div class="grid grid-cols-2 gap-12 mt-6">

<div class="flex flex-col items-center gap-4">
  <div class="px-6 py-3 rounded-xl border-2 border-green-400 bg-gray-800/60 font-mono text-sm shadow-lg shadow-green-400/10">
    🖥 ClawWork Desktop
  </div>
  <div class="text-green-400 text-xl">⇅</div>
  <div class="text-xs font-mono opacity-50">WebSocket</div>
  <div class="px-6 py-3 rounded-xl border border-gray-600 bg-gray-800/40 font-mono text-sm">
    Gateway :18789
  </div>
  <div class="flex gap-3 mt-2">
    <div class="px-4 py-2 rounded-lg border border-green-400/50 bg-gray-800/40 text-xs text-center">
      Session A<br/><span class="opacity-50">Task 1</span>
    </div>
    <div class="px-4 py-2 rounded-lg border border-cyan-400/50 bg-gray-800/40 text-xs text-center">
      Session B<br/><span class="opacity-50">Task 2</span>
    </div>
    <div class="px-4 py-2 rounded-lg border border-purple-400/50 bg-gray-800/40 text-xs text-center">
      Session C<br/><span class="opacity-50">Task 3</span>
    </div>
  </div>
</div>

<div>

**Session Key Format**

```
agent:<agentId>:clawwork:task:<taskId>
```

- One connection multiplexes all sessions
- Each task gets isolated message stream
- Streaming events routed by `sessionKey`
- No cross-talk between tasks

<div class="mt-4 p-4 bg-green-400/5 border border-green-400/20 rounded-xl text-sm">
  <strong class="text-green-400">Desktop vs Text Client:</strong> ClawWork uses dedicated RPC (<code>exec.approval.resolve</code>) for tool approvals — not chat messages.
</div>

</div>

</div>

---

## layout: default

# Three-Panel Layout

Left — Center — Right, everything visible at once

<div class="mt-4">
  <img src="/images/three-panel-full.png" class="rounded-xl border border-gray-700 shadow-2xl" alt="ClawWork three-panel layout" />
</div>

<div class="mt-3 grid grid-cols-3 gap-4 text-center text-sm">
  <div class="p-2 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <strong class="text-green-400">Left Nav</strong>
    <p class="text-xs opacity-50 mt-1">Task list + gateway selector</p>
  </div>
  <div class="p-2 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <strong class="text-cyan-400">Center</strong>
    <p class="text-xs opacity-50 mt-1">Chat / File browser / Archive</p>
  </div>
  <div class="p-2 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <strong class="text-purple-400">Right Panel</strong>
    <p class="text-xs opacity-50 mt-1">Progress + Artifacts</p>
  </div>
</div>

<div class="mt-3 flex items-center gap-4 text-sm opacity-60">
  <span>Resizable drag dividers</span>
  <kbd class="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs font-mono">⌘K</kbd>
  <span>Collapse sidebar</span>
</div>

---

# Multi-Session in Action

Three tasks running in parallel — each with isolated context

<div class="mt-6">
  <img src="/images/multi-session-parallel.png" class="rounded-xl border border-gray-700 shadow-2xl" alt="Three tasks running in parallel" />
</div>

<div class="mt-4 p-4 bg-white/2 border border-gray-700 rounded-xl flex gap-8 text-sm">
  <div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-green-400"></div> Status badges</div>
  <div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-cyan-400"></div> Animated spinners</div>
  <div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-purple-400"></div> Unread indicators</div>
  <div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-yellow-400"></div> Relative timestamps</div>
</div>

---

# Task Progress Tracking

<div class="grid grid-cols-2 gap-6 mt-3">

<div class="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
<div class="flex justify-between items-center mb-2">
<span class="font-semibold text-sm">Build Progress</span>
<span class="text-green-400 text-xs">5/7</span>
</div>
<div class="h-1.5 bg-gray-700 rounded-full mb-3 overflow-hidden">
<div class="h-full bg-green-400 rounded-full" style="width: 71%"></div>
</div>
<div class="space-y-1.5">
<div class="flex items-center gap-2 text-xs line-through opacity-40"><span class="text-green-400">✓</span> Initialize project structure</div>
<div class="flex items-center gap-2 text-xs line-through opacity-40"><span class="text-green-400">✓</span> Set up argument parser</div>
<div class="flex items-center gap-2 text-xs line-through opacity-40"><span class="text-green-400">✓</span> Implement core rename logic</div>
<div class="flex items-center gap-2 text-xs line-through opacity-40"><span class="text-green-400">✓</span> Add dry-run mode</div>
<div class="flex items-center gap-2 text-xs line-through opacity-40"><span class="text-green-400">✓</span> Write unit tests</div>
<div class="flex items-center gap-2 text-xs text-yellow-400"><span>◉</span> Error handling & logging <span class="ml-auto px-1.5 py-0.5 bg-yellow-400/10 text-yellow-400 text-[10px] rounded-full border border-yellow-400/30">In Progress</span></div>
<div class="flex items-center gap-2 text-xs opacity-40"><span>○</span> Write README</div>
</div>
</div>

<div class="space-y-3">
<div class="p-3 bg-green-400/5 border border-green-400/15 rounded-xl">
<h3 class="text-green-400 font-semibold text-sm mb-1">How It Works</h3>
<ul class="text-xs opacity-80 space-y-0.5 m-0">
<li>▸ Agent <code>[x]</code> / <code>[ ]</code> responses auto-parsed</li>
<li>▸ Visual progress steps, real-time counter</li>
<li>▸ No manual tracking needed</li>
</ul>
</div>
<div class="p-3 bg-gray-800/40 border border-gray-700/50 rounded-xl">
<h3 class="text-cyan-400 font-semibold text-sm mb-1">The Result</h3>
<p class="text-xs opacity-70 m-0">Agent conversation → <strong class="text-white">trackable work item</strong>. Output becomes your progress view.</p>
</div>
</div>

</div>

---

# Artifact Aggregation

Every file the Agent produces, automatically collected

<div class="grid grid-cols-2 gap-10 mt-6">

<div>
  <h3 class="text-green-400 font-semibold mb-3">File Browser</h3>
  <img src="/images/file-browser.png" class="rounded-xl border border-gray-700" alt="Artifact file browser" />
</div>

<div>
  <h3 class="text-green-400 font-semibold mb-3">Features</h3>
  <ul class="text-sm opacity-80 space-y-2">
    <li>▸ Grid layout with type badges</li>
    <li>▸ Filter by task, sort by date / name / type</li>
    <li>▸ Full-text search with highlighted snippets</li>
    <li>▸ Each artifact links back to source message</li>
    <li>▸ Per-task artifact list in right panel</li>
  </ul>
  <div class="mt-5 p-4 bg-green-400/5 border border-green-400/15 rounded-xl">
    <p class="text-sm"><strong class="text-green-400">No copy-paste.</strong> No "where did I put that file." It's all there.</p>
  </div>
</div>

</div>

---

# Token & Context Awareness

You always know how much runway you have

<div class="grid grid-cols-2 gap-8 mt-6">

<div>
  <img src="/images/token-usage.png" class="rounded-xl border border-gray-700" alt="Token usage dashboard" />
</div>

<div>

- Chat header shows real-time token counts (input / output)
- Context usage bar with color thresholds: 🟢 <70% · 🟡 70-90% · 🔴 >90%
- Cost displayed in real currency, not abstract "credits"
- Rate limit status with progress bars
- Expandable thinking process viewer

<div class="mt-4 p-4 bg-green-400/5 border border-green-400/15 rounded-xl">
  <p class="text-sm"><strong class="text-green-400">Transparency is not a feature</strong> — it's respect for the user.</p>
</div>

</div>

</div>

---

# Tech Stack

<div class="grid grid-cols-2 gap-10 mt-4">

<div>

| Layer      | Choice                              |
| ---------- | ----------------------------------- |
| Shell      | Electron 34 + electron-vite         |
| UI         | React 19 + TypeScript + Tailwind v4 |
| Components | shadcn/ui (Radix + cva)             |
| Animation  | Framer Motion                       |
| State      | Zustand 5                           |
| Database   | better-sqlite3 + Drizzle ORM        |
| Gateway    | Standard OpenClaw WS Protocol       |

</div>

<div>

### Design Choices

- Dark-first theme, accent <span class="text-green-400 font-mono text-sm">#0FFD0D</span>
- All colors via CSS variables
- Standard Gateway protocol — no fork, no custom API
- Single-writer message model to prevent duplication bugs

<div class="mt-4 p-4 border border-dashed border-gray-600 rounded-xl">
  <p class="text-sm opacity-60">Every technology choice prioritizes <strong class="text-white">ecosystem compatibility</strong>. Zero server-side changes required.</p>
</div>

</div>

</div>

---

# Lessons from Gateway Integration

Things we learned the hard way — so you don't have to

<div class="mt-6 space-y-3 max-w-3xl">
  <div class="flex items-center gap-4 bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
    <div class="w-9 h-9 rounded-lg bg-red-400/15 flex items-center justify-center shrink-0">⚠</div>
    <p class="text-sm"><strong>Gateway broadcasts ALL session events</strong> — client must filter by sessionKey</p>
  </div>
  <div class="flex items-center gap-4 bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
    <div class="w-9 h-9 rounded-lg bg-yellow-400/15 flex items-center justify-center shrink-0">⚠</div>
    <p class="text-sm"><code>chat.history</code> has <strong>no per-message ID</strong> — timestamps are the closest stable identifier</p>
  </div>
  <div class="flex items-center gap-4 bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
    <div class="w-9 h-9 rounded-lg bg-yellow-400/15 flex items-center justify-center shrink-0">⚠</div>
    <p class="text-sm">Streaming content may <strong>differ from history content</strong> (whitespace, encoding)</p>
  </div>
  <div class="flex items-center gap-4 bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
    <div class="w-9 h-9 rounded-lg bg-green-400/15 flex items-center justify-center shrink-0">💡</div>
    <p class="text-sm"><code class="text-green-400">deliver: false</code> is essential — otherwise messages get sent to external channels</p>
  </div>
  <div class="flex items-center gap-4 bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
    <div class="w-9 h-9 rounded-lg bg-green-400/15 flex items-center justify-center shrink-0">💡</div>
    <p class="text-sm">Single-writer architecture is <strong>not optional</strong> for reliable message persistence</p>
  </div>
</div>

<p class="mt-4 text-sm opacity-40 italic">Real issues. Some with open GitHub issues. Happy to discuss after.</p>

---

# Current Status & What's Next

<div class="grid grid-cols-2 gap-10 mt-6">

<div>
  <h3 class="text-green-400 font-semibold mb-4">✓ Done</h3>
  <ul class="space-y-2 text-sm">
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Full three-panel layout with resize & collapse</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Multi-session parallel task execution</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Streaming with real-time progress extraction</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Artifact aggregation with file browser & search</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> SQLite persistence, Gateway reconnect recovery</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> macOS Universal Binary packaging</li>
  </ul>
</div>

<div>
  <h3 class="text-cyan-400 font-semibold mb-4">○ Next</h3>
  <ul class="space-y-2 text-sm opacity-70">
    <li class="flex items-center gap-2"><span class="opacity-40">○</span> Artifact version tracking (Git-backed)</li>
    <li class="flex items-center gap-2"><span class="opacity-40">○</span> Cross-task artifact referencing</li>
    <li class="flex items-center gap-2"><span class="opacity-40">○</span> Plugin system for custom artifact handlers</li>
    <li class="flex items-center gap-2"><span class="opacity-40">○</span> Windows / Linux builds</li>
  </ul>

  <div class="mt-6 p-4 bg-green-400/5 border border-green-400/15 rounded-xl">
    <div class="text-[10px] uppercase tracking-wider opacity-50 mb-1">Dev Velocity</div>
    <div class="text-2xl font-extrabold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
      10 Days, 13 Releases
    </div>
    <p class="text-sm opacity-50">v0.0.1 → v0.0.9 (Mar 13–22)</p>
  </div>
</div>

</div>

---

layout: center
class: text-center

---

# Stop Switching Tabs.<br/>Start Running Tasks.

<div class="mt-6 inline-block px-8 py-4 bg-gray-800 rounded-xl border border-gray-600 font-mono text-lg">
  github.com/<span class="text-green-400">samzong</span>/<span class="text-cyan-400">clawwork</span>
</div>

<div class="mt-8 flex gap-12 justify-center">
  <div class="flex flex-col items-center gap-2">
    <div class="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center text-2xl">🔌</div>
    <span class="text-sm opacity-50">Point to :18789</span>
  </div>
  <div class="text-gray-600 text-2xl self-center">→</div>
  <div class="flex flex-col items-center gap-2">
    <div class="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center text-2xl">⚡</div>
    <span class="text-sm opacity-50">Run parallel tasks</span>
  </div>
  <div class="text-gray-600 text-2xl self-center">→</div>
  <div class="flex flex-col items-center gap-2">
    <div class="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center text-2xl">🤝</div>
    <span class="text-sm opacity-50">PRs welcome</span>
  </div>
</div>

<div class="mt-8 text-sm opacity-50 italic">
  "Not a chat window — a task workbench."
</div>

---

# Bonus: Security Hardening

9 security fixes in one release cycle (v0.0.9)

<div class="mt-6 bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden max-w-3xl">
  <div class="grid grid-cols-2 gap-4 p-4 border-b border-gray-700 font-semibold text-sm">
    <span class="text-red-400">Attack Vector</span>
    <span class="text-green-400">Fix</span>
  </div>
  <div class="divide-y divide-gray-700/50">
    <div class="grid grid-cols-2 gap-4 p-3 text-sm"><span class="text-red-400/80">Path traversal in artifact filenames</span><span class="text-green-400/80">Sanitized on extraction</span></div>
    <div class="grid grid-cols-2 gap-4 p-3 text-sm"><span class="text-red-400/80">Symlink traversal in file ops</span><span class="text-green-400/80">Resolved before validation</span></div>
    <div class="grid grid-cols-2 gap-4 p-3 text-sm"><span class="text-red-400/80">SSRF via remote image auto-fetch</span><span class="text-green-400/80">Blocked + bounded memory</span></div>
    <div class="grid grid-cols-2 gap-4 p-3 text-sm"><span class="text-red-400/80">WebSocket frame injection</span><span class="text-green-400/80">Shape validation before dispatch</span></div>
    <div class="grid grid-cols-2 gap-4 p-3 text-sm"><span class="text-red-400/80">TOCTOU race in artifact naming</span><span class="text-green-400/80">Serialized git operations</span></div>
    <div class="grid grid-cols-2 gap-4 p-3 text-sm"><span class="text-red-400/80">Credential exposure in debug export</span><span class="text-green-400/80">Tokens redacted</span></div>
  </div>
</div>

<div class="mt-4 flex gap-3">
  <span class="px-3 py-1 bg-green-400/10 text-green-400 text-xs rounded-full border border-green-400/30 font-semibold">Electron Sandbox</span>
  <span class="px-3 py-1 bg-green-400/10 text-green-400 text-xs rounded-full border border-green-400/30 font-semibold">IPC Hardened</span>
  <span class="px-3 py-1 bg-green-400/10 text-green-400 text-xs rounded-full border border-green-400/30 font-semibold">ErrorBoundary</span>
</div>

---

# Bonus: 10 Days, 13 Releases

v0.0.1 → v0.0.9 · Mar 13–22, 2026

<div class="grid grid-cols-2 gap-10 mt-6 text-sm">

<div class="space-y-3">
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.1</span> <span class="opacity-60">Three-panel layout, multi-task, streaming</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.2</span> <span class="opacity-60">Image messaging, archived chats, CI/CD</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.3</span> <span class="opacity-60">Model/Agent switching, multi-gateway, Homebrew</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.4</span> <span class="opacity-60">Voice input, keyboard shortcuts, slash commands</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.5</span> <span class="opacity-60">macOS mic permission fix</span></div>
  </div>
</div>

<div class="space-y-3">
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.6</span> <span class="opacity-60">System tray, tool approval, stop generating</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.7</span> <span class="opacity-60">@ file context, tools catalog, usage dashboard, Apple notarization</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.8</span> <span class="opacity-60">Drag-to-resize, artifact FTS, pairing code auth</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.9</span> <span class="opacity-60">Device-scoped sessions, 9 security fixes, sync stability</span></div>
  </div>
</div>

</div>

<div class="mt-6 inline-block p-3 bg-green-400/5 border border-green-400/15 rounded-xl text-sm">
  Community contributions from <strong class="text-green-400">day 2</strong>. Two external contributors merged PRs.
</div>
