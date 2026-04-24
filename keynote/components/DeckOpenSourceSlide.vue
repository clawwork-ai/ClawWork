<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

const steps: { num: string; name: I18nText; sub: I18nText; tone: Tone }[] = [
  {
    num: '1',
    name: {
      en: 'Clone & Dev',
      zh: '克隆启动',
    },
    sub: {
      en: 'pnpm dev',
      zh: 'pnpm dev',
    },
    tone: 'green',
  },
  {
    num: '2',
    name: {
      en: 'Husky Check',
      zh: 'Husky 检查',
    },
    sub: {
      en: 'lint + arch guard',
      zh: 'lint + 架构守卫',
    },
    tone: 'cyan',
  },
  {
    num: '3',
    name: {
      en: 'Open PR',
      zh: '提交 PR',
    },
    sub: {
      en: '[Feat]/[Fix] prefix',
      zh: '[Feat]/[Fix] 前缀',
    },
    tone: 'purple',
  },
  {
    num: '4',
    name: {
      en: 'CI Gates',
      zh: 'CI 质量门',
    },
    sub: {
      en: '8 checks + 3 platforms',
      zh: '8 检查 + 3 平台',
    },
    tone: 'yellow',
  },
  {
    num: '5',
    name: { en: 'Merge', zh: '合并发布' },
    sub: {
      en: 'CODEOWNERS',
      zh: 'CODEOWNERS',
    },
    tone: 'green',
  },
];

const infra: { icon: string; label: I18nText; tone: Tone }[] = [
  {
    icon: '👥',
    label: {
      en: 'CODEOWNERS path protection',
      zh: 'CODEOWNERS 核心路径保护',
    },
    tone: 'green',
  },
  {
    icon: '📝',
    label: {
      en: 'Issue templates (Bug / Feature)',
      zh: 'Issue 模板 (Bug / Feature)',
    },
    tone: 'cyan',
  },
  {
    icon: '🤖',
    label: {
      en: 'CI Bot auto-label + assign',
      zh: 'CI Bot 自动标签 + 分配',
    },
    tone: 'purple',
  },
  {
    icon: '🚀',
    label: {
      en: 'Dev Release on every push',
      zh: 'Dev Release 每次 push 构建',
    },
    tone: 'yellow',
  },
  {
    icon: '🍺',
    label: {
      en: 'Homebrew Tap auto-sync',
      zh: 'Homebrew Tap 稳定版自动更新',
    },
    tone: 'green',
  },
  {
    icon: '📋',
    label: {
      en: 'PR template + release note required',
      zh: 'PR 模板 + Release Note 必填',
    },
    tone: 'cyan',
  },
];
</script>

<template>
  <div class="mt-4">
    <div class="cw-flow-row">
      <template v-for="(s, i) in steps" :key="s.num">
        <div class="cw-flow-step" :data-tone="s.tone">
          <span class="cw-pipeline-num">{{ s.num }}</span>
          <div class="cw-flow-step-body">
            <strong class="cw-pipeline-stage">{{ t(s.name) }}</strong>
            <span class="cw-flow-sub">{{ t(s.sub) }}</span>
          </div>
        </div>
        <span v-if="i < steps.length - 1" class="cw-flow-arrow">→</span>
      </template>
    </div>

    <div class="cw-infra-grid-full mt-6">
      <div v-for="item in infra" :key="item.label.en" class="cw-infra-card" :data-tone="item.tone">
        <span class="cw-feature-cell-icon">{{ item.icon }}</span>
        <span class="cw-feature-cell-label">{{ t(item.label) }}</span>
      </div>
    </div>
  </div>
</template>
