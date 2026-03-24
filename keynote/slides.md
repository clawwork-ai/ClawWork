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
<a href="https://github.com/clawwork-ai/clawwork" target="_blank" style="display:inline-flex;align-items:center;gap:8px;margin-top:24px;text-decoration:none !important;border-bottom:none !important;color:#9ca3af;font-size:0.8rem;font-family:monospace;">
<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
clawwork-ai/clawwork
</a>
<div style="display:flex;align-items:center;gap:12px;margin-top:12px;font-size:0.875rem;opacity:0.4;">
<span>samzong</span><span>·</span><span>OpenClaw Community</span><span>·</span><span>2026</span>
</div>
</div>
<div style="display:flex;align-items:center;justify-content:center;position:relative;">
<div class="cw-screenshot-glow"></div>
<img src="/images/clawwork-screenshot.png" class="cw-float" style="position:relative;border-radius:12px;border:1px solid rgba(55,65,81,0.5);box-shadow:0 25px 50px rgba(0,0,0,0.5),0 0 40px rgba(15,253,13,0.08);max-height:400px;width:auto;" alt="ClawWork App" />
</div>
</div>

---

# Community Signal

<div class="grid grid-cols-2 gap-8 mt-4">

<div class="bg-gray-800/50 rounded-xl p-6 border border-yellow-400/25" style="border-top:2px solid rgba(251,191,36,0.4);">
<div class="font-semibold mb-3 text-sm text-yellow-400/70">GitHub Star Notification</div>
<img src="/images/peter-github-star.png" class="rounded-lg border border-gray-600" style="max-height: 240px; width: auto; object-fit: contain;" alt="Peter starred ClawWork on GitHub" />
<div class="mt-3 text-sm opacity-50 italic">The person who built OpenClaw thinks this project is worth watching.</div>
</div>

<div class="bg-gray-800/50 rounded-xl p-6 border border-green-400/25" style="border-top:2px solid rgba(74,222,128,0.4);">
<div class="font-semibold mb-3 text-sm text-green-400/70">Star History</div>
<img src="https://api.star-history.com/svg?repos=clawwork-ai/ClawWork&type=Date" class="rounded-lg" style="max-height: 240px; width: 100%; object-fit: contain;" alt="Star History Chart" />
</div>

</div>

---

# About Me

<div style="display:grid;grid-template-columns:200px 1fr;gap:32px;margin-top:8px;height:85%;">
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
<img src="https://github.com/samzong.png" style="width:120px;height:120px;border-radius:50%;border:3px solid rgba(74,222,128,0.3);box-shadow:0 0 30px rgba(74,222,128,0.08);" alt="Samzong" />
<div style="font-size:22px;font-weight:700;color:#4ade80;margin-top:4px;">Samzong</div>
<div style="font-size:13px;opacity:0.4;margin-top:-4px;">(船长)</div>
<a href="https://github.com/samzong" target="_blank" style="font-size:12px;opacity:0.4;color:#9ca3af;text-decoration:none !important;border-bottom:none !important;">github.com/samzong</a>
<div style="font-size:11px;opacity:0.35;text-align:center;line-height:1.6;margin-top:8px;">Inference scheduling<br/>Multi-model routing<br/>Production LLMOps<br/>Cloud-native AI</div>
</div>
<div style="display:flex;flex-direction:column;gap:10px;">
<div style="display:flex;align-items:center;gap:14px;padding:16px 20px;border-radius:12px;border:1.5px solid rgba(74,222,128,0.35);background:rgba(74,222,128,0.06);">
<img src="/images/clawwork-logo.png" style="width:40px;height:40px;border-radius:10px;" alt="ClawWork" />
<div style="flex:1;">
<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:16px;font-weight:700;color:#4ade80;">Author of ClawWork</span><span style="font-size:13px;opacity:0.5;">⭐ 287</span></div>
<div style="font-size:12px;opacity:0.5;margin-top:4px;">Open Source OpenClaw Desktop Client — parallel tasks, structured artifacts, scheduled automation</div>
</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;flex:1;margin-top:6px;">
<div style="display:flex;flex-direction:column;gap:6px;">
<div style="font-size:15px;font-weight:700;color:#22d3ee;">Open Source</div>
<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,41,55,0.4);border-radius:6px;border:1px solid rgba(55,65,81,0.5);font-size:13px;"><img src="https://github.com/vllm-project.png" style="width:20px;height:20px;border-radius:4px;" /><span style="color:#4ade80;font-weight:600;">Committer</span><span style="color:#d1d5db;">semantic-router</span><span style="opacity:0.35;margin-left:auto;">⭐ 3.5k</span></div>
<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,41,55,0.4);border-radius:6px;border:1px solid rgba(55,65,81,0.5);font-size:13px;"><img src="https://github.com/llm-d.png" style="width:20px;height:20px;border-radius:4px;" /><span style="color:#22d3ee;font-weight:600;">Contrib</span><span style="color:#d1d5db;">llm-d</span><span style="opacity:0.35;margin-left:auto;">⭐ 2.7k</span></div>
<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,41,55,0.4);border-radius:6px;border:1px solid rgba(55,65,81,0.5);font-size:13px;"><img src="https://github.com/Project-HAMi.png" style="width:20px;height:20px;border-radius:4px;" /><span style="color:#22d3ee;font-weight:600;">Contrib</span><span style="color:#d1d5db;">HAMi · Kueue</span><span style="opacity:0.35;margin-left:auto;">⭐ 3.1k · 2.4k</span></div>
<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,41,55,0.4);border-radius:6px;border:1px solid rgba(55,65,81,0.5);font-size:13px;"><img src="https://github.com/istio.png" style="width:20px;height:20px;border-radius:4px;" /><span style="color:#22d3ee;font-weight:600;">Contrib</span><span style="color:#d1d5db;">Istio · Karmada · K8s</span><span style="opacity:0.35;margin-left:auto;">⭐ 38k+</span></div>
</div>
<div style="display:flex;flex-direction:column;gap:6px;">
<div style="font-size:15px;font-weight:700;color:#c084fc;">Side Projects</div>
<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,41,55,0.4);border-radius:6px;border:1px solid rgba(55,65,81,0.5);font-size:13px;"><img src="https://raw.githubusercontent.com/samzong/chrome-tabboost/main/src/assets/icons/icon128.png" style="width:20px;height:20px;border-radius:4px;" /><span style="color:#d1d5db;font-weight:600;">Chrome TabBoost</span><span style="opacity:0.35;margin-left:auto;">⭐ 81</span></div>
<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,41,55,0.4);border-radius:6px;border:1px solid rgba(55,65,81,0.5);font-size:13px;"><img src="https://raw.githubusercontent.com/samzong/MacMusicPlayer/main/MacMusicPlayer/Assets.xcassets/AppIcon.appiconset/icon_256x256_2x.png" style="width:20px;height:20px;border-radius:4px;" /><span style="color:#d1d5db;font-weight:600;">MacMusicPlayer</span><span style="opacity:0.35;margin-left:auto;">⭐ 75</span></div>
<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,41,55,0.4);border-radius:6px;border:1px solid rgba(55,65,81,0.5);font-size:13px;"><img src="https://raw.githubusercontent.com/samzong/ConfigForge/main/ConfigForge/Assets.xcassets/Logo.imageset/logo.png" style="width:20px;height:20px;border-radius:4px;" /><span style="color:#d1d5db;font-weight:600;">ConfigForge</span><span style="opacity:0.35;margin-left:auto;">⭐ 41</span></div>
<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,41,55,0.4);border-radius:6px;border:1px solid rgba(55,65,81,0.5);font-size:13px;"><img src="https://raw.githubusercontent.com/samzong/gmc/main/logo.png" style="width:20px;height:20px;border-radius:4px;" /><span style="color:#d1d5db;font-weight:600;">gmc</span><span style="opacity:0.35;margin-left:auto;">⭐ 10</span></div>
<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,41,55,0.4);border-radius:6px;border:1px solid rgba(55,65,81,0.5);font-size:13px;"><img src="https://raw.githubusercontent.com/samzong/hf-model-downloader/main/assets/icon.png" style="width:20px;height:20px;border-radius:4px;" /><span style="color:#d1d5db;font-weight:600;">hf-model-downloader</span><span style="opacity:0.35;margin-left:auto;">⭐ 23</span></div>
<div style="display:flex;align-items:center;gap:8px;margin-top:2px;opacity:0.45;"><img src="https://raw.githubusercontent.com/samzong/mdctl/main/mdctl.png" style="width:20px;height:20px;border-radius:4px;" title="mdctl" /><img src="https://raw.githubusercontent.com/samzong/ai-icon-generator/main/public/logo.png" style="width:20px;height:20px;border-radius:4px;" title="ai-icon-generator" /><img src="https://raw.githubusercontent.com/samzong/SaveEye/main/SaveEye/Resources/Assets.xcassets/Logo.imageset/logo.png" style="width:20px;height:20px;border-radius:4px;" title="SaveEye" /><img src="https://raw.githubusercontent.com/samzong/LogoWallpaper/main/LogoWallpaper/Assets.xcassets/AppIcon.appiconset/logo-256.png" style="width:20px;height:20px;border-radius:4px;" title="LogoWallpaper" /><span style="font-size:11px;color:#9ca3af;">+5 more</span></div>
</div>
</div>
</div>
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

<div class="grid grid-cols-2 gap-8 mt-4" style="align-items: start;">

<div>
  <img src="/images/architecture.svg" class="rounded-xl" style="max-height: 380px; width: 100%; object-fit: contain;" alt="ClawWork Architecture" />
</div>

<div>

Single WebSocket, **Multiple Gateways, Parallel Sessions**

<div class="mt-4 space-y-3">
  <div class="px-3 py-2 bg-green-400/5 border border-green-400/20 rounded-lg text-xs">
    <strong class="text-green-400">Session Key</strong>
    <p class="m-0 mt-1 opacity-70"><code>agent:&lt;id&gt;:clawwork:task:&lt;taskId&gt;</code></p>
  </div>
  <div class="px-3 py-2 bg-cyan-400/5 border border-cyan-400/20 rounded-lg text-xs">
    <strong class="text-cyan-400">Isolation</strong>
    <p class="m-0 mt-1 opacity-70">Events routed by sessionKey — no cross-talk between tasks</p>
  </div>
  <div class="px-3 py-2 bg-purple-400/5 border border-purple-400/20 rounded-lg text-xs">
    <strong class="text-purple-400">Desktop RPC</strong>
    <p class="m-0 mt-1 opacity-70">Dedicated <code>exec.approval.resolve</code> — not chat messages</p>
  </div>
</div>

</div>

</div>

---

# Three-Panel Layout

<div class="grid grid-cols-2 gap-8 mt-4" style="align-items: start;">

<div>
  <img src="/images/three-panel-full.png" class="rounded-xl border border-gray-700 shadow-2xl" style="max-height: 380px; width: 100%; object-fit: contain;" alt="ClawWork three-panel layout" />
</div>

<div>

Left — Center — Right, everything visible at once

<div class="mt-4 space-y-3">
  <div class="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <strong class="text-green-400">Left Nav</strong>
    <p class="text-xs opacity-60 mt-1 m-0">Task list + gateway selector + cron jobs</p>
  </div>
  <div class="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <strong class="text-cyan-400">Center</strong>
    <p class="text-xs opacity-60 mt-1 m-0">Chat with streaming, tool cards, approval prompts</p>
  </div>
  <div class="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <strong class="text-purple-400">Right Panel</strong>
    <p class="text-xs opacity-60 mt-1 m-0">Progress tracking + artifact browser</p>
  </div>
</div>

<div class="mt-4 flex items-center gap-3 text-sm opacity-50">
  <span>Resizable dividers</span>
  <kbd class="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs font-mono">⌘K</kbd>
  <span>Collapse sidebar</span>
</div>

</div>

</div>

---

# Multi-Session in Action

<div class="grid grid-cols-2 gap-8 mt-4" style="align-items: start;">

<div>
  <img src="/images/multi-session-parallel.png" class="rounded-xl border border-gray-700 shadow-2xl" style="max-height: 380px; width: 100%; object-fit: contain;" alt="Three tasks running in parallel" />
</div>

<div>

Three tasks running in parallel — each with isolated context

<div class="mt-4 space-y-3">
  <div class="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <div class="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0"></div>
    <span class="text-sm">Status badges — running, idle, done</span>
  </div>
  <div class="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <div class="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></div>
    <span class="text-sm">Animated spinners for active sessions</span>
  </div>
  <div class="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <div class="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0"></div>
    <span class="text-sm">Unread indicators per task</span>
  </div>
  <div class="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
    <div class="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0"></div>
    <span class="text-sm">Relative timestamps</span>
  </div>
</div>

</div>

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
  <img src="/images/file-browser.png" class="rounded-xl border border-gray-700" style="max-height: 300px; width: auto; object-fit: contain;" alt="Artifact file browser" />
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
  <img src="/images/token-usage.png" class="rounded-xl border border-gray-700" style="max-height: 300px; width: auto; object-fit: contain;" alt="Token usage dashboard" />
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

<div class="grid grid-cols-2 gap-3 mt-4">

<div class="space-y-3">
  <div class="flex items-center gap-3 bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
    <div class="w-8 h-8 rounded-lg bg-red-400/15 flex items-center justify-center shrink-0 text-sm">⚠</div>
    <p class="text-xs m-0"><strong>Gateway broadcasts ALL events</strong> — client must filter by sessionKey</p>
  </div>
  <div class="flex items-center gap-3 bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
    <div class="w-8 h-8 rounded-lg bg-yellow-400/15 flex items-center justify-center shrink-0 text-sm">⚠</div>
    <p class="text-xs m-0">Streaming content may <strong>differ from history</strong> (whitespace, encoding)</p>
  </div>
  <div class="flex items-center gap-3 bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
    <div class="w-8 h-8 rounded-lg bg-green-400/15 flex items-center justify-center shrink-0 text-sm">💡</div>
    <p class="text-xs m-0"><strong>Single-writer</strong> architecture is not optional for reliable persistence</p>
  </div>
</div>

<div class="space-y-3">
  <div class="flex items-center gap-3 bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
    <div class="w-8 h-8 rounded-lg bg-yellow-400/15 flex items-center justify-center shrink-0 text-sm">⚠</div>
    <p class="text-xs m-0"><code>chat.history</code> has <strong>no per-message ID</strong> — timestamps are the closest stable identifier</p>
  </div>
  <div class="flex items-center gap-3 bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
    <div class="w-8 h-8 rounded-lg bg-green-400/15 flex items-center justify-center shrink-0 text-sm">💡</div>
    <p class="text-xs m-0"><code class="text-green-400">deliver: false</code> is essential — otherwise messages get sent to external channels</p>
  </div>
</div>

</div>

<p class="mt-3 text-xs opacity-40 italic">Real issues. Some with open GitHub issues. Happy to discuss after.</p>

---

# Current Status & What's Next

<div class="grid grid-cols-2 gap-10 mt-4">

<div>
  <h3 class="text-green-400 font-semibold mb-3">✓ Shipping (v0.0.10)</h3>
  <ul class="space-y-1.5 text-sm">
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Three-panel layout with resize & collapse</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Multi-session parallel task execution</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Streaming, tool cards, approval prompts</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Artifact auto-extract, file browser & FTS</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Agent management & tools catalog</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Usage & cost dashboard</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> In-app auto-update & session export</li>
    <li class="flex items-center gap-2"><span class="text-green-400 font-bold">✓</span> Cron scheduling, desktop notifications</li>
  </ul>
</div>

<div>
  <h3 class="text-cyan-400 font-semibold mb-3">○ Next</h3>
  <ul class="space-y-1.5 text-sm opacity-70">
    <li class="flex items-center gap-2"><span class="opacity-40">○</span> Linux packages</li>
    <li class="flex items-center gap-2"><span class="opacity-40">○</span> Conversation branching</li>
    <li class="flex items-center gap-2"><span class="opacity-40">○</span> Artifact diff view</li>
    <li class="flex items-center gap-2"><span class="opacity-40">○</span> Custom themes</li>
  </ul>

  <div class="mt-4 p-3 bg-green-400/5 border border-green-400/15 rounded-xl">
    <div class="text-[10px] uppercase tracking-wider opacity-50 mb-1">Dev Velocity</div>
    <div class="text-2xl font-extrabold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
      12 Days, 10 Releases
    </div>
    <p class="text-sm opacity-50">v0.0.1 → v0.0.10 (Mar 13–24)</p>
  </div>
</div>

</div>

---

layout: center
class: text-center

---

# Stop Switching Tabs, Start Running Tasks.

<div class="mt-8">
  <a href="https://github.com/clawwork-ai/clawwork" target="_blank" style="text-decoration:none;">
    <div style="display:inline-flex;align-items:center;gap:20px;padding:24px 40px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:16px;transition:border-color 0.2s;">
      <svg width="32" height="32" viewBox="0 0 16 16" fill="#f3f4f4"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
      <div style="text-align:left;">
        <div style="font-family:monospace;font-size:1.1rem;color:#f3f4f4;font-weight:600;">clawwork-ai/clawwork</div>
        <div style="font-size:0.8rem;color:#9ca3af;margin-top:4px;">Open Source OpenClaw Desktop Client</div>
      </div>
      <div style="display:flex;gap:16px;margin-left:20px;">
        <div style="display:flex;align-items:center;gap:4px;color:#fbbf24;font-size:0.85rem;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
          Star
        </div>
        <div style="display:flex;align-items:center;gap:4px;color:#9ca3af;font-size:0.85rem;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 10 0-1.5.75.75 0 000 1.5zM8 12.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0z"/></svg>
          Fork
        </div>
      </div>
    </div>
  </a>
</div>

<div class="mt-6 text-sm opacity-40 italic">
  "Not a chat window — a task workbench."
</div>

<div class="mt-6 flex gap-8 justify-center text-sm opacity-50">
  <span>Apache 2.0</span>
  <span>·</span>
  <span>macOS & Windows</span>
  <span>·</span>
  <span>PRs welcome</span>
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

# Release History

v0.0.1 → v0.0.10 · Mar 13 – Mar 24, 2026

<div class="grid grid-cols-2 gap-6 mt-4 text-sm">

<div class="space-y-2">
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

<div class="space-y-2">
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.6</span> <span class="opacity-60">System tray, tool approval, stop generating</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.7</span> <span class="opacity-60">@ file context, tools catalog, usage dashboard</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.8</span> <span class="opacity-60">Drag-to-resize, artifact FTS, pairing code auth</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
    <div><span class="text-green-400 font-mono font-semibold">v0.0.9</span> <span class="opacity-60">9 security fixes, device-scoped sessions, sync stability</span></div>
  </div>
  <div class="flex gap-3 items-start">
    <div class="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0"></div>
    <div><span class="text-cyan-400 font-mono font-semibold">v0.0.10</span> <span class="opacity-60">Auto-update, agent management, session export, debug bundle</span></div>
  </div>
</div>

</div>

<div class="mt-4 flex gap-4">
  <div class="p-2 bg-green-400/5 border border-green-400/15 rounded-lg text-xs">
    Community contributions from <strong class="text-green-400">day 2</strong> — external PRs merged
  </div>
  <div class="p-2 bg-cyan-400/5 border border-cyan-400/15 rounded-lg text-xs">
    <strong class="text-cyan-400">Next:</strong> Cron tasks, notifications, gateway version display
  </div>
</div>
