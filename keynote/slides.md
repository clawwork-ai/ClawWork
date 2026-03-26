---
theme: default
title: ClawWork — The Task Workbench for OpenClaw
info: |
  ## ClawWork
  A desktop client for OpenClaw, built for parallel work.

  [GitHub](https://github.com/clawwork-ai/ClawWork)
author: samzong
keywords: openclaw,desktop,agent,parallel-tasks
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
favicon: ''
---

<DeckCoverSlide />

---

# 👋 <span class="en">About Me</span><span class="zh">关于我</span>

<DeckAboutMeSlide />

---

# 😤 <span class="en">Pain Points of Using OpenClaw</span><span class="zh">养虾的痛点</span>

<div class="en cw-kicker">"One window, one task, one context."</div>
<div class="zh cw-kicker">"一个窗口，一个任务，一个上下文。"</div>

<div class="cw-grid-2-tight">
  <DeckFeatureCard
    compact
    tone="red"
    icon="🔗"
    en-title="Serial Interaction"
    zh-title="串行交互"
    en-body="Agent is powerful, but forces one task at a time. Real work is parallel."
    zh-body="Agent 很强大，但一次只能做一件事。真实工作是并行的。"
  />
  <DeckFeatureCard
    compact
    tone="red"
    icon="📂"
    en-title="Scattered Artifacts"
    zh-title="产物散落"
    en-body="Code, files, docs scatter across conversations. Copy-paste to collect."
    zh-body="代码、文件、文档散落在各个对话中，靠复制粘贴收集。"
  />
  <DeckFeatureCard
    compact
    tone="red"
    icon="🔄"
    en-title="Context Switching"
    zh-title="上下文切换"
    en-body="Switching tabs to check status breaks flow. No structured progress tracking."
    zh-body="切换标签页查看状态会打断心流，没有结构化的进度追踪。"
  />
  <DeckFeatureCard
    compact
    tone="red"
    icon="💬"
    en-title="Text-Only Control"
    zh-title="纯文字控制"
    en-body="Replying 'yes' for approvals is ambiguous. No direct tool-call binding."
    zh-body="靠回复 yes 审批工具调用过于模糊，也没有直接的工具调用绑定。"
  />
</div>

---

# 🦐 <span class="en">What is ClawWork</span><span class="zh">ClawWork 是什么</span>

<div class="en cw-kicker">A desktop client for OpenClaw, <strong>built for parallel work</strong>.</div>
<div class="zh cw-kicker">一个 OpenClaw 桌面客户端，<strong>为并行工作而生</strong>。</div>

<div class="cw-grid-3 cw-mt-32">
  <DeckFeatureCard
    tone="green"
    icon="⚡"
    en-title="Multi-Session"
    zh-title="多会话"
    en-body="Multiple Agent conversations running simultaneously. No more waiting."
    zh-body="多个 Agent 对话同时运行，不再排队等待。"
  />
  <DeckFeatureCard
    tone="cyan"
    icon="🎯"
    en-title="Parallel Tasks"
    zh-title="并行任务"
    en-body="Each task is an independent session. Isolated context, tracked progress."
    zh-body="每个任务是独立会话。隔离上下文，追踪进度。"
  />
  <DeckFeatureCard
    tone="purple"
    icon="📦"
    en-title="File Management"
    zh-title="文件管理"
    en-body="Every Agent output is automatically collected, browsable, and searchable."
    zh-body="所有 Agent 产出自动收集，可浏览，可搜索。"
  />
</div>

<div class="cw-badge-row">
  <span class="cw-badge" data-tone="cyan"><span class="en">ZERO SERVER CHANGES</span><span class="zh">零服务端改动</span></span>
  <span class="en cw-badge-copy">Connects via standard Gateway protocol</span>
  <span class="zh cw-badge-copy">通过标准 Gateway 协议连接</span>
</div>

---

# 🚀 <span class="en">Launch Sprint</span><span class="zh">启动冲刺</span>

<div class="en cw-kicker">10 Releases in 12 Days</div>
<div class="zh cw-kicker">12 天发布 10 个版本</div>

<div class="cw-version-grid cw-mt-24">
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.1</div>
    <div class="en cw-version-desc">Multi-task + streaming</div>
    <div class="zh cw-version-desc">多任务 + 流式</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.2</div>
    <div class="en cw-version-desc">Image + archive + CI</div>
    <div class="zh cw-version-desc">图片 + 归档 + CI</div>
  </div>
  <div class="cw-version-card" data-tone="green">
    <div class="cw-version-num">v0.0.3</div>
    <div class="en cw-version-desc">Agent switch + multi-GW</div>
    <div class="zh cw-version-desc">Agent 切换 + 多网关</div>
  </div>
  <div class="cw-version-card" data-tone="cyan">
    <div class="cw-version-num">v0.0.4</div>
    <div class="en cw-version-desc">Voice + shortcuts</div>
    <div class="zh cw-version-desc">语音 + 快捷键</div>
  </div>
  <div class="cw-version-card" data-tone="cyan">
    <div class="cw-version-num">v0.0.5</div>
    <div class="en cw-version-desc">Mic permission fix</div>
    <div class="zh cw-version-desc">麦克风修复</div>
  </div>
  <div class="cw-version-card" data-tone="purple">
    <div class="cw-version-num">v0.0.6</div>
    <div class="en cw-version-desc">Tray + tool approval</div>
    <div class="zh cw-version-desc">托盘 + 工具审批</div>
  </div>
  <div class="cw-version-card" data-tone="purple">
    <div class="cw-version-num">v0.0.7</div>
    <div class="en cw-version-desc">@ context + usage</div>
    <div class="zh cw-version-desc">文件上下文 + 用量</div>
  </div>
  <div class="cw-version-card" data-tone="yellow">
    <div class="cw-version-num">v0.0.8</div>
    <div class="en cw-version-desc">Resize + FTS + auth</div>
    <div class="zh cw-version-desc">拖拽 + 搜索 + 配对码</div>
  </div>
  <div class="cw-version-card" data-tone="red">
    <div class="cw-version-num">v0.0.9</div>
    <div class="en cw-version-desc">9 security fixes</div>
    <div class="zh cw-version-desc">9 项安全修复</div>
  </div>
  <div class="cw-version-card cw-version-card--latest" data-tone="green">
    <div class="cw-version-num">v0.0.10</div>
    <div class="en cw-version-desc">Auto-update + export</div>
    <div class="zh cw-version-desc">自动更新 + 导出</div>
  </div>
</div>

---

# 🏗 <span class="en">Architecture at a Glance</span><span class="zh">架构概览</span>

<div class="en cw-kicker">Single WebSocket, <strong>Multiple Gateways, Parallel Sessions</strong></div>
<div class="zh cw-kicker">单 WebSocket，<strong>多 Gateway，并行会话</strong></div>

<DeckSplit margin-class="cw-mt-16">
  <template #left>
    <img src="/images/architecture.svg" class="cw-shot cw-shot--panel" alt="ClawWork Architecture" />
  </template>
  <template #right>
    <DeckArchitectureAside />
  </template>
</DeckSplit>

---

# 🖥 <span class="en">Three-Panel Layout</span><span class="zh">三栏布局</span>

<div class="en cw-kicker">Left, Center, Right. Everything visible at once.</div>
<div class="zh cw-kicker">左、中、右。一目了然。</div>

<DeckSplit margin-class="cw-mt-16">
  <template #left>
    <img src="/images/three-panel-full.png" class="cw-shot cw-shot--panel" alt="ClawWork three-panel layout" />
  </template>
  <template #right>
    <DeckThreePanelAside />
  </template>
</DeckSplit>

---

# ⚡ <span class="en">Multi-Session in Action</span><span class="zh">多会话实战</span>

<div class="en cw-kicker">Three tasks running in parallel. Each with isolated context.</div>
<div class="zh cw-kicker">三个任务并行运行。各自独立上下文。</div>

<DeckSplit margin-class="cw-mt-16">
  <template #left>
    <img src="/images/multi-session-parallel.png" class="cw-shot cw-shot--panel" alt="Three tasks running in parallel" />
  </template>
  <template #right>
    <DeckMultiSessionAside />
  </template>
</DeckSplit>

---

# 📂 <span class="en">File Management</span><span class="zh">文件管理</span>

<div class="en cw-kicker">Every file the Agent produces, automatically collected.</div>
<div class="zh cw-kicker">Agent 产出的每一个文件，自动收集。</div>

<div class="cw-split cw-split--media cw-mt-24">
  <div class="cw-stack-md">
    <h3 class="en cw-panel-title cw-tone-green">File Browser</h3>
    <h3 class="zh cw-panel-title cw-tone-green">文件浏览器</h3>
    <img src="/images/file-browser.png" class="cw-shot cw-shot--browser" alt="Artifact file browser" />
  </div>

  <div class="cw-stack-md">
    <h3 class="en cw-panel-title cw-tone-green">Features</h3>
    <h3 class="zh cw-panel-title cw-tone-green">功能特性</h3>
    <ul class="en cw-bullets">
      <li>Grid layout with type badges</li>
      <li>Filter by task, sort by date, name, or type</li>
      <li>Full-text search with highlighted snippets</li>
      <li>Each artifact links back to its source message</li>
      <li>Per-task artifact list in the right panel</li>
    </ul>
    <ul class="zh cw-bullets">
      <li>网格布局与类型徽章</li>
      <li>按任务筛选，按日期、名称或类型排序</li>
      <li>全文搜索与高亮片段</li>
      <li>每个产物都能回链到源消息</li>
      <li>右侧面板显示任务产物列表</li>
    </ul>
    <div class="cw-note-panel" data-tone="green">
      <p class="en cw-note-copy"><strong>No copy-paste.</strong> No more wondering where the file went. It is all here.</p>
      <p class="zh cw-note-copy"><strong>告别复制粘贴。</strong> 不再纠结文件到底去哪了。它都在这里。</p>
    </div>
  </div>
</div>

---

# 📊 <span class="en">Task Progress Tracking</span><span class="zh">任务进度追踪</span>

<DeckTaskProgressSlide />

---

# 🧠 <span class="en">Token & Context Awareness</span><span class="zh">Token 与上下文感知</span>

<div class="en cw-kicker">You always know how much runway you have.</div>
<div class="zh cw-kicker">你始终知道还剩多少空间。</div>

<DeckTokenAwarenessSlide />

---

# 🧩 <span class="en">Feature Matrix</span><span class="zh">功能大全</span>

<div class="en cw-kicker">20 capabilities beyond chat. All shipped.</div>
<div class="zh cw-kicker">20 项超越聊天的能力，全部已发布。</div>

<DeckFeatureMatrixSlide />

---

# 🔧 <span class="en">Tech Stack</span><span class="zh">技术栈</span>

<DeckTechStackSlide />

---

# ⚠️ <span class="en">Lessons from Gateway Integration</span><span class="zh">Gateway 集成踩坑记</span>

<div class="en cw-kicker">Things we learned the hard way, so you do not have to.</div>
<div class="zh cw-kicker">我们踩过的坑，帮你提前避开。</div>

<div class="cw-alert-grid cw-mt-16">
  <div class="cw-alert-col">
    <div class="cw-alert-row" data-tone="red">
      <div class="cw-alert-icon">⚠</div>
      <p class="en cw-alert-copy"><strong>Gateway broadcasts all events.</strong> The client must filter by sessionKey.</p>
      <p class="zh cw-alert-copy"><strong>Gateway 广播所有事件。</strong> 客户端必须按 sessionKey 过滤。</p>
    </div>
    <div class="cw-alert-row" data-tone="yellow">
      <div class="cw-alert-icon">⚠</div>
      <p class="en cw-alert-copy">Streaming content may <strong>differ from history</strong> in whitespace and encoding.</p>
      <p class="zh cw-alert-copy">流式内容可能在空白与编码上与<strong>历史记录不一致</strong>。</p>
    </div>
    <div class="cw-alert-row" data-tone="green">
      <div class="cw-alert-icon">💡</div>
      <p class="en cw-alert-copy"><strong>Single-writer</strong> architecture is not optional for reliable persistence.</p>
      <p class="zh cw-alert-copy"><strong>单写者</strong>架构对可靠持久化不是可选项。</p>
    </div>
  </div>

  <div class="cw-alert-col">
    <div class="cw-alert-row" data-tone="yellow">
      <div class="cw-alert-icon">⚠</div>
      <p class="en cw-alert-copy"><code>chat.history</code> has <strong>no per-message ID</strong>. Timestamps are the closest stable identifier.</p>
      <p class="zh cw-alert-copy"><code>chat.history</code> <strong>没有逐条消息 ID</strong>。时间戳是最接近的稳定标识。</p>
    </div>
    <div class="cw-alert-row" data-tone="green">
      <div class="cw-alert-icon">💡</div>
      <p class="en cw-alert-copy"><code>deliver: false</code> is essential. Otherwise messages leak into external channels.</p>
      <p class="zh cw-alert-copy"><code>deliver: false</code> 是必须的。否则消息会泄露到外部渠道。</p>
    </div>
  </div>
</div>

<p class="en cw-footnote">Real issues. Some already have open GitHub issues. Happy to discuss after.</p>
<p class="zh cw-footnote">都是真实问题，部分已经有 GitHub issue。会后可以继续聊。</p>

---

# 🔄 <span class="en">Dev Workflow</span><span class="zh">开发工作流</span>

<div class="en cw-kicker">Vibe Coding: requirement → parallel worktrees → auto review → ship.</div>
<div class="zh cw-kicker">Vibe Coding：需求 → 并行 worktree → 自动 review → 发版。</div>

<DeckDevWorkflowSlide />

---

# 🛡 <span class="en">Engineering Quality</span><span class="zh">工程质量体系</span>

<div class="en cw-kicker">Solo developer, <strong>production-grade guardrails</strong>.</div>
<div class="zh cw-kicker">一个人开发，<strong>生产级护栏</strong>。</div>

<DeckQualityGatesSlide />

---

# 🤝 <span class="en">Open Source Collaboration</span><span class="zh">开源协作</span>

<div class="en cw-kicker">From first clone to merged PR.</div>
<div class="zh cw-kicker">从 clone 到 PR 合并。</div>

<DeckOpenSourceSlide />

---

# 📈 <span class="en">Sprint Breakdown</span><span class="zh">冲刺全景</span>

<div class="en cw-kicker">14 Days · 139 PRs · 1.2B Tokens</div>
<div class="zh cw-kicker">14 天 · 139 个 PR · 1.2B Token</div>

<DeckVibeCodingSlide />

---

# ⭐ <span class="en">Community Signal</span><span class="zh">社区信号</span>

<div class="cw-grid-2">
  <DeckSignalCard
    tone="yellow"
    en-title="GitHub Star Notification"
    zh-title="GitHub Star 通知"
    en-note="The person who built OpenClaw thinks this project is worth watching."
    zh-note="OpenClaw 的作者认为这个项目值得关注。"
  >
    <img src="/images/peter-github-star.png" class="cw-shot cw-shot--signal" alt="Peter starred ClawWork on GitHub" />
  </DeckSignalCard>

  <DeckSignalCard tone="green" en-title="Star History">
    <img src="https://api.star-history.com/svg?repos=clawwork-ai/ClawWork&type=Date" class="cw-shot cw-shot--signal-full" alt="Star History Chart" />
  </DeckSignalCard>
</div>

---

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-100px; left:30%;"></div>
<div class="glow-orb glow-purple cw-pulse" style="bottom:-80px; right:20%;"></div>

<div class="cw-thanks-shell">
  <div class="cw-mb-32">
    <img src="/images/clawwork-logo.png" class="cw-logo-md cw-float cw-logo-glow" alt="ClawWork" />
  </div>

  <h1 class="cw-display-title">
    <span class="en cw-shimmer">Thanks!</span>
    <span class="zh cw-shimmer">谢谢！</span>
  </h1>

  <p class="en cw-thanks-copy">Questions, ideas, or PRs. All welcome.</p>
  <p class="zh cw-thanks-copy">问题、想法、PR。都欢迎。</p>

  <div class="cw-final-links">
    <a href="https://github.com/clawwork-ai/ClawWork" target="_blank" class="cw-final-link">
      <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
      clawwork-ai/ClawWork
    </a>
    <a href="https://github.com/samzong" target="_blank" class="cw-final-link cw-final-link--muted">
      @samzong
    </a>
  </div>

  <div class="cw-final-note">
    <span class="en">Apache 2.0 · macOS &amp; Windows · Built with OpenClaw</span>
    <span class="zh">Apache 2.0 · macOS &amp; Windows · 基于 OpenClaw 构建</span>
  </div>
</div>
