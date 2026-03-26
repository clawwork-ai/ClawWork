<script setup lang="ts">
const days = [
  { en: 'Fri 3/13', zh: '周五 3/13', prs: 11, enPhase: 'Kickoff', zhPhase: '起步', tone: 'green' as const },
  { en: 'Sat 3/14', zh: '周六 3/14', prs: 11, enPhase: 'Accelerate', zhPhase: '加速', tone: 'cyan' as const },
  { en: 'Sun 3/15', zh: '周日 3/15', prs: 4, enPhase: 'Accelerate', zhPhase: '加速', tone: 'cyan' as const },
  { en: 'Mon 3/16', zh: '周一 3/16', prs: 25, enPhase: 'Explosion', zhPhase: '爆发', tone: 'purple' as const },
  { en: 'Tue 3/17', zh: '周二 3/17', prs: 14, enPhase: 'Infra', zhPhase: '基建', tone: 'yellow' as const },
  { en: 'Wed 3/18', zh: '周三 3/18', prs: 14, enPhase: 'Polish', zhPhase: '打磨', tone: 'cyan' as const },
  { en: 'Thu 3/19', zh: '周四 3/19', prs: 18, enPhase: 'Security', zhPhase: '安全', tone: 'red' as const },
  { en: 'Sun 3/22', zh: '周日 3/22', prs: 4, enPhase: 'Stabilize', zhPhase: '稳定', tone: 'yellow' as const },
  { en: 'Mon 3/23', zh: '周一 3/23', prs: 17, enPhase: 'Ship v10', zhPhase: '发版', tone: 'green' as const },
  { en: 'Tue 3/24', zh: '周二 3/24', prs: 8, enPhase: 'Expand', zhPhase: '扩展', tone: 'cyan' as const },
  { en: 'Wed 3/25', zh: '周三 3/25', prs: 9, enPhase: 'i18n + DX', zhPhase: '国际化', tone: 'purple' as const },
  { en: 'Thu 3/26', zh: '周四 3/26', prs: 4, enPhase: 'Toolchain', zhPhase: '工具链', tone: 'red' as const },
];

const maxPrs = Math.max(...days.map((d) => d.prs));

const stats = [
  { value: '53', label: 'fix', tone: 'red' as const },
  { value: '44', label: 'feat', tone: 'green' as const },
  { value: '11', label: 'docs', tone: 'purple' as const },
  { value: '9', label: 'build', tone: 'yellow' as const },
  { value: '8', label: 'refactor', tone: 'cyan' as const },
  { value: '8', label: 'chore', tone: 'green' as const },
  { value: '6', label: 'UI', tone: 'cyan' as const },
];

const tools = [
  { name: 'GitHub Copilot', note: '$39/mo', tone: 'green' as const },
  { name: 'Claude Code', note: '$20/mo', tone: 'purple' as const },
  { name: 'OpenAI Codex', note: '$20/mo', tone: 'cyan' as const },
];
</script>

<template>
  <div class="cw-split cw-split--media cw-mt-16" style="align-items: stretch">
    <div class="cw-sprint-timeline">
      <div v-for="day in days" :key="day.en" class="cw-sprint-row" :data-tone="day.tone">
        <span class="en cw-sprint-day">{{ day.en }}</span>
        <span class="zh cw-sprint-day">{{ day.zh }}</span>
        <div class="cw-sprint-bar-track">
          <div class="cw-sprint-bar-fill" :style="{ width: (day.prs / maxPrs) * 100 + '%' }"></div>
        </div>
        <span class="cw-sprint-count">{{ day.prs }}</span>
        <span class="en cw-sprint-phase">{{ day.enPhase }}</span>
        <span class="zh cw-sprint-phase">{{ day.zhPhase }}</span>
      </div>
    </div>

    <div class="cw-stack-md">
      <div class="cw-stat-card" data-tone="green">
        <div class="en cw-stat-label">Total PRs Merged</div>
        <div class="zh cw-stat-label">PR 合并总数</div>
        <div class="cw-stat-value">139</div>
      </div>

      <div class="cw-sprint-breakdown">
        <span v-for="s in stats" :key="s.label" class="cw-sprint-tag" :data-tone="s.tone"
          >{{ s.value }} {{ s.label }}</span
        >
      </div>

      <div class="cw-stat-card" data-tone="purple">
        <div class="en cw-stat-label">Token Consumed</div>
        <div class="zh cw-stat-label">Token 消耗量</div>
        <div class="cw-stat-value">1.2B</div>
      </div>

      <div class="cw-sprint-tools">
        <div v-for="t in tools" :key="t.name" class="cw-sprint-tool" :data-tone="t.tone">
          <span class="cw-sprint-tool-name">{{ t.name }}</span>
          <span class="cw-sprint-tool-note">{{ t.note }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
