<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

const days: { day: I18nText; prs: number; phase: I18nText; tone: Tone }[] = [
  {
    day: {
      en: 'Fri 3/13',
      zh: '周五 3/13',
    },
    prs: 11,
    phase: {
      en: 'Kickoff',
      zh: '起步',
    },
    tone: 'green',
  },
  {
    day: {
      en: 'Sat 3/14',
      zh: '周六 3/14',
    },
    prs: 11,
    phase: {
      en: 'Accelerate',
      zh: '加速',
    },
    tone: 'cyan',
  },
  {
    day: {
      en: 'Sun 3/15',
      zh: '周日 3/15',
    },
    prs: 4,
    phase: {
      en: 'Accelerate',
      zh: '加速',
    },
    tone: 'cyan',
  },
  {
    day: {
      en: 'Mon 3/16',
      zh: '周一 3/16',
    },
    prs: 25,
    phase: {
      en: 'Explosion',
      zh: '爆发',
    },
    tone: 'purple',
  },
  {
    day: {
      en: 'Tue 3/17',
      zh: '周二 3/17',
    },
    prs: 14,
    phase: {
      en: 'Infra',
      zh: '基建',
    },
    tone: 'yellow',
  },
  {
    day: {
      en: 'Wed 3/18',
      zh: '周三 3/18',
    },
    prs: 14,
    phase: {
      en: 'Polish',
      zh: '打磨',
    },
    tone: 'cyan',
  },
  {
    day: {
      en: 'Thu 3/19',
      zh: '周四 3/19',
    },
    prs: 18,
    phase: {
      en: 'Security',
      zh: '安全',
    },
    tone: 'red',
  },
  {
    day: {
      en: 'Sun 3/22',
      zh: '周日 3/22',
    },
    prs: 4,
    phase: {
      en: 'Stabilize',
      zh: '稳定',
    },
    tone: 'yellow',
  },
  {
    day: {
      en: 'Mon 3/23',
      zh: '周一 3/23',
    },
    prs: 17,
    phase: {
      en: 'Ship v10',
      zh: '发版',
    },
    tone: 'green',
  },
  {
    day: {
      en: 'Tue 3/24',
      zh: '周二 3/24',
    },
    prs: 8,
    phase: {
      en: 'Expand',
      zh: '扩展',
    },
    tone: 'cyan',
  },
  {
    day: {
      en: 'Wed 3/25',
      zh: '周三 3/25',
    },
    prs: 9,
    phase: {
      en: 'i18n + DX',
      zh: '国际化',
    },
    tone: 'purple',
  },
  {
    day: {
      en: 'Thu 3/26',
      zh: '周四 3/26',
    },
    prs: 8,
    phase: {
      en: 'Toolchain',
      zh: '工具链',
    },
    tone: 'red',
  },
  {
    day: {
      en: 'Fri 3/27',
      zh: '周五 3/27',
    },
    prs: 18,
    phase: {
      en: 'Ship v13',
      zh: '发布 v13',
    },
    tone: 'green',
  },
];

const maxPrs = Math.max(...days.map((d) => d.prs));

const stats: { value: string; label: string; tone: Tone }[] = [
  { value: '64', label: 'fix', tone: 'red' },
  { value: '48', label: 'feat', tone: 'green' },
  { value: '14', label: 'refactor', tone: 'cyan' },
  { value: '12', label: 'docs', tone: 'purple' },
  { value: '9', label: 'build', tone: 'yellow' },
  { value: '7', label: 'chore', tone: 'green' },
  { value: '6', label: 'UI', tone: 'cyan' },
];

const tools: { name: string; note: string; tone: Tone }[] = [
  { name: 'GitHub Copilot', note: '$39/mo', tone: 'green' },
  { name: 'Claude Code', note: '$20/mo', tone: 'purple' },
  { name: 'OpenAI Codex', note: '$20/mo', tone: 'cyan' },
];
</script>

<template>
  <div class="cw-split--media items-stretch mt-4">
    <div class="cw-sprint-timeline">
      <div v-for="day in days" :key="day.day.en" class="cw-sprint-row" :data-tone="day.tone">
        <span class="cw-sprint-day">{{ t(day.day) }}</span>
        <div class="cw-sprint-bar-track">
          <div class="cw-sprint-bar-fill" :style="{ width: (day.prs / maxPrs) * 100 + '%' }"></div>
        </div>
        <span class="cw-sprint-count">{{ day.prs }}</span>
        <span class="cw-sprint-phase">{{ t(day.phase) }}</span>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <div class="cw-stat-card" data-tone="green">
        <div class="cw-stat-label">
          {{
            t({
              en: 'Total PRs Merged',
              zh: 'PR 合并总数',
            })
          }}
        </div>
        <div class="cw-stat-value">161</div>
      </div>

      <div class="cw-sprint-breakdown">
        <span v-for="s in stats" :key="s.label" class="cw-sprint-tag" :data-tone="s.tone"
          >{{ s.value }} {{ s.label }}</span
        >
      </div>

      <div class="cw-stat-card" data-tone="purple">
        <div class="cw-stat-label">
          {{
            t({
              en: 'Stable Releases',
              zh: '稳定版发布',
            })
          }}
        </div>
        <div class="cw-stat-value">13</div>
      </div>

      <div class="cw-sprint-tools">
        <div v-for="tl in tools" :key="tl.name" class="cw-sprint-tool" :data-tone="tl.tone">
          <span class="cw-sprint-tool-name">{{ tl.name }}</span>
          <span class="cw-sprint-tool-note">{{ tl.note }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
