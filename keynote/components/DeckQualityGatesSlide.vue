<script setup lang="ts">
const guards = [
  {
    cmd: 'knip',
    zh: '死代码/无引用导出扫描接入 check 与 CI',
    en: 'Dead-code + unused-export scan wired into check and CI',
    tone: 'red' as const,
  },
  {
    cmd: 'test:coverage',
    zh: 'Vitest 覆盖率纳入 CI 测试环节',
    en: 'Vitest coverage included in CI test stage',
    tone: 'purple' as const,
  },
  {
    cmd: 'check:architecture',
    zh: '会话 Key 必须走 buildSessionKey()',
    en: 'Session key via buildSessionKey() only',
    tone: 'red' as const,
  },
  {
    cmd: 'check:ui-contract',
    zh: '颜色/字号/间距全走 design token',
    en: 'Colors, fonts, spacing via design tokens',
    tone: 'green' as const,
  },
  {
    cmd: 'check:renderer-copy',
    zh: '渲染层禁止硬编码文案',
    en: 'No hardcoded copy in renderer',
    tone: 'cyan' as const,
  },
  {
    cmd: 'check:i18n',
    zh: '8 语言 key 对齐 + HTML 漂移检查',
    en: '8-lang key parity + HTML drift check',
    tone: 'purple' as const,
  },
  {
    cmd: 'no-restricted-imports',
    zh: '渲染层禁 electron/fs/ws/node:*',
    en: 'Renderer banned: electron/fs/ws/node:*',
    tone: 'yellow' as const,
  },
  {
    cmd: 'TypeScript strict',
    zh: 'any → error，全包 typecheck',
    en: 'any → error, full strict typecheck',
    tone: 'green' as const,
  },
];

const pipeline = [
  {
    stage: 'Pre-commit',
    zh: 'Husky: lint-staged + 架构检查',
    en: 'Husky: lint-staged + arch check',
    tone: 'green' as const,
  },
  {
    stage: 'PR Check',
    zh: '8 项质量门 + coverage 测试 + 3 平台构建',
    en: '8 quality gates + coverage tests + 3-platform build',
    tone: 'cyan' as const,
  },
  {
    stage: 'E2E',
    zh: 'Playwright: Smoke + Gateway (Docker)',
    en: 'Playwright: Smoke + Gateway (Docker)',
    tone: 'purple' as const,
  },
  {
    stage: 'Release',
    zh: '版本校验 → 签名 → 公证 → 发布',
    en: 'Version verify → Sign → Notarize → Publish',
    tone: 'yellow' as const,
  },
];
</script>

<template>
  <div class="cw-split cw-split--media cw-mt-16" style="align-items: stretch">
    <div class="cw-stack-sm">
      <div v-for="g in guards" :key="g.cmd" class="cw-guard-row" :data-tone="g.tone">
        <span class="cw-guard-cmd">{{ g.cmd }}</span>
        <span class="en cw-guard-desc">{{ g.en }}</span>
        <span class="zh cw-guard-desc">{{ g.zh }}</span>
      </div>
    </div>

    <div class="cw-pipeline">
      <div v-for="(p, i) in pipeline" :key="p.stage" class="cw-pipeline-step" :data-tone="p.tone">
        <span class="cw-pipeline-num">{{ i + 1 }}</span>
        <div class="cw-pipeline-body">
          <strong class="cw-pipeline-stage">{{ p.stage }}</strong>
          <span class="en cw-pipeline-desc">{{ p.en }}</span>
          <span class="zh cw-pipeline-desc">{{ p.zh }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
