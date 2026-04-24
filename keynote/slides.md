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
colorSchema: all
drawings:
  persist: false
transition: slide-left
favicon: /images/clawwork-logo.png
exportFilename: clawwork-keynote
---

<DeckCoverSlide />

---

# 👋 {{ $t({ en: 'About Me', zh: '关于我' }) }}

<DeckAboutMeSlide />

---

<div class="cw-grid"></div>
<div class="glow-orb glow-purple cw-pulse" style="top:-80px; right:30%;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="bottom:-60px; left:25%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'Why?', zh: '为什么？' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'The problem with the current workflow.', zh: '当前工作流的问题。' }) }}</p>
</div>

---

# 😤 {{ $t({ en: 'Pain Points of Using OpenClaw', zh: '养虾的痛点' }) }}

<div class="cw-kicker">{{ $t({ en: '"One window, one task, one context."', zh: '"一个窗口，一个任务，一个上下文。"' }) }}</div>

<div class="grid grid-cols-2 gap-2">
  <DeckFeatureCard
    compact
    tone="red"
    icon="🔗"
    :title="{ en: 'Serial Interaction', zh: '串行交互' }"
    :body="{ en: 'Agent is powerful, but forces one task at a time. Real work is parallel.', zh: 'Agent 很强大，但一次只能做一件事。真实工作是并行的。' }"
  />
  <DeckFeatureCard
    compact
    tone="red"
    icon="📂"
    :title="{ en: 'Scattered Artifacts', zh: '产物散落' }"
    :body="{ en: 'Code, files, docs scatter across conversations. Copy-paste to collect.', zh: '代码、文件、文档散落在各个对话中，靠复制粘贴收集。' }"
  />
  <DeckFeatureCard
    compact
    tone="red"
    icon="🔄"
    :title="{ en: 'Context Switching', zh: '上下文切换' }"
    :body="{ en: 'Switching tabs to check status breaks flow. No structured progress tracking.', zh: '切换标签页查看状态会打断心流，没有结构化的进度追踪。' }"
  />
  <DeckFeatureCard
    compact
    tone="red"
    icon="💬"
    :title="{ en: 'Text-Only Control', zh: '纯文字控制' }"
    :body="{ en: 'Replying \'yes\' for approvals is ambiguous. No direct tool-call binding.', zh: '靠回复 yes 审批工具调用过于模糊，也没有直接的工具调用绑定。' }"
  />
</div>

---

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-80px; right:20%;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="bottom:-60px; left:35%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'The Answer', zh: '答案' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'Meet ClawWork.', zh: 'ClawWork 登场。' }) }}</p>
</div>

---

# 🦐 {{ $t({ en: 'What is ClawWork', zh: 'ClawWork 是什么' }) }}

<div class="cw-kicker" v-html="$t({ en: 'A desktop client for OpenClaw, <strong>built for parallel work</strong>.', zh: '一个 OpenClaw 桌面客户端，<strong>为并行工作而生</strong>。' })"></div>

<div class="grid grid-cols-3 gap-6 mt-8">
  <DeckFeatureCard
    tone="green"
    icon="⚡"
    :title="{ en: 'Multi-Session', zh: '多会话' }"
    :body="{ en: 'Multiple Agent conversations running simultaneously. No more waiting.', zh: '多个 Agent 对话同时运行，不再排队等待。' }"
  />
  <DeckFeatureCard
    tone="cyan"
    icon="🎯"
    :title="{ en: 'Parallel Tasks', zh: '并行任务' }"
    :body="{ en: 'Each task is an independent session. Isolated context, tracked progress.', zh: '每个任务是独立会话。隔离上下文，追踪进度。' }"
  />
  <DeckFeatureCard
    tone="purple"
    icon="📦"
    :title="{ en: 'File Management', zh: '文件管理' }"
    :body="{ en: 'Every Agent output is automatically collected, browsable, and searchable.', zh: '所有 Agent 产出自动收集，可浏览，可搜索。' }"
  />
</div>

<div class="cw-badge-row">
  <span class="cw-badge" data-tone="cyan">{{ $t({ en: 'ZERO SERVER CHANGES', zh: '零服务端改动' }) }}</span>
  <span class="cw-badge-copy">{{ $t({ en: 'Connects via standard Gateway protocol', zh: '通过标准 Gateway 协议连接' }) }}</span>
</div>

---

# 🖥 {{ $t({ en: 'Overview', zh: '一览' }) }}

<div class="cw-kicker">{{ $t({ en: 'All three pillars in one workbench.', zh: '三大支柱，一个工作台。' }) }}</div>

<div style="display: flex; justify-content: center; margin-top: 16px;">
  <img src="/images/clawwork-screenshot.png" class="cw-shot cw-shot--hero" alt="ClawWork overview" />
</div>

---

<div class="cw-grid"></div>
<div class="glow-orb glow-cyan cw-pulse" style="top:-80px; left:35%;"></div>
<div class="glow-orb glow-purple cw-pulse" style="bottom:-60px; right:20%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'Product Tour', zh: '产品之旅' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'What it looks like inside.', zh: '看看里面长什么样。' }) }}</p>
</div>

---

# 🧩 {{ $t({ en: 'Feature Matrix', zh: '功能大全' }) }}

<div class="cw-kicker">{{ $t({ en: 'Everything that has shipped. At a glance.', zh: '已经发布的一切。一目了然。' }) }}</div>

<DeckFeatureMatrixSlide />

---
layout: split-media
---

# 🖥 {{ $t({ en: 'Three-Panel Layout', zh: '三栏布局' }) }}

<div class="cw-kicker">{{ $t({ en: 'Left, Center, Right. Everything visible at once.', zh: '左、中、右。一目了然。' }) }}</div>

::left::

<img src="/images/three-panel-full.png" class="cw-shot cw-shot--panel" alt="ClawWork three-panel layout" />

::right::

<DeckMiniPanel neutral tone="green" :title="{ en: 'Left Nav', zh: '左侧导航' }" :body="{ en: 'Task list, gateway selector, cron jobs.', zh: '任务列表、网关选择、定时任务。' }" />

<DeckMiniPanel neutral tone="cyan" :title="{ en: 'Center', zh: '中央面板' }" :body="{ en: 'Chat with streaming, tool cards, approval prompts.', zh: '流式聊天、工具卡片、审批提示。' }" />

<DeckMiniPanel neutral tone="purple" :title="{ en: 'Right Panel', zh: '右侧面板' }" :body="{ en: 'Progress tracking and artifact browser.', zh: '进度追踪和产物浏览。' }" />

---
layout: split-media
---

# ⌨️ {{ $t({ en: 'Quick Launch', zh: '快捷启动器' }) }}

<div class="cw-kicker">{{ $t({ en: 'Alt+Space. Type. Done. Never open the main window.', zh: 'Alt+Space 呼出，输入，完成。无需打开主窗口。' }) }}</div>

::left::

<div class="cw-nest" data-tone="purple" style="padding: 18px;">
  <div class="cw-nest-label" style="font-size: 13px; margin-bottom: 14px; opacity: 0.8;">⌨️ Alt + Space · 680 × 72</div>
  <div style="background: rgba(0,0,0,0.55); border-radius: 10px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; border: 1px solid rgba(139, 92, 246, 0.45); box-shadow: 0 8px 32px rgba(139, 92, 246, 0.15);">
    <span style="color: rgba(139, 92, 246, 0.9); font-size: 20px;">⌨</span>
    <span style="color: rgba(255,255,255,0.55); font-family: monospace; font-size: 14px;">What's on your mind?</span>
  </div>
  <div class="cw-nest-items" style="margin-top: 14px; justify-content: flex-end;">
    <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="green"></span>Enter to start</span>
    <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="yellow"></span>Esc to dismiss</span>
  </div>
</div>

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<strong>Global shortcut</strong>: <code>Alt+Space</code> by default, fully configurable', zh: '<strong>全局快捷键</strong>：默认 <code>Alt+Space</code>，完全可配置' })"></li>
  <li v-html="$t({ en: '<strong>Spotlight-style overlay</strong>: 680 × 72, frameless, transparent, always on top', zh: '<strong>Spotlight 风格浮窗</strong>：680 × 72，无边框、透明、始终置顶' })"></li>
  <li v-html="$t({ en: '<strong>Cross-workspace</strong>: visible on every virtual desktop, even in fullscreen apps', zh: '<strong>跨虚拟桌面</strong>：在所有虚拟桌面可见，包括全屏应用' })"></li>
  <li v-html="$t({ en: '<strong>Blur to dismiss</strong>: loses focus → hides automatically, no clutter', zh: '<strong>失焦即隐藏</strong>：丢失焦点自动隐藏，不留痕迹' })"></li>
</ul>

<div class="cw-note-panel mt-4" data-tone="purple">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>The minimum distance between idea and task.</strong>', zh: '<strong>想法与任务之间的最短距离。</strong>' })"></p>
</div>

---
layout: split-media
---

# ⚡ {{ $t({ en: 'Multi-Session in Action', zh: '多会话实战' }) }}

<div class="cw-kicker">{{ $t({ en: 'Three tasks running in parallel. Each with isolated context.', zh: '三个任务并行运行。各自独立上下文。' }) }}</div>

::left::

<img src="/images/multi-session-parallel.png" class="cw-shot cw-shot--panel" alt="Three tasks running in parallel" />

::right::

<DeckMiniStatRow tone="green" :text="{ en: 'Status badges: running, idle, done', zh: '状态徽章：运行中、空闲、完成' }" />
<DeckMiniStatRow tone="cyan" :text="{ en: 'Animated spinners for active sessions', zh: '活跃会话的动画指示器' }" />
<DeckMiniStatRow tone="purple" :text="{ en: 'Unread indicators per task', zh: '每个任务的未读提示' }" />
<DeckMiniStatRow tone="yellow" :text="{ en: 'Relative timestamps', zh: '相对时间戳' }" />

---

# 📂 {{ $t({ en: 'File Management', zh: '文件管理' }) }}

<div class="cw-kicker">{{ $t({ en: 'Every file the Agent produces, automatically collected.', zh: 'Agent 产出的每一个文件，自动收集。' }) }}</div>

<div class="cw-split--media mt-6">
  <div class="flex flex-col gap-3">
    <h3 class="cw-panel-title cw-tone-green">{{ $t({ en: 'File Browser', zh: '文件浏览器' }) }}</h3>
    <img src="/images/file-browser.png" class="cw-shot cw-shot--browser" alt="Artifact file browser" />
  </div>

  <div class="flex flex-col gap-3">
    <h3 class="cw-panel-title cw-tone-green">{{ $t({ en: 'Features', zh: '功能特性' }) }}</h3>
    <ul class="cw-bullets">
      <li>{{ $t({ en: 'Grid layout with type badges', zh: '网格布局与类型徽章' }) }}</li>
      <li>{{ $t({ en: 'Filter by task, sort by date, name, or type', zh: '按任务筛选，按日期、名称或类型排序' }) }}</li>
      <li>{{ $t({ en: 'Full-text search with highlighted snippets', zh: '全文搜索与高亮片段' }) }}</li>
      <li>{{ $t({ en: 'Each artifact links back to its source message', zh: '每个产物都能回链到源消息' }) }}</li>
      <li>{{ $t({ en: 'Per-task artifact list in the right panel', zh: '右侧面板显示任务产物列表' }) }}</li>
    </ul>
    <div class="cw-note-panel" data-tone="green">
      <p class="cw-note-copy" v-html="$t({ en: '<strong>No copy-paste.</strong> No more wondering where the file went. It is all here.', zh: '<strong>告别复制粘贴。</strong> 不再纠结文件到底去哪了。它都在这里。' })"></p>
    </div>
  </div>
</div>

---

# 📊 {{ $t({ en: 'Task Progress Tracking', zh: '任务进度追踪' }) }}

<DeckTaskProgressSlide />

---
layout: split-media
gap: mt-6
---

# 🧠 {{ $t({ en: 'Token & Context Awareness', zh: 'Token 与上下文感知' }) }}

<div class="cw-kicker">{{ $t({ en: 'You always know how much runway you have.', zh: '你始终知道还剩多少空间。' }) }}</div>

::left::

<img src="/images/token-usage.png" class="cw-shot cw-shot--browser" alt="Token usage dashboard" />

::right::

<ul class="cw-bullets">
  <li>{{ $t({ en: 'Chat header shows real-time token counts for input and output', zh: '聊天头部实时显示输入与输出 Token 计数' }) }}</li>
  <li>{{ $t({ en: 'Context usage bar with color thresholds', zh: '上下文用量条带颜色阈值' }) }}</li>
  <li>{{ $t({ en: 'Cost displayed in real currency, not abstract credits', zh: '费用以真实货币显示，而非抽象积分' }) }}</li>
  <li>{{ $t({ en: 'Rate limit status with progress bars', zh: '速率限制状态配合进度条展示' }) }}</li>
  <li>{{ $t({ en: 'Expandable thinking process viewer', zh: '可展开的思考过程查看器' }) }}</li>
</ul>

<div class="cw-note-panel" data-tone="green">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>Transparency is not a feature.</strong> It is respect for the user.', zh: '<strong>透明不是功能。</strong> 它是对用户的尊重。' })"></p>
</div>

---
layout: split-media
---

# ⏰ {{ $t({ en: 'Scheduled Tasks', zh: '定时任务' }) }}

<div class="cw-kicker">{{ $t({ en: 'Cron for agents. Schedule, run, review.', zh: 'Agent 的 Cron。定时、执行、复盘。' }) }}</div>

::left::

<img src="/images/cron-panel.png" class="cw-shot cw-shot--panel" alt="Cron panel with scheduled jobs" />

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<strong>Standard cron syntax</strong> with sortable next-run column', zh: '<strong>标准 cron 语法</strong>，按下次运行时间排序' })"></li>
  <li v-html="$t({ en: '<strong>Run history</strong>: success, failure, duration at a glance', zh: '<strong>运行历史</strong>：成功、失败、耗时一目了然' })"></li>
  <li v-html="$t({ en: '<strong>Manual trigger</strong> for any job — useful for testing', zh: '<strong>手动触发</strong>任意任务 —— 调试时超方便' })"></li>
  <li v-html="$t({ en: '<strong>Filters and pagination</strong> — 20 jobs per page, stays fast', zh: '<strong>过滤与分页</strong> —— 每页 20 条，永远流畅' })"></li>
</ul>

<div class="cw-note-panel mt-4" data-tone="cyan">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>Your agents do not sleep.</strong> Let them work on a schedule.', zh: '<strong>你的 Agent 不会睡觉。</strong>让它们按时上班。' })"></p>
</div>

---

# 📈 {{ $t({ en: 'Usage Dashboard', zh: '用量看板' }) }}

<div class="cw-kicker">{{ $t({ en: '30-day trends. Cost, tokens, tasks, agents — all in one place.', zh: '30 天趋势。费用、Token、任务、Agent — 一个页面看完。' }) }}</div>

<div style="display: flex; justify-content: center; margin-top: 12px;">
  <img src="/images/dashboard.png" class="cw-shot cw-shot--hero" alt="Usage dashboard with 30-day trends" />
</div>

<div class="cw-badge-row">
  <span class="cw-badge" data-tone="green">{{ $t({ en: 'RECHARTS', zh: 'RECHARTS' }) }}</span>
  <span class="cw-badge" data-tone="cyan">{{ $t({ en: '60s CACHE', zh: '60s 缓存' }) }}</span>
  <span class="cw-badge-copy">{{ $t({ en: 'Multi-dim slicing: model · agent · task · day', zh: '多维切片：模型 · Agent · 任务 · 日期' }) }}</span>
</div>

---
layout: split-media
---

# 🛡 {{ $t({ en: 'Tool Approval', zh: '工具审批' }) }}

<div class="cw-kicker">{{ $t({ en: 'Explicit consent. Risk-aware. Remembers your policy.', zh: '明确授权。风险感知。记住你的策略。' }) }}</div>

::left::

<img src="/images/approval-dialog.png" class="cw-shot cw-shot--panel" alt="Tool approval dialog with risk badge" />

::right::

<DeckMiniPanel tone="green" :title="{ en: 'Risk Tiers', zh: '风险分级' }" :body="{ en: 'full / allowlist / medium badges. Destructive actions stand out.', zh: 'full / allowlist / medium 徽章。破坏性操作一眼识别。' }" />

<DeckMiniPanel tone="yellow" :title="{ en: '120s Countdown', zh: '120 秒倒计时' }" :body="{ en: 'Progress bar, then auto-deny. No ambiguous timeouts.', zh: '进度条倒计时，到时自动拒绝。不存在模糊超时。' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Policy Memory', zh: '策略记忆' }" :body="{ en: 'Allow once vs allow always. Per tool, per project.', zh: 'Allow once 与 Allow always。按工具、按项目记住。' }" />

---
layout: split-media
---

# ⚡ {{ $t({ en: 'Slash Commands', zh: '斜杠命令' }) }}

<div class="cw-kicker">{{ $t({ en: 'Type a slash. Keyboard-first. Categorized by source.', zh: '输入斜杠。键盘优先。按来源分类。' }) }}</div>

::left::

<div style="position: relative; width: 100%; height: 400px;">
  <img src="/images/slash-command.png" style="position: absolute; top: 18px; left: 0; height: 320px; width: auto; max-width: 62%; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 1;" alt="ClawWork chat with slash menu" />
  <img src="/images/slash-command-2.png" style="position: absolute; top: 50px; left: 31%; height: 308px; width: auto; max-width: 58%; border-radius: 10px; box-shadow: 0 18px 44px rgba(0,0,0,0.7); z-index: 2;" alt="Slash commands modal dialog" />
</div>

::right::

<DeckMiniPanel compact tone="cyan" :title="{ en: 'Source Badges', zh: '来源徽章' }" :body="{ en: 'native · skill · plugin — color-coded by source.', zh: 'native · skill · plugin —— 按来源颜色区分。' }" />

<DeckMiniPanel compact tone="green" :title="{ en: 'Grouped Categories', zh: '分组显示' }" :body="{ en: 'session, tools, docks, workflow — scan by group.', zh: 'session、tools、docks、workflow —— 按组浏览。' }" />

<DeckMiniPanel compact tone="purple" :title="{ en: 'Keyboard Navigation', zh: '键盘导航' }" :body="{ en: 'Arrows to select, Enter to run. Mouse optional.', zh: '方向键选择，Enter 执行。鼠标可选。' }" />

<DeckMiniPanel compact tone="yellow" :title="{ en: 'Fuzzy Search', zh: '模糊搜索' }" :body="{ en: 'Type a few chars, instant narrow. No prefix required.', zh: '敲几个字，即刻缩小范围。无需前缀匹配。' }" />

---
layout: split-media
---

# 🧰 {{ $t({ en: 'Tool Call Cards', zh: '工具调用卡片' }) }}

<div class="cw-kicker">{{ $t({ en: 'Every tool call is a structured card. Readable, expandable, traceable.', zh: '每次工具调用都是一张结构化卡片。可读、可展开、可追溯。' }) }}</div>

::left::

<img src="/images/tool-call-card.png" class="cw-shot cw-shot--panel" alt="Tool call card with expanded args and result" />

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<strong>Tool family borders</strong>: file · shell · search · web — at-a-glance color', zh: '<strong>工具家族色边</strong>：file · shell · search · web —— 一眼分辨' })"></li>
  <li v-html="$t({ en: '<strong>Expandable args and result</strong>: collapsed by default, details on demand', zh: '<strong>可展开的参数与结果</strong>：默认折叠,按需展开' })"></li>
  <li v-html="$t({ en: '<strong>State machine</strong>: running → success / error, with duration', zh: '<strong>状态机</strong>：running → success / error，附耗时' })"></li>
  <li v-html="$t({ en: '<strong>Never a wall of JSON</strong>: diffs for edits, trees for files', zh: '<strong>告别 JSON 大墙</strong>：编辑显示 diff，文件显示树' })"></li>
</ul>

---
layout: split-media
---

# 🔗 {{ $t({ en: '@Mentions', zh: '@ 引用' }) }}

<div class="cw-kicker">{{ $t({ en: 'Reference anything in the workspace. Four tabs, one picker.', zh: '引用工作区里的一切。四个 Tab，一个选择器。' }) }}</div>

::left::

<img src="/images/mention-picker.gif" class="cw-shot cw-shot--panel" alt="Mention picker with four tabs" />

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<strong>Four tabs</strong>: agents · local files · tasks · artifacts', zh: '<strong>四个 Tab</strong>：agents · 本地文件 · tasks · 产物' })"></li>
  <li v-html="$t({ en: '<strong>@All</strong>: a special agent that summons every team member', zh: '<strong>@All</strong>：特殊 Agent，召集团队所有成员' })"></li>
  <li v-html="$t({ en: '<strong>Cross-task references</strong>: pull artifacts from any task into this conversation', zh: '<strong>跨任务引用</strong>：把任意任务的产物拉进当前对话' })"></li>
  <li v-html="$t({ en: '<strong>Real-time search</strong>: types narrow instantly, no server round-trip', zh: '<strong>实时搜索</strong>：输入即刻缩小，无需服务端往返' })"></li>
</ul>

---
layout: split-media
---

# 🧩 {{ $t({ en: 'Skills & ClawHub', zh: 'Skills 与 ClawHub' }) }}

<div class="cw-kicker">{{ $t({ en: 'Atomic capabilities. Discover, install, configure.', zh: '原子能力。发现、安装、配置。' }) }}</div>

::left::

<img src="/images/skills.png" class="cw-shot cw-shot--panel" alt="Skills settings" />

::right::

<DeckMiniPanel tone="green" :title="{ en: 'Skill', zh: 'Skill' }" :body="{ en: 'Reusable capability fragment. Extends what an Agent can do.', zh: '可复用的能力片段。扩展 Agent 的工具箱。' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'ClawHub', zh: 'ClawHub' }" :body="{ en: 'An app store for agent skills. One click adds the capability.', zh: 'Agent 能力的应用商店。一键添加新技能。' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Schema-Driven', zh: 'Schema 驱动' }" :body="{ en: 'Skills self-describe their config. The UI generates the form.', zh: 'Skill 自描述配置，UI 自动生成表单。' }" />

---
layout: split-media
---

# 🤖 {{ $t({ en: 'Agent Manager', zh: 'Agent 管理' }) }}

<div class="cw-kicker">{{ $t({ en: 'All your agents in one place. Edit anything in-app.', zh: '所有 Agent 一处管理。所有配置产品内编辑。' }) }}</div>

::left::

<img src="/images/agents-list.png" class="cw-shot cw-shot--panel" alt="Agents list" />

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<strong>One panel</strong>: every Agent, every Skill, every status', zh: '<strong>一个面板</strong>：所有 Agent、所有 Skill、所有状态' })"></li>
  <li v-html="$t({ en: '<strong>Inline file editor</strong>: edit <code>AGENTS.md</code> and skill configs without leaving the app', zh: '<strong>内联文件编辑器</strong>：无需离开产品就能编辑 <code>AGENTS.md</code> 和 Skill 配置' })"></li>
  <li v-html="$t({ en: '<strong>Custom avatars</strong> via <code>clawwork-avatar://</code> protocol', zh: '<strong>自定义头像</strong>，走 <code>clawwork-avatar://</code> 协议' })"></li>
  <li v-html="$t({ en: '<strong>Skills status</strong>: see at a glance which skills are enabled per Agent', zh: '<strong>Skill 状态</strong>：一眼看清每个 Agent 启用了哪些 Skill' })"></li>
</ul>

---
layout: split-media
---

# 🧙 {{ $t({ en: 'Agent Builder', zh: 'Agent 构建器' }) }}

<div class="cw-kicker">{{ $t({ en: 'Talk your way to a new Agent.', zh: '对话即可创建新 Agent。' }) }}</div>

::left::

<img src="/images/agent-builder.png" class="cw-shot cw-shot--panel" alt="Agent Builder dialog" />

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<strong>Describe</strong> what the Agent should do — natural language', zh: '<strong>描述</strong> Agent 应该做什么 —— 自然语言' })"></li>
  <li v-html="$t({ en: '<strong>ClawWork drafts</strong> the <code>AGENT.md</code>, picks Skills, sets the model', zh: '<strong>ClawWork 起草</strong> <code>AGENT.md</code>，选择 Skill，设定模型' })"></li>
  <li v-html="$t({ en: '<strong>Tweak inline</strong> before saving — every field is editable', zh: '<strong>保存前内联微调</strong> —— 每个字段都可编辑' })"></li>
  <li v-html="$t({ en: '<strong>Save</strong> — Agent appears in the manager, ready for tasks', zh: '<strong>保存</strong> —— Agent 出现在管理面板，准备接任务' })"></li>
</ul>

---
layout: split-media
---

# 🧬 {{ $t({ en: 'ClawWork Teams', zh: 'ClawWork Teams' }) }}

<div class="cw-kicker" v-html="$t({ en: 'A self-contained multi-agent unit. Roles, skills, workflow — packaged together.', zh: '一个自包含的多 Agent 单元。角色、技能、工作流 —— 打包在一起。' })"></div>

::left::

<img src="/images/team-details.png" class="cw-shot cw-shot--panel" alt="Team details" />

::right::

<ul class="cw-bullets">
  <li v-html="$t({ en: '<code>TEAM.md</code> — team goals and orchestration workflow', zh: '<code>TEAM.md</code> — 团队目标与编排工作流' })"></li>
  <li v-html="$t({ en: '<code>AGENT.md</code> — role, skills, and tools per agent', zh: '<code>AGENT.md</code> — 每个 Agent 的角色、技能与工具' })"></li>
  <li v-html="$t({ en: '<code>SOUL.md</code> — personality and communication style', zh: '<code>SOUL.md</code> — 性格与沟通风格' })"></li>
</ul>

<div class="cw-note-panel mt-4" data-tone="green">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>No manual setup.</strong> ClawWork handles agent creation, skill installation, and model assignment for you.', zh: '<strong>无需手动配置。</strong>ClawWork 替你完成 Agent 创建、Skill 安装和模型分配。' })"></p>
</div>

---
layout: split-media
---

# 🎯 {{ $t({ en: 'Teams in Action', zh: 'Team 实战' }) }}

<div class="cw-kicker">{{ $t({ en: 'From concept to running agents. Every step inside ClawWork.', zh: '从概念到运行。每一步都在 ClawWork 里。' }) }}</div>

::left::

<img src="/images/team-builder.png" class="cw-shot cw-shot--panel" alt="Team Builder wizard" />

::right::

<DeckMiniPanel tone="purple" :title="{ en: 'AI Team Builder', zh: 'AI Team 构建器' }" :body="{ en: 'Natural language → roles, skills, workflow.', zh: '自然语言 → 角色、技能、工作流。' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Inline File Tree', zh: '内联文件树' }" :body="{ en: 'Edit TEAM/AGENT/SOUL.md inside the app.', zh: '在产品内直接编辑 TEAM/AGENT/SOUL.md。' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'Team Chat Room', zh: '团队聊天室' }" :body="{ en: 'Live avatar bar: who speaks, who executes.', zh: '实时头像栏：谁在说话、谁在执行。' }" />

---
layout: split-media
---

# 🏪 {{ $t({ en: 'TeamsHub', zh: 'TeamsHub' }) }}

<div class="cw-kicker">{{ $t({ en: 'Git-native team marketplace.', zh: 'Git 原生团队市场。' }) }}</div>

::left::

<div class="cw-nest" data-tone="cyan">
  <div class="cw-nest-label">🏪 Git → Registry → Install</div>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <div class="cw-nest" data-tone="purple">
      <div class="cw-nest-label">📦 github.com/org/team-pack</div>
    </div>
    <div class="cw-nest" data-tone="cyan">
      <div class="cw-nest-label">🔗 Registry URL</div>
      <div class="cw-nest-items">
        <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="cyan"></span>community</span>
        <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="purple"></span>private</span>
      </div>
    </div>
    <div class="cw-nest" data-tone="green">
      <div class="cw-nest-label">⚡ One-Click Install</div>
    </div>
  </div>
</div>

::right::

<DeckMiniPanel tone="cyan" :title="{ en: 'Git Native', zh: 'Git 原生' }" :body="{ en: 'A Team is a Git repo. Share = push to GitHub. Subscribe = add a registry URL.', zh: 'Team 就是一个 Git 仓库。分享 = push 到 GitHub。订阅 = 添加一个 registry URL。' }" />

<DeckMiniPanel tone="green" :title="{ en: 'One-Click Install', zh: '一键安装' }" :body="{ en: 'Install orchestrator handles agent creation, skill installation, and model binding automatically.', zh: '安装编排器自动处理 Agent 创建、Skill 安装和模型绑定。' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Multi-Source Registries', zh: '多源 Registry' }" :body="{ en: 'Community, private, team. Add as many registries as you want — all Git-based.', zh: '社区、私有、团队。想加多少 registry 就加多少 —— 全部基于 Git。' }" />

---
layout: split-media
---

# 🎭 {{ $t({ en: 'Multi-Session Orchestration', zh: '多 Session 编排' }) }}

<div class="cw-kicker">{{ $t({ en: 'One Conductor. N Performers. Pure session primitives.', zh: '一个 Conductor，N 个 Performer。纯 session 原语编排。' }) }}</div>

::left::

<img src="/images/agents-list.png" class="cw-shot cw-shot--panel" alt="TaskRoom multi-agent orchestration" />

::right::

<DeckMiniPanel tone="purple" :title="{ en: 'Ensemble Task', zh: 'Ensemble Task' }" :body="{ en: '1 Conductor + N Performers. Extends 1 Task = 1 Session to multi-agent.', zh: '1 Conductor + N Performer。把 1 Task = 1 Session 扩展为多 Agent 协作。' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Serial & Parallel', zh: '串行与并行' }" :body="{ en: 'timeout:30 for serial handoff. timeout:0 for parallel fan-out. No external workers.', zh: 'timeout:30 串行交接，timeout:0 并行扇出。无外部 worker。' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'Isolated by Design', zh: '隔离即设计' }" :body="{ en: 'Write isolated by sessionKey. Read aggregated by taskId. @All summons all; live avatar bar shows who is active.', zh: '写入按 sessionKey 隔离，展示按 taskId 聚合。@All 召集全员，实时头像栏显示谁在活动。' }" />

---

# 💻 {{ $t({ en: 'Every Desktop. Native.', zh: '每个桌面，都原生。' }) }}

<div class="cw-kicker">{{ $t({ en: 'macOS, Windows, Linux — shipped as platform-native installers.', zh: 'macOS、Windows、Linux — 各平台原生安装包同步发布。' }) }}</div>

<div class="grid grid-cols-3 gap-4">
  <DeckFeatureCard
    tone="cyan"
    icon="🍎"
    :title="{ en: 'macOS', zh: 'macOS' }"
    :body="{ en: 'Apple Silicon & Intel. Signed, notarized, Dock-native.', zh: 'Apple Silicon 与 Intel 双架构，已签名与公证，原生入驻 Dock。' }"
  />
  <DeckFeatureCard
    tone="purple"
    icon="🪟"
    :title="{ en: 'Windows', zh: 'Windows' }"
    :body="{ en: 'x64 NSIS installer. Per-user install, custom path.', zh: 'x64 NSIS 安装器，支持单用户安装与自定义路径。' }"
  />
  <DeckFeatureCard
    tone="yellow"
    icon="🐧"
    :title="{ en: 'Linux', zh: 'Linux' }"
    :body="{ en: 'AppImage for any distro, deb for Debian & Ubuntu.', zh: 'AppImage 兼容各发行版，deb 面向 Debian 与 Ubuntu。' }"
  />
</div>

---
layout: split-media
---

# 📱 {{ $t({ en: 'ClawWork in Your Pocket', zh: 'ClawWork 装进口袋' }) }}

<div class="cw-kicker">{{ $t({ en: 'Not remote control. A real mobile app.', zh: '不是远程控制，是真正的移动端 App。' }) }}</div>

::left::

<div style="display: flex; justify-content: center; align-items: center; gap: 14px; height: 100%;">
  <img src="/images/screenshot-mobile.png" class="cw-shot cw-shot--hero" style="max-height: 360px;" alt="ClawWork PWA home" />
  <img src="/images/screenshot-mobile-2.png" class="cw-shot cw-shot--hero" style="max-height: 360px;" alt="ClawWork PWA device authorization" />
</div>

::right::

<DeckMiniPanel tone="cyan" :title="{ en: 'Installable', zh: '可安装' }" :body="{ en: 'Standalone mode. No browser UI. OLED dark.', zh: 'Standalone 模式，无浏览器 UI，OLED 深色。' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Offline First', zh: '离线优先' }" :body="{ en: 'Service Worker + IndexedDB. Browse history underground.', zh: 'Service Worker + IndexedDB。地铁里也能看历史。' }" />

<DeckMiniPanel tone="red" :title="{ en: 'Independent Identity', zh: '独立身份' }" :body="{ en: 'Ed25519 via WebCrypto. Private key never leaves the device.', zh: 'WebCrypto 生成 Ed25519。私钥永远不出设备。' }" />

---

<div class="cw-grid"></div>
<div class="glow-orb glow-cyan cw-pulse" style="top:-80px; left:25%;"></div>
<div class="glow-orb glow-green cw-pulse" style="bottom:-60px; right:30%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'Under the Hood', zh: '深入底层' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'How it is built.', zh: '它是怎么构建的。' }) }}</p>
</div>

---
layout: split-media
---

# 🧱 {{ $t({ en: '3-Layer Monorepo', zh: '三层 Monorepo' }) }}

<div class="cw-kicker" v-html="$t({ en: '<code>shared ← core ← desktop / pwa</code>. Enforced by CI.', zh: '<code>shared ← core ← desktop / pwa</code>。CI 强制校验。' })"></div>

::left::

<img src="/images/architecture.svg" class="cw-shot cw-shot--panel" alt="Three-layer monorepo architecture" />

::right::

<DeckMiniPanel compact tone="cyan" :title="{ en: 'shared', zh: 'shared' }" :body="{ en: 'Protocol, constants, domain types. Zero runtime deps.', zh: '协议、常量、领域类型。零运行时依赖。' }" />

<DeckMiniPanel compact tone="green" :title="{ en: 'core', zh: 'core' }" :body="{ en: 'Stores, services, ports. Platform-agnostic logic.', zh: 'Store、Service、Port。平台无关逻辑。' }" />

<DeckMiniPanel compact tone="purple" :title="{ en: 'desktop / pwa', zh: 'desktop / pwa' }" :body="{ en: 'Electron + React · Web + Service Worker. Two shells, one core.', zh: 'Electron + React · Web + Service Worker。两个外壳，一个内核。' }" />

<div class="cw-note-panel mt-4" data-tone="yellow">
  <p class="cw-note-copy" v-html="$t({ en: '<code>check-architecture.mjs</code> blocks the build on any reverse import.', zh: '<code>check-architecture.mjs</code> 一旦发现反向引用就 CI 失败。' })"></p>
</div>

---
layout: split-media
---

# 🛰 {{ $t({ en: 'One WebSocket, Many Sessions', zh: '一条 WS，N 个会话' }) }}

<div class="cw-kicker" v-html="$t({ en: 'Single Gateway WS. Route by <code>sessionKey</code>.', zh: '单条 Gateway WS。按 <code>sessionKey</code> 路由。' })"></div>

::left::

<img src="/images/ws-routing.svg" class="cw-shot cw-shot--panel" alt="Single WebSocket routed by sessionKey" />

::right::

<DeckMiniPanel tone="cyan" :title="{ en: 'One Connection', zh: '一条连接' }" :body="{ en: 'No WS-per-task. One pipe, N sessions, zero fanout overhead.', zh: '不是每任务一条 WS。一条管道，N 个会话，零扇出开销。' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Session Key', zh: 'Session Key' }" :body="{ en: 'agent:id:clawwork:task:taskId — joined by colons. Always via buildSessionKey().', zh: 'agent:id:clawwork:task:taskId —— 冒号拼接。永远走 buildSessionKey()。' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Zero Server Changes', zh: '零服务端改动' }" :body="{ en: 'Standard OpenClaw Gateway protocol. Nothing to patch upstream.', zh: '标准 OpenClaw Gateway 协议。上游一行都不用改。' }" />

---
layout: split-media
---

# ✍️ {{ $t({ en: 'Single Writer per Role', zh: '单写者持久化' }) }}

<div class="cw-kicker">{{ $t({ en: 'A state machine. A unique index. Zero duplicate messages.', zh: '一个状态机。一个唯一索引。零重复消息。' }) }}</div>

::left::

<img src="/images/message-state-machine.svg" class="cw-shot cw-shot--panel" alt="Message persistence state machine" />

::right::

<DeckMiniPanel tone="green" :title="{ en: 'Three States', zh: '三态流转' }" :body="{ en: 'streaming → pending → canonical. Mutually exclusive.', zh: 'streaming → pending → canonical。三态互斥。' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'One Writer per Role', zh: '每角色一个写者' }" :body="{ en: 'user: ChatInput · assistant: session-sync · system: addMessage.', zh: 'user: ChatInput · assistant: session-sync · system: addMessage。' }" />

<DeckMiniPanel tone="red" :title="{ en: 'DB Unique Index', zh: 'DB 唯一索引' }" :body="{ en: 'Belt-and-braces. Any dual-write path is rejected at INSERT.', zh: '双保险。任何双写路径在 INSERT 时被拒绝。' }" />

---
layout: split-media
---

# 🔐 {{ $t({ en: 'Ed25519 Device Identity', zh: 'Ed25519 设备身份' }) }}

<div class="cw-kicker">{{ $t({ en: 'No shared secret. No embedded token. Challenge-response.', zh: '无共享密钥。无内嵌令牌。挑战-响应。' }) }}</div>

::left::

<div class="cw-nest" data-tone="purple" style="padding: 18px;">
  <div class="cw-nest-label" style="margin-bottom: 12px;">🖥 Desktop · Node crypto</div>
  <pre style="background: rgba(0,0,0,0.55); border-radius: 8px; padding: 12px 14px; margin: 0 0 14px 0; font-size: 12px; color: rgba(139, 250, 200, 0.9); border: 1px solid rgba(34, 197, 94, 0.35); line-height: 1.55;">const &#123; publicKey, privateKey &#125; =
  generateKeyPairSync('ed25519');
fs.writeFileSync(keyPath, privateKey,
  &#123; mode: 0o600 &#125;);</pre>
  <div class="cw-nest-label" style="margin-bottom: 12px;">📱 PWA · WebCrypto</div>
  <pre style="background: rgba(0,0,0,0.55); border-radius: 8px; padding: 12px 14px; margin: 0; font-size: 12px; color: rgba(139, 200, 250, 0.9); border: 1px solid rgba(59, 130, 246, 0.35); line-height: 1.55;">const kp = await crypto.subtle.generateKey(
  &#123; name: 'Ed25519' &#125;, false, ['sign']);
// non-exportable private key</pre>
</div>

::right::

<DeckMiniPanel tone="red" :title="{ en: 'Zero Secret in Binary', zh: '产物无密钥' }" :body="{ en: 'Keys generated on device. The distributed binary ships no secret at all.', zh: '密钥在设备本地生成。分发的二进制不含任何密钥。' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Challenge → Response', zh: '挑战 → 响应' }" :body="{ en: 'Server issues a nonce. Client signs with Ed25519. Verified, logged in.', zh: '服务器下发 nonce，客户端用 Ed25519 签名，验证通过即登录。' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'Isomorphic', zh: '跨端同构' }" :body="{ en: 'Node crypto on desktop and WebCrypto in PWA — interchangeable keys.', zh: '桌面用 Node crypto，PWA 用 WebCrypto —— 密钥可互换。' }" />

---
layout: split-media
---

# 🎼 {{ $t({ en: 'Conductor + Performers', zh: 'Conductor + Performer' }) }}

<div class="cw-kicker">{{ $t({ en: 'Orchestration as a session primitive. No extra runtime.', zh: '编排即 session 原语。无额外运行时。' }) }}</div>

::left::

<div class="cw-nest" data-tone="purple" style="padding: 16px;">
  <div class="cw-nest-label">🎼 Conductor (root session)</div>
  <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">
    <div class="cw-nest" data-tone="cyan">
      <div class="cw-nest-label">🎻 Performer · subagent runtime</div>
      <div class="cw-nest-items">
        <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="green"></span>write: sessionKey</span>
      </div>
    </div>
    <div class="cw-nest" data-tone="green">
      <div class="cw-nest-label">🎺 Performer · subagent runtime</div>
      <div class="cw-nest-items">
        <span class="cw-nest-skill"><span class="cw-nest-dot" data-color="cyan"></span>read: taskId</span>
      </div>
    </div>
    <div class="cw-nest" data-tone="yellow">
      <div class="cw-nest-label">🥁 Performer · @All summons</div>
    </div>
  </div>
</div>

::right::

<DeckMiniPanel tone="green" :title="{ en: 'Native Primitive', zh: '原生原语' }" :body="{ en: 'Reuses OpenClaw sub-agent spawn. No home-grown orchestrator runtime.', zh: '复用 OpenClaw 的 sub-agent spawn 能力。不自建编排运行时。' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'room-store', zh: 'room-store' }" :body="{ en: 'Tracks the session tree, maps branches to performers, surfaces @All.', zh: '维护 session 树，把分支映射到 Performer，处理 @All。' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Isolated Write · Aggregated Read', zh: '写入隔离 · 读取聚合' }" :body="{ en: 'Each Performer writes to its own sessionKey. UI aggregates by taskId.', zh: '每个 Performer 写到自己的 sessionKey。UI 按 taskId 聚合展示。' }" />

---
layout: split-media
---

# 🎨 {{ $t({ en: 'Design System as Code', zh: '设计系统即代码' }) }}

<div class="cw-kicker" v-html="$t({ en: 'CSS tokens. Enforced by <code>check-ui-contract.mjs</code>.', zh: 'CSS 令牌。由 <code>check-ui-contract.mjs</code> 强制。' })"></div>

::left::

<div class="cw-nest" data-tone="red" style="padding: 16px;">
  <div class="cw-nest-label" style="margin-bottom: 10px;">🚫 Forbidden</div>
  <pre style="background: rgba(0,0,0,0.55); border-radius: 8px; padding: 12px 14px; margin: 0 0 14px 0; font-size: 12px; color: rgba(248, 113, 113, 0.92); border: 1px solid rgba(248, 113, 113, 0.3); line-height: 1.55;">color: #8b5cf6;           ❌ raw hex
className=&quot;bg-blue-500&quot;  ❌ palette
font-size: 14px;          ❌ magic number</pre>
  <div class="cw-nest-label" style="margin-bottom: 10px;">✅ Canonical</div>
  <pre style="background: rgba(0,0,0,0.55); border-radius: 8px; padding: 12px 14px; margin: 0; font-size: 12px; color: rgba(134, 239, 172, 0.92); border: 1px solid rgba(34, 197, 94, 0.3); line-height: 1.55;">color: var(--accent-purple);
className=&quot;cw-tone-cyan&quot;
font-size: var(--text-sm);</pre>
</div>

::right::

<DeckMiniPanel tone="red" :title="{ en: 'No Raw Hex', zh: '禁止裸 hex' }" :body="{ en: 'Every color comes from a CSS variable. No rgba() literals in product code.', zh: '每个颜色来自 CSS 变量。产品代码不出现 rgba() 字面量。' }" />

<DeckMiniPanel tone="yellow" :title="{ en: 'No Tailwind Palette', zh: '禁用 Tailwind 调色板' }" :body="{ en: 'bg-blue-500, text-red-600 — banned. Use cw-tone-* classes.', zh: 'bg-blue-500、text-red-600 —— 禁止。用 cw-tone-* 类。' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Compiler Enforced', zh: '编译器保证' }" :body="{ en: 'Violations fail the build. Design consistency becomes a type error.', zh: '违规导致构建失败。设计一致性变成类型错误。' }" />

---

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-80px; right:25%;"></div>
<div class="glow-orb glow-purple cw-pulse" style="bottom:-60px; left:30%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'How People Use It', zh: '怎么用' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'Three stories from the field.', zh: '来自一线的三个故事。' }) }}</p>
</div>

---
layout: split-media
---

# 👤 {{ $t({ en: 'Scenario · Single Developer', zh: '场景 · 单兵作战' }) }}

<div class="cw-kicker">{{ $t({ en: 'Three parallel tasks. One developer. One morning.', zh: '三个并行任务。一个开发者。一个上午。' }) }}</div>

::left::

<img src="/images/multi-session-parallel.png" class="cw-shot cw-shot--panel" alt="Three tasks running in parallel" />

::right::

<DeckMiniStatRow tone="green" :text="{ en: '09:00 — Alt+Space → Bug: fix login redirect', zh: '09:00 — Alt+Space → Bug：修复登录跳转' }" />
<DeckMiniStatRow tone="cyan" :text="{ en: '09:02 — Alt+Space → Doc: translate README to ja', zh: '09:02 — Alt+Space → Doc：README 翻译日语' }" />
<DeckMiniStatRow tone="purple" :text="{ en: '09:05 — Alt+Space → Review: PR 412', zh: '09:05 — Alt+Space → Review：PR 412' }" />
<DeckMiniStatRow tone="yellow" :text="{ en: '09:15 — Three branches open. Three PRs drafted.', zh: '09:15 — 三个分支开好。三个 PR 起草完。' }" />

<div class="cw-note-panel mt-4" data-tone="green">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>Linear time → parallel output.</strong>', zh: '<strong>串行时间 → 并行产出。</strong>' })"></p>
</div>

---
layout: split-media
---

# 👥 {{ $t({ en: 'Scenario · Team Workflow', zh: '场景 · 团队协作' }) }}

<div class="cw-kicker">{{ $t({ en: 'Architect, Implementer, Reviewer — one requirement end-to-end.', zh: '架构师、实现者、评审者 —— 一条需求走到底。' }) }}</div>

::left::

<img src="/images/team-details.png" class="cw-shot cw-shot--panel" alt="Team workflow" />

::right::

<DeckMiniStatRow tone="purple" :text="{ en: 'TEAM.md — the shared workflow of the three roles', zh: 'TEAM.md —— 三个角色共享的工作流' }" />
<DeckMiniStatRow tone="green" :text="{ en: 'Architect drafts API → hands off to Implementer', zh: '架构师起草 API → 交给实现者' }" />
<DeckMiniStatRow tone="cyan" :text="{ en: 'Implementer writes code → @All for review', zh: '实现者写代码 → @All 召集评审' }" />
<DeckMiniStatRow tone="yellow" :text="{ en: 'Reviewer signs off → PR ships', zh: '评审者签字 → PR 合入' }" />

<div class="cw-note-panel mt-4" data-tone="purple">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>Three roles. One room.</strong> No context shuffling.', zh: '<strong>三个角色，一间房。</strong>零上下文搬运。' })"></p>
</div>

---
layout: split-media
---

# 🎭 {{ $t({ en: 'Scenario · Intelligent Orchestration', zh: '场景 · 智能编排' }) }}

<div class="cw-kicker">{{ $t({ en: 'One Conductor dispatches to N Performers. Then aggregates.', zh: '一个 Conductor 分发任务到 N 个 Performer，然后聚合。' }) }}</div>

::left::

<img src="/images/agents-list.png" class="cw-shot cw-shot--panel" alt="Conductor dispatching to performers" />

::right::

<DeckMiniPanel tone="purple" :title="{ en: '1 → N Dispatch', zh: '1 → N 分发' }" :body="{ en: 'Conductor spawns sub-sessions, each a specialist performer.', zh: 'Conductor 派生子会话，每个都是专家 Performer。' }" />

<DeckMiniPanel tone="green" :title="{ en: 'Isolated Write · Aggregated Read', zh: '写入隔离 · 读取聚合' }" :body="{ en: 'Each performer writes to its own sessionKey. UI shows them as one task.', zh: '每个 Performer 写到自己的 sessionKey。UI 把它们显示成一个任务。' }" />

<DeckMiniPanel tone="cyan" :title="{ en: '@All Summons', zh: '@All 召集' }" :body="{ en: 'Mention @All to broadcast a message to every performer at once.', zh: '@All 一次性把消息广播给所有 Performer。' }" />

---

<div class="cw-grid"></div>
<div class="glow-orb glow-purple cw-pulse" style="top:-80px; right:25%;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="bottom:-60px; left:30%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title">
    <span class="cw-shimmer">{{ $t({ en: 'One More Thing...', zh: 'One More Thing...' }) }}</span>
  </h1>
  <p class="cw-thanks-copy">{{ $t({ en: 'The shape of what\'s next.', zh: '下一步的样子。' }) }}</p>
</div>

---
layout: split-media
---

# 🧭 {{ $t({ en: 'Task-First, Any Runtime', zh: '面向任务,驱动多 Runtime' }) }}

<div class="cw-kicker">{{ $t({ en: 'One Task. One UX. Many runtimes underneath.', zh: '一个 Task。一套体验。底下可以是任何 runtime。' }) }}</div>

::left::

<img src="/images/task-first-stack.svg" class="cw-shot cw-shot--panel" alt="Task flows down through Product Layer, Execution Control Plane, Runtime Adapter, into runtime engines" />

::right::

<DeckMiniPanel tone="green" :title="{ en: 'Task stays first', zh: 'Task 依然是第一' }" :body="{ en: 'The user never thinks in sessions, runtimes, or workers.', zh: '用户永远不用思考 session、runtime、worker。' }" />

<DeckMiniPanel tone="cyan" :title="{ en: 'Execution, under the hood', zh: '执行,藏在引擎盖下' }" :body="{ en: 'Lifecycle, placement, recovery — all handled for you.', zh: '生命周期、调度、恢复 —— 系统替你处理。' }" />

<DeckMiniPanel tone="purple" :title="{ en: 'Capability, not brand', zh: '能力驱动,不是品牌' }" :body="{ en: 'Route by what a runtime can do, not what it is called.', zh: '按 runtime 能做什么路由,不是按叫什么名字。' }" />

---
layout: split-media
---

# 🔀 {{ $t({ en: 'Direct · Managed · Mixed', zh: '直连 · 受管 · 混合' }) }}

<div class="cw-kicker">{{ $t({ en: 'Same UX. Three ways to run it.', zh: '同一套体验。三种跑法。' }) }}</div>

::left::

<img src="/images/deployment-modes.svg" class="cw-shot cw-shot--panel" alt="Direct, Managed, and Mixed deployment topologies" />

::right::

<DeckMiniPanel compact tone="green" :title="{ en: '🎯 Direct', zh: '🎯 直连模式' }" :body="{ en: 'ClawWork → OpenClaw Gateway. Local, single-instance, zero extra layer.', zh: 'ClawWork → OpenClaw Gateway。本地、单实例、零额外层级。' }" />

<DeckMiniPanel compact tone="cyan" :title="{ en: '🛡 Managed', zh: '🛡 受管模式' }" :body="{ en: 'ClawWork → managed-agents → OpenClaw. Quotas, isolation, audit.', zh: 'ClawWork → managed-agents → OpenClaw。配额、隔离、审计。' }" />

<DeckMiniPanel compact tone="purple" :title="{ en: '🧬 Mixed', zh: '🧬 混合调度' }" :body="{ en: 'ClawWork → Control Plane → { OpenClaw, Codex, Claude Code, Hermes, ... }', zh: 'ClawWork → 控制面 → { OpenClaw、Codex、Claude Code、Hermes、... }' }" />

<div class="cw-note-panel mt-4" data-tone="cyan">
  <p class="cw-note-copy" v-html="$t({ en: '<strong>Task stays the same.</strong> The runtime underneath is a deployment decision — not a product rewrite.', zh: '<strong>Task 不变。</strong>底下用什么 runtime,是部署决策 —— 不是产品重写。' })"></p>
</div>

---

<div class="cw-grid"></div>
<div class="glow-orb glow-green cw-pulse" style="top:-80px; left:25%;"></div>
<div class="glow-orb glow-cyan cw-pulse" style="top:30%; right:-60px;"></div>
<div class="glow-orb glow-purple cw-pulse" style="bottom:-60px; left:35%;"></div>

<div class="cw-thanks-shell">
  <h1 class="cw-display-title" style="font-size: 2.4rem; line-height: 1.4;">
    <span class="cw-shimmer">{{ $t({ en: 'ClawWork is operator UX.', zh: 'ClawWork 是 operator UX。' }) }}</span><br/>
    <span class="cw-shimmer">{{ $t({ en: 'Control plane governs execution.', zh: '控制面负责执行治理。' }) }}</span><br/>
    <span class="cw-shimmer">{{ $t({ en: 'Runtime does the real work.', zh: 'Runtime 负责真正执行。' }) }}</span>
  </h1>
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
