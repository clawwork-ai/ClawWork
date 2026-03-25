<script setup lang="ts">
const flow = [
  {
    num: '1',
    zh: '整理需求',
    en: 'Requirements',
    detail_zh: '人 + 多 LLM 联合 Review',
    detail_en: 'Human + multi-LLM joint review',
    tone: 'red' as const,
  },
  {
    num: '2',
    zh: '任务拆分',
    en: 'Task Split',
    detail_zh: 'Issue / Bug / 需求文档 → PR 粒度拆分',
    detail_en: 'Issue / Bug / Spec → PR-sized chunks',
    tone: 'yellow' as const,
  },
  {
    num: '3',
    zh: '多 Worktree 并行',
    en: 'Parallel Worktrees',
    detail_zh: 'gmc 工具初始化，每个 worktree 自带 todo.md',
    detail_en: 'gmc init, each worktree gets todo.md',
    tone: 'green' as const,
  },
  {
    num: '4',
    zh: '编码 + 测试',
    en: 'Code + Test',
    detail_zh: '严格代码规范，配合 skill 自动化',
    detail_en: 'Strict conventions, skill-driven automation',
    tone: 'cyan' as const,
  },
  {
    num: '5',
    zh: 'Code Review → PR',
    en: 'Review → PR',
    detail_zh: '自动 Review + 读取 PR Template → 提交',
    detail_en: 'Auto review + PR template → submit',
    tone: 'purple' as const,
  },
  {
    num: '6',
    zh: '监控 CI → 合并',
    en: 'Monitor CI → Merge',
    detail_zh: '失败则 amend 修复，通过则合并',
    detail_en: 'Fix on failure, merge on pass',
    tone: 'green' as const,
  },
];
</script>

<template>
  <div class="cw-mt-16">
    <div class="cw-workflow-grid">
      <div v-for="s in flow" :key="s.num" class="cw-workflow-card" :data-tone="s.tone">
        <div class="cw-workflow-header">
          <span class="cw-pipeline-num">{{ s.num }}</span>
          <strong class="en cw-pipeline-stage">{{ s.en }}</strong>
          <strong class="zh cw-pipeline-stage">{{ s.zh }}</strong>
        </div>
        <span class="en cw-pipeline-desc">{{ s.detail_en }}</span>
        <span class="zh cw-pipeline-desc">{{ s.detail_zh }}</span>
      </div>
    </div>
    <div class="cw-workflow-footer">
      <a href="https://github.com/samzong/samzong/tree/main/skills" target="_blank" class="cw-sprint-ref">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
        <span class="en">samzong/skills — All skills &amp; workflows open-sourced</span>
        <span class="zh">samzong/skills — 所有 skill 和工作流已开源</span>
      </a>
    </div>
  </div>
</template>
