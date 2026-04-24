<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

const flow: { num: string; name: I18nText; detail: I18nText; tone: Tone }[] = [
  {
    num: '1',
    name: {
      en: 'Requirements',
      zh: '整理需求',
    },
    detail: {
      en: 'Human + multi-LLM joint review',
      zh: '人 + 多 LLM 联合 Review',
    },
    tone: 'red',
  },
  {
    num: '2',
    name: {
      en: 'Task Split',
      zh: '任务拆分',
    },
    detail: {
      en: 'Issue / Bug / Spec → PR-sized chunks',
      zh: 'Issue / Bug / 需求文档 → PR 粒度拆分',
    },
    tone: 'yellow',
  },
  {
    num: '3',
    name: {
      en: 'Parallel Worktrees',
      zh: '多 Worktree 并行',
    },
    detail: {
      en: 'gmc init, each worktree gets todo.md',
      zh: 'gmc 工具初始化，每个 worktree 自带 todo.md',
    },
    tone: 'green',
  },
  {
    num: '4',
    name: {
      en: 'Code + Test',
      zh: '编码 + 测试',
    },
    detail: {
      en: 'Strict conventions, skill-driven automation',
      zh: '严格代码规范，配合 skill 自动化',
    },
    tone: 'cyan',
  },
  {
    num: '5',
    name: {
      en: 'Review → PR',
      zh: 'Code Review → PR',
    },
    detail: {
      en: 'Auto review + PR template → submit',
      zh: '自动 Review + 读取 PR Template → 提交',
    },
    tone: 'purple',
  },
  {
    num: '6',
    name: {
      en: 'Monitor CI → Merge',
      zh: '监控 CI → 合并',
    },
    detail: {
      en: 'Fix on failure, merge on pass',
      zh: '失败则 amend 修复，通过则合并',
    },
    tone: 'green',
  },
];
</script>

<template>
  <div class="mt-4">
    <div class="cw-workflow-grid">
      <div v-for="s in flow" :key="s.num" class="cw-workflow-card" :data-tone="s.tone">
        <div class="cw-workflow-header">
          <span class="cw-pipeline-num">{{ s.num }}</span>
          <strong class="cw-pipeline-stage">{{ t(s.name) }}</strong>
        </div>
        <span class="cw-pipeline-desc">{{ t(s.detail) }}</span>
      </div>
    </div>
    <div class="cw-workflow-footer">
      <a href="https://github.com/samzong/samzong/tree/main/skills" target="_blank" class="cw-sprint-ref">
        <GhIcon />
        <span>{{
          t({
            en: 'samzong/skills — All skills & workflows open-sourced',
            zh: 'samzong/skills — 所有 skill 和工作流已开源',
          })
        }}</span>
      </a>
    </div>
  </div>
</template>
