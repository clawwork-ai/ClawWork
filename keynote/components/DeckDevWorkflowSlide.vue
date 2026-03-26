<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

const flow: { num: string; name: I18nText; detail: I18nText; tone: Tone }[] = [
  {
    num: '1',
    name: {
      en: 'Requirements',
      zh: '整理需求',
      ja: '要件整理',
      ko: '요구사항 정리',
      fr: 'Exigences',
      de: 'Anforderungen',
      es: 'Requisitos',
      pt: 'Requisitos',
    },
    detail: {
      en: 'Human + multi-LLM joint review',
      zh: '人 + 多 LLM 联合 Review',
      ja: '人間 + マルチ LLM 共同レビュー',
      ko: '사람 + 멀티 LLM 공동 리뷰',
      fr: 'Revue humain + multi-LLM',
      de: 'Mensch + Multi-LLM gemeinsames Review',
      es: 'Revisión humano + multi-LLM',
      pt: 'Revisão humano + multi-LLM',
    },
    tone: 'red',
  },
  {
    num: '2',
    name: {
      en: 'Task Split',
      zh: '任务拆分',
      ja: 'タスク分割',
      ko: '태스크 분할',
      fr: 'Découpage',
      de: 'Aufgabenteilung',
      es: 'División de tareas',
      pt: 'Divisão de tarefas',
    },
    detail: {
      en: 'Issue / Bug / Spec → PR-sized chunks',
      zh: 'Issue / Bug / 需求文档 → PR 粒度拆分',
      ja: 'Issue / Bug / 仕様 → PR サイズに分割',
      ko: 'Issue / Bug / 스펙 → PR 크기로 분할',
      fr: 'Issue / Bug / Spec → morceaux taille PR',
      de: 'Issue / Bug / Spec → PR-große Blöcke',
      es: 'Issue / Bug / Spec → trozos tamaño PR',
      pt: 'Issue / Bug / Spec → pedaços tamanho PR',
    },
    tone: 'yellow',
  },
  {
    num: '3',
    name: {
      en: 'Parallel Worktrees',
      zh: '多 Worktree 并行',
      ja: '並列 Worktree',
      ko: '병렬 Worktree',
      fr: 'Worktrees parallèles',
      de: 'Parallele Worktrees',
      es: 'Worktrees paralelos',
      pt: 'Worktrees paralelos',
    },
    detail: {
      en: 'gmc init, each worktree gets todo.md',
      zh: 'gmc 工具初始化，每个 worktree 自带 todo.md',
      ja: 'gmc 初期化、各 worktree に todo.md',
      ko: 'gmc 초기화, 각 worktree에 todo.md',
      fr: 'gmc init, chaque worktree reçoit todo.md',
      de: 'gmc init, jeder Worktree bekommt todo.md',
      es: 'gmc init, cada worktree recibe todo.md',
      pt: 'gmc init, cada worktree recebe todo.md',
    },
    tone: 'green',
  },
  {
    num: '4',
    name: {
      en: 'Code + Test',
      zh: '编码 + 测试',
      ja: 'コード + テスト',
      ko: '코드 + 테스트',
      fr: 'Code + Test',
      de: 'Code + Test',
      es: 'Código + Test',
      pt: 'Código + Teste',
    },
    detail: {
      en: 'Strict conventions, skill-driven automation',
      zh: '严格代码规范，配合 skill 自动化',
      ja: '厳格な規約、skill ベースの自動化',
      ko: '엄격한 컨벤션, skill 기반 자동화',
      fr: 'Conventions strictes, automatisation par skill',
      de: 'Strikte Konventionen, skill-getriebene Automatisierung',
      es: 'Convenciones estrictas, automatización por skill',
      pt: 'Convenções estritas, automação por skill',
    },
    tone: 'cyan',
  },
  {
    num: '5',
    name: {
      en: 'Review → PR',
      zh: 'Code Review → PR',
      ja: 'レビュー → PR',
      ko: '리뷰 → PR',
      fr: 'Review → PR',
      de: 'Review → PR',
      es: 'Review → PR',
      pt: 'Review → PR',
    },
    detail: {
      en: 'Auto review + PR template → submit',
      zh: '自动 Review + 读取 PR Template → 提交',
      ja: '自動レビュー + PR テンプレート → 提出',
      ko: '자동 리뷰 + PR 템플릿 → 제출',
      fr: 'Review auto + template PR → soumettre',
      de: 'Auto-Review + PR-Template → einreichen',
      es: 'Review auto + plantilla PR → enviar',
      pt: 'Review auto + template PR → submeter',
    },
    tone: 'purple',
  },
  {
    num: '6',
    name: {
      en: 'Monitor CI → Merge',
      zh: '监控 CI → 合并',
      ja: 'CI 監視 → マージ',
      ko: 'CI 모니터 → 머지',
      fr: 'Surveiller CI → Merge',
      de: 'CI überwachen → Merge',
      es: 'Monitorear CI → Merge',
      pt: 'Monitorar CI → Merge',
    },
    detail: {
      en: 'Fix on failure, merge on pass',
      zh: '失败则 amend 修复，通过则合并',
      ja: '失敗なら修正、成功ならマージ',
      ko: '실패 시 수정, 통과 시 머지',
      fr: 'Corriger si échec, merger si OK',
      de: 'Bei Fehler fixen, bei Erfolg mergen',
      es: 'Corregir si falla, mergear si pasa',
      pt: 'Corrigir se falhar, mergear se passar',
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
            ja: 'samzong/skills — 全 skill とワークフローをオープンソース化',
            ko: 'samzong/skills — 모든 skill과 워크플로 오픈소스',
            fr: 'samzong/skills — Tous les skills et workflows open-sourcés',
            de: 'samzong/skills — Alle Skills & Workflows open-sourced',
            es: 'samzong/skills — Todos los skills y workflows en código abierto',
            pt: 'samzong/skills — Todos os skills e workflows em código aberto',
          })
        }}</span>
      </a>
    </div>
  </div>
</template>
