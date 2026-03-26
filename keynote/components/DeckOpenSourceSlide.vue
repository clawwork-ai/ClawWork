<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

const steps: { num: string; name: I18nText; sub: I18nText; tone: Tone }[] = [
  {
    num: '1',
    name: {
      en: 'Clone & Dev',
      zh: '克隆启动',
      ja: 'Clone & Dev',
      ko: 'Clone & Dev',
      fr: 'Clone & Dev',
      de: 'Clone & Dev',
      es: 'Clone & Dev',
      pt: 'Clone & Dev',
    },
    sub: {
      en: 'pnpm dev',
      zh: 'pnpm dev',
      ja: 'pnpm dev',
      ko: 'pnpm dev',
      fr: 'pnpm dev',
      de: 'pnpm dev',
      es: 'pnpm dev',
      pt: 'pnpm dev',
    },
    tone: 'green',
  },
  {
    num: '2',
    name: {
      en: 'Husky Check',
      zh: 'Husky 检查',
      ja: 'Husky チェック',
      ko: 'Husky 검사',
      fr: 'Vérif Husky',
      de: 'Husky-Check',
      es: 'Check Husky',
      pt: 'Check Husky',
    },
    sub: {
      en: 'lint + arch guard',
      zh: 'lint + 架构守卫',
      ja: 'lint + アーキテクチャガード',
      ko: 'lint + 아키텍처 가드',
      fr: 'lint + garde archi',
      de: 'Lint + Architektur-Guard',
      es: 'lint + guardia arq.',
      pt: 'lint + guard arq.',
    },
    tone: 'cyan',
  },
  {
    num: '3',
    name: {
      en: 'Open PR',
      zh: '提交 PR',
      ja: 'PR 作成',
      ko: 'PR 생성',
      fr: 'Ouvrir PR',
      de: 'PR öffnen',
      es: 'Abrir PR',
      pt: 'Abrir PR',
    },
    sub: {
      en: '[Feat]/[Fix] prefix',
      zh: '[Feat]/[Fix] 前缀',
      ja: '[Feat]/[Fix] プレフィックス',
      ko: '[Feat]/[Fix] 접두사',
      fr: 'Préfixe [Feat]/[Fix]',
      de: '[Feat]/[Fix]-Präfix',
      es: 'Prefijo [Feat]/[Fix]',
      pt: 'Prefixo [Feat]/[Fix]',
    },
    tone: 'purple',
  },
  {
    num: '4',
    name: {
      en: 'CI Gates',
      zh: 'CI 质量门',
      ja: 'CI ゲート',
      ko: 'CI 게이트',
      fr: 'Portes CI',
      de: 'CI-Gates',
      es: 'Puertas CI',
      pt: 'Portas CI',
    },
    sub: {
      en: '8 checks + 3 platforms',
      zh: '8 检查 + 3 平台',
      ja: '8チェック + 3プラットフォーム',
      ko: '8개 검사 + 3 플랫폼',
      fr: '8 checks + 3 plateformes',
      de: '8 Checks + 3 Plattformen',
      es: '8 checks + 3 plataformas',
      pt: '8 checks + 3 plataformas',
    },
    tone: 'yellow',
  },
  {
    num: '5',
    name: { en: 'Merge', zh: '合并发布', ja: 'マージ', ko: '머지', fr: 'Merge', de: 'Merge', es: 'Merge', pt: 'Merge' },
    sub: {
      en: 'CODEOWNERS',
      zh: 'CODEOWNERS',
      ja: 'CODEOWNERS',
      ko: 'CODEOWNERS',
      fr: 'CODEOWNERS',
      de: 'CODEOWNERS',
      es: 'CODEOWNERS',
      pt: 'CODEOWNERS',
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
      ja: 'CODEOWNERS パス保護',
      ko: 'CODEOWNERS 경로 보호',
      fr: 'Protection de chemins CODEOWNERS',
      de: 'CODEOWNERS-Pfadschutz',
      es: 'Protección de rutas CODEOWNERS',
      pt: 'Proteção de caminhos CODEOWNERS',
    },
    tone: 'green',
  },
  {
    icon: '📝',
    label: {
      en: 'Issue templates (Bug / Feature)',
      zh: 'Issue 模板 (Bug / Feature)',
      ja: 'Issue テンプレート (Bug / Feature)',
      ko: 'Issue 템플릿 (Bug / Feature)',
      fr: "Templates d'Issue (Bug / Feature)",
      de: 'Issue-Templates (Bug / Feature)',
      es: 'Plantillas de Issue (Bug / Feature)',
      pt: 'Templates de Issue (Bug / Feature)',
    },
    tone: 'cyan',
  },
  {
    icon: '🤖',
    label: {
      en: 'CI Bot auto-label + assign',
      zh: 'CI Bot 自动标签 + 分配',
      ja: 'CI Bot 自動ラベル + アサイン',
      ko: 'CI Bot 자동 라벨 + 할당',
      fr: 'CI Bot auto-label + assignation',
      de: 'CI-Bot Auto-Label + Zuordnung',
      es: 'CI Bot auto-label + asignación',
      pt: 'CI Bot auto-label + atribuição',
    },
    tone: 'purple',
  },
  {
    icon: '🚀',
    label: {
      en: 'Dev Release on every push',
      zh: 'Dev Release 每次 push 构建',
      ja: 'プッシュごとに Dev Release',
      ko: '매 push마다 Dev Release',
      fr: 'Dev Release à chaque push',
      de: 'Dev-Release bei jedem Push',
      es: 'Dev Release en cada push',
      pt: 'Dev Release a cada push',
    },
    tone: 'yellow',
  },
  {
    icon: '🍺',
    label: {
      en: 'Homebrew Tap auto-sync',
      zh: 'Homebrew Tap 稳定版自动更新',
      ja: 'Homebrew Tap 自動同期',
      ko: 'Homebrew Tap 자동 동기화',
      fr: 'Homebrew Tap sync auto',
      de: 'Homebrew-Tap Auto-Sync',
      es: 'Homebrew Tap auto-sync',
      pt: 'Homebrew Tap auto-sync',
    },
    tone: 'green',
  },
  {
    icon: '📋',
    label: {
      en: 'PR template + release note required',
      zh: 'PR 模板 + Release Note 必填',
      ja: 'PR テンプレート + リリースノート必須',
      ko: 'PR 템플릿 + 릴리스 노트 필수',
      fr: 'Template PR + note de release obligatoire',
      de: 'PR-Template + Release-Note erforderlich',
      es: 'Plantilla PR + nota de release obligatoria',
      pt: 'Template PR + nota de release obrigatória',
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
