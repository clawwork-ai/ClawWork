---
theme: default
title: ClawWork — How It's Built
info: |
  ## ClawWork — Engineering Deep Dive
  15 days · 161 PRs · 13 releases. How we built it.

  [GitHub](https://github.com/clawwork-ai/ClawWork)
author: samzong
keywords: openclaw,desktop,agent,parallel-tasks,engineering
highlighter: shiki
colorSchema: all
drawings:
  persist: false
transition: slide-left
favicon: /images/clawwork-logo.png
exportFilename: clawwork-keynote-dev
---

<DeckCoverSlide />

---

# 👋 {{ $t({ en: 'About Me', zh: '关于我' }) }}

<DeckAboutMeSlide />

---

# 🚀 {{ $t({ en: 'Launch Sprint', zh: '启动冲刺' }) }}

<div class="cw-kicker">{{ $t({ en: '13 Releases in 15 Days', zh: '15 天发布 13 个版本' }) }}</div>

<div class="cw-version-grid mt-6">
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.1</div>
    <div class="cw-version-desc">{{ $t({ en: 'Multi-task + streaming', zh: '多任务 + 流式' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.2</div>
    <div class="cw-version-desc">{{ $t({ en: 'Image + archive + CI', zh: '图片 + 归档 + CI' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.3</div>
    <div class="cw-version-desc">{{ $t({ en: 'Agent switch + multi-GW', zh: 'Agent 切换 + 多网关' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="cyan">
    <div class="cw-version-num">v0.0.4</div>
    <div class="cw-version-desc">{{ $t({ en: 'Voice + shortcuts', zh: '语音 + 快捷键' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="cyan">
    <div class="cw-version-num">v0.0.5</div>
    <div class="cw-version-desc">{{ $t({ en: 'Mic permission fix', zh: '麦克风修复' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="purple">
    <div class="cw-version-num">v0.0.6</div>
    <div class="cw-version-desc">{{ $t({ en: 'Tray + tool approval', zh: '托盘 + 工具审批' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="purple">
    <div class="cw-version-num">v0.0.7</div>
    <div class="cw-version-desc">{{ $t({ en: '@ context + usage', zh: '文件上下文 + 用量' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="yellow">
    <div class="cw-version-num">v0.0.8</div>
    <div class="cw-version-desc">{{ $t({ en: 'Resize + FTS + auth', zh: '拖拽 + 搜索 + 配对码' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="red">
    <div class="cw-version-num">v0.0.9</div>
    <div class="cw-version-desc">{{ $t({ en: '9 security fixes', zh: '9 项安全修复' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.10</div>
    <div class="cw-version-desc">{{ $t({ en: 'Auto-update + export', zh: '自动更新 + 导出' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.11</div>
    <div class="cw-version-desc">{{ $t({ en: 'Cron + notifications + live watch', zh: 'Cron + 通知 + 实时监听' }) }}</div>
  </div>
  <div class="cw-version-card" data-tone="cyan">
    <div class="cw-version-num">v0.0.12</div>
    <div class="cw-version-desc">{{ $t({ en: '8 locales + local @ files', zh: '8 语种 + 本地 @ 文件' }) }}</div>
  </div>
  <div class="cw-version-card cw-version-card--latest" data-tone="green">
    <div class="cw-version-num">v0.0.13</div>
    <div class="cw-version-desc">{{ $t({ en: 'PWA + Linux + hardening', zh: 'PWA + Linux + 安全加固' }) }}</div>
  </div>
</div>

---

<div class="cw-grid"></div>
<div class="glow-orb glow-purple cw-pulse" style="top:-80px; right:25%;"></div>
<div class="glow-orb glow-green cw-pulse" style="bottom:-60px; left:30%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'How It\'s Built', zh: '如何构建' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'Architecture decisions and engineering practices.', zh: '架构决策与工程实践。' }) }}</p>
</div>

---
layout: split-media
---

# 🏗 {{ $t({ en: 'Architecture at a Glance', zh: '架构概览' }) }}

<div class="cw-kicker" v-html="$t({ en: 'Single WebSocket, <strong>Multiple Gateways, Parallel Sessions</strong>', zh: '单 WebSocket，<strong>多 Gateway，并行会话</strong>' })"></div>

::left::

<img src="/images/architecture.svg" class="cw-shot cw-shot--panel" alt="ClawWork Architecture" />

::right::

<DeckMiniPanel tone="green" :title="{ en: 'Session Key', zh: '会话标识' }">
  <code>agent:&lt;id&gt;:clawwork:task:&lt;taskId&gt;</code>
</DeckMiniPanel>

<DeckMiniPanel tone="cyan" :title="{ en: 'Isolation', zh: '隔离' }" :body="{ en: 'Events routed by sessionKey. No cross-talk between tasks.', zh: '事件按 sessionKey 路由。任务间互不干扰。' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Desktop RPC', zh: '桌面端 RPC' }">
  {{ $t({ en: 'Dedicated', zh: '专用' }) }} <code>exec.approval.resolve</code>{{ $t({ en: '. Not chat messages.', zh: '。不是聊天消息。' }) }}
</DeckMiniPanel>

---

# 🔧 {{ $t({ en: 'Tech Stack', zh: '技术栈' }) }}

<DeckTechStackSlide />

---

# ⚠️ {{ $t({ en: 'Lessons from Gateway Integration', zh: 'Gateway 集成踩坑记' }) }}

<div class="cw-kicker">{{ $t({ en: 'Things we learned the hard way, so you do not have to.', zh: '我们踩过的坑，帮你提前避开。' }) }}</div>

<div class="cw-alert-grid mt-4">
  <div class="cw-alert-col">
    <div class="cw-alert-row" data-tone="red">
      <div class="cw-alert-icon">⚠</div>
      <p class="cw-alert-copy" v-html="$t({ en: '<strong>Gateway broadcasts all events.</strong> The client must filter by sessionKey.', zh: '<strong>Gateway 广播所有事件。</strong> 客户端必须按 sessionKey 过滤。' })"></p>
    </div>
    <div class="cw-alert-row" data-tone="yellow">
      <div class="cw-alert-icon">⚠</div>
      <p class="cw-alert-copy" v-html="$t({ en: 'Streaming content may <strong>differ from history</strong> in whitespace and encoding.', zh: '流式内容可能在空白与编码上与<strong>历史记录不一致</strong>。' })"></p>
    </div>
    <div class="cw-alert-row" data-tone="green">
      <div class="cw-alert-icon">💡</div>
      <p class="cw-alert-copy" v-html="$t({ en: '<strong>Single-writer</strong> architecture is not optional for reliable persistence.', zh: '<strong>单写者</strong>架构对可靠持久化不是可选项。' })"></p>
    </div>
  </div>

  <div class="cw-alert-col">
    <div class="cw-alert-row" data-tone="yellow">
      <div class="cw-alert-icon">⚠</div>
      <p class="cw-alert-copy" v-html="$t({ en: '<code>chat.history</code> has <strong>no per-message ID</strong>. Timestamps are the closest stable identifier.', zh: '<code>chat.history</code> <strong>没有逐条消息 ID</strong>。时间戳是最接近的稳定标识。' })"></p>
    </div>
    <div class="cw-alert-row" data-tone="green">
      <div class="cw-alert-icon">💡</div>
      <p class="cw-alert-copy" v-html="$t({ en: '<code>deliver: false</code> is essential. Otherwise messages leak into external channels.', zh: '<code>deliver: false</code> 是必须的。否则消息会泄露到外部渠道。' })"></p>
    </div>
  </div>
</div>

<p class="cw-footnote">{{ $t({ en: 'Real issues. Some already have open GitHub issues. Happy to discuss after.', zh: '都是真实问题，部分已经有 GitHub issue。会后可以继续聊。' }) }}</p>

---

# 🔄 {{ $t({ en: 'Dev Workflow', zh: '开发工作流' }) }}

<div class="cw-kicker">{{ $t({ en: 'Vibe Coding: requirement → parallel worktrees → auto review → ship.', zh: 'Vibe Coding：需求 → 并行 worktree → 自动 review → 发版。' }) }}</div>

<DeckDevWorkflowSlide />

---

# 🛡 {{ $t({ en: 'Engineering Quality', zh: '工程质量体系' }) }}

<div class="cw-kicker" v-html="$t({ en: 'Solo developer, <strong>production-grade guardrails</strong>.', zh: '一个人开发，<strong>生产级护栏</strong>。' })"></div>

<DeckQualityGatesSlide />

---

# 🤝 {{ $t({ en: 'Open Source Collaboration', zh: '开源协作' }) }}

<div class="cw-kicker">{{ $t({ en: 'From first clone to merged PR.', zh: '从 clone 到 PR 合并。' }) }}</div>

<DeckOpenSourceSlide />

---

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-80px; left:30%;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="bottom:-60px; right:25%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'By the Numbers', zh: '数据说话' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'What 15 days of vibe coding looks like.', zh: '15 天 Vibe Coding 的成果。' }) }}</p>
</div>

---

# 📈 {{ $t({ en: 'Sprint Breakdown', zh: '冲刺全景' }) }}

<div class="cw-kicker">{{ $t({ en: '15 Days · 161 PRs · 13 Releases', zh: '15 天 · 161 个 PR · 13 个版本' }) }}</div>

<DeckVibeCodingSlide />

---

# ⭐ {{ $t({ en: 'Community Signal', zh: '社区信号' }) }}

<div class="grid grid-cols-2 gap-8">
  <DeckSignalCard
    tone="yellow"
    :title="{ en: 'GitHub Star Notification', zh: 'GitHub Star 通知' }"
    :note="{ en: 'The person who built OpenClaw thinks this project is worth watching.', zh: 'OpenClaw 的作者认为这个项目值得关注。' }"
  >
    <img src="/images/peter-github-star.png" class="cw-shot cw-shot--signal" alt="Peter starred ClawWork on GitHub" />
  </DeckSignalCard>

  <DeckSignalCard tone="green" :title="{ en: 'Star History' }">
    <img src="https://api.star-history.com/svg?repos=clawwork-ai/ClawWork&type=Date" class="cw-shot cw-shot--signal-full" alt="Star History Chart" />
  </DeckSignalCard>
</div>

---

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-100px; left:30%;"></div>
<div class="glow-orb glow-purple cw-pulse" style="bottom:-80px; right:20%;"></div>

<div class="cw-thanks-shell">
  <div class="mb-8">
    <img src="/images/clawwork-logo.png" class="cw-logo-md cw-float cw-logo-glow" alt="ClawWork" />
  </div>

  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'Thanks!', zh: '谢谢！' }) }}</span>
  </h1>

  <p class="cw-thanks-copy">{{ $t({ en: 'Questions, ideas, or PRs. All welcome.', zh: '问题、想法、PR。都欢迎。' }) }}</p>

  <div class="cw-final-links">
    <a href="https://github.com/clawwork-ai/ClawWork" target="_blank" class="cw-final-link">
      <GhIcon :size="20" />
      clawwork-ai/ClawWork
    </a>
    <a href="https://github.com/samzong" target="_blank" class="cw-final-link cw-final-link--muted">
      @samzong
    </a>
  </div>

  <div class="cw-final-note">
    {{ $t({ en: 'Apache 2.0 · macOS & Windows & Linux & PWA · Built with OpenClaw', zh: 'Apache 2.0 · macOS & Windows & Linux & PWA · 基于 OpenClaw 构建' }) }}
  </div>
</div>
