<script setup lang="ts">
const days = [
  { en: 'Fri 3/13', zh: '周五 3/13', prs: 7, enPhase: 'Kickoff', zhPhase: '起步', tone: 'green' as const },
  { en: 'Sat 3/14', zh: '周六 3/14', prs: 6, enPhase: 'Accelerate', zhPhase: '加速', tone: 'cyan' as const },
  { en: 'Sun 3/15', zh: '周日 3/15', prs: 10, enPhase: 'Accelerate', zhPhase: '加速', tone: 'cyan' as const },
  { en: 'Mon 3/16', zh: '周一 3/16', prs: 23, enPhase: 'Explosion', zhPhase: '爆发', tone: 'purple' as const },
  { en: 'Tue 3/17', zh: '周二 3/17', prs: 13, enPhase: 'Infra', zhPhase: '基建', tone: 'yellow' as const },
  { en: 'Wed 3/18', zh: '周三 3/18', prs: 10, enPhase: 'Polish', zhPhase: '打磨', tone: 'cyan' as const },
  { en: 'Thu 3/19', zh: '周四 3/19', prs: 13, enPhase: 'Security', zhPhase: '安全', tone: 'red' as const },
];

const maxPrs = Math.max(...days.map((d) => d.prs));

const stats = [
  { value: '28', label: 'feat', tone: 'green' as const },
  { value: '30', label: 'fix', tone: 'red' as const },
  { value: '6', label: 'UI', tone: 'cyan' as const },
  { value: '5', label: 'build', tone: 'yellow' as const },
  { value: '5', label: 'docs', tone: 'purple' as const },
  { value: '4', label: 'chore', tone: 'green' as const },
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
        <div class="cw-stat-value">82</div>
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
