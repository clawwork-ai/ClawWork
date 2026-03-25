<script setup lang="ts">
const steps = [
  { num: '1', zh: '克隆启动', en: 'Clone & Dev', sub_zh: 'pnpm dev', sub_en: 'pnpm dev', tone: 'green' as const },
  {
    num: '2',
    zh: 'Husky 检查',
    en: 'Husky Check',
    sub_zh: 'lint + 架构守卫',
    sub_en: 'lint + arch guard',
    tone: 'cyan' as const,
  },
  {
    num: '3',
    zh: '提交 PR',
    en: 'Open PR',
    sub_zh: '[Feat]/[Fix] 前缀',
    sub_en: '[Feat]/[Fix] prefix',
    tone: 'purple' as const,
  },
  {
    num: '4',
    zh: 'CI 质量门',
    en: 'CI Gates',
    sub_zh: '8 检查 + 3 平台',
    sub_en: '8 checks + 3 platforms',
    tone: 'yellow' as const,
  },
  { num: '5', zh: '合并发布', en: 'Merge', sub_zh: 'CODEOWNERS', sub_en: 'CODEOWNERS', tone: 'green' as const },
];

const infra = [
  { icon: '👥', zh: 'CODEOWNERS 核心路径保护', en: 'CODEOWNERS path protection', tone: 'green' as const },
  { icon: '📝', zh: 'Issue 模板 (Bug / Feature)', en: 'Issue templates (Bug / Feature)', tone: 'cyan' as const },
  { icon: '🤖', zh: 'CI Bot 自动标签 + 分配', en: 'CI Bot auto-label + assign', tone: 'purple' as const },
  { icon: '🚀', zh: 'Dev Release 每次 push 构建', en: 'Dev Release on every push', tone: 'yellow' as const },
  { icon: '🍺', zh: 'Homebrew Tap 稳定版自动更新', en: 'Homebrew Tap auto-sync', tone: 'green' as const },
  { icon: '📋', zh: 'PR 模板 + Release Note 必填', en: 'PR template + release note required', tone: 'cyan' as const },
];
</script>

<template>
  <div class="cw-mt-16">
    <div class="cw-flow-row">
      <template v-for="(s, i) in steps" :key="s.num">
        <div class="cw-flow-step" :data-tone="s.tone">
          <span class="cw-pipeline-num">{{ s.num }}</span>
          <div class="cw-flow-step-body">
            <strong class="en cw-pipeline-stage">{{ s.en }}</strong>
            <strong class="zh cw-pipeline-stage">{{ s.zh }}</strong>
            <span class="en cw-flow-sub">{{ s.sub_en }}</span>
            <span class="zh cw-flow-sub">{{ s.sub_zh }}</span>
          </div>
        </div>
        <span v-if="i < steps.length - 1" class="cw-flow-arrow">→</span>
      </template>
    </div>

    <div class="cw-infra-grid-full cw-mt-24">
      <div v-for="item in infra" :key="item.en" class="cw-infra-card" :data-tone="item.tone">
        <span class="cw-feature-cell-icon">{{ item.icon }}</span>
        <span class="en cw-feature-cell-label">{{ item.en }}</span>
        <span class="zh cw-feature-cell-label">{{ item.zh }}</span>
      </div>
    </div>
  </div>
</template>
