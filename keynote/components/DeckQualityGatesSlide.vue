<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

const guards: { cmd: string; desc: I18nText; tone: Tone }[] = [
  {
    cmd: 'knip',
    desc: {
      en: 'Dead-code + unused-export scan wired into check and CI',
      zh: '死代码/无引用导出扫描接入 check 与 CI',
      ja: '未使用コード/エクスポートスキャンを check と CI に統合',
      ko: '사용하지 않는 코드/미참조 export 스캔을 check·CI에 연결',
      fr: 'Scan code mort + exports inutilisés dans check et CI',
      de: 'Dead-Code + ungenutzter Export-Scan in Check und CI',
      es: 'Escaneo de código muerto + exports no usados en check y CI',
      pt: 'Scan de código morto + exports não usados integrado ao check e CI',
    },
    tone: 'red',
  },
  {
    cmd: 'test:coverage',
    desc: {
      en: 'Vitest coverage included in CI test stage',
      zh: 'Vitest 覆盖率纳入 CI 测试环节',
      ja: 'Vitest カバレッジを CI テストステージに統合',
      ko: 'Vitest 커버리지를 CI 테스트 단계에 포함',
      fr: "Couverture Vitest incluse dans l'étape test CI",
      de: 'Vitest-Coverage in CI-Testphase integriert',
      es: 'Cobertura Vitest incluida en la etapa de test CI',
      pt: 'Cobertura Vitest incluída na etapa de teste CI',
    },
    tone: 'purple',
  },
  {
    cmd: 'check:architecture',
    desc: {
      en: 'Session key via buildSessionKey() only',
      zh: '会话 Key 必须走 buildSessionKey()',
      ja: 'セッションキーは buildSessionKey() 経由のみ',
      ko: '세션 키는 buildSessionKey()만 사용',
      fr: 'Clé de session uniquement via buildSessionKey()',
      de: 'Session-Key nur über buildSessionKey()',
      es: 'Clave de sesión solo vía buildSessionKey()',
      pt: 'Chave de sessão apenas via buildSessionKey()',
    },
    tone: 'red',
  },
  {
    cmd: 'check:ui-contract',
    desc: {
      en: 'Colors, fonts, spacing via design tokens',
      zh: '颜色/字号/间距全走 design token',
      ja: '色・フォント・間隔は design token 経由',
      ko: '색상/글꼴/간격은 design token으로',
      fr: 'Couleurs, polices, espacements via design tokens',
      de: 'Farben, Fonts, Abstände über Design-Tokens',
      es: 'Colores, fuentes, espaciado vía design tokens',
      pt: 'Cores, fontes, espaçamento via design tokens',
    },
    tone: 'green',
  },
  {
    cmd: 'check:renderer-copy',
    desc: {
      en: 'No hardcoded copy in renderer',
      zh: '渲染层禁止硬编码文案',
      ja: 'レンダラーにハードコード文言禁止',
      ko: '렌더러에 하드코딩된 문구 금지',
      fr: 'Aucune copie en dur dans le renderer',
      de: 'Kein hartcodierter Text im Renderer',
      es: 'Sin texto hardcodeado en renderer',
      pt: 'Sem texto hardcoded no renderer',
    },
    tone: 'cyan',
  },
  {
    cmd: 'check:i18n',
    desc: {
      en: '8-lang key parity + HTML drift check',
      zh: '8 语言 key 对齐 + HTML 漂移检查',
      ja: '8言語キー一致 + HTML ドリフトチェック',
      ko: '8개 언어 키 일치 + HTML 드리프트 체크',
      fr: 'Parité clés 8 langues + check dérive HTML',
      de: '8-Sprachen-Key-Parität + HTML-Drift-Check',
      es: 'Paridad de claves 8 idiomas + check drift HTML',
      pt: 'Paridade de chaves 8 idiomas + check drift HTML',
    },
    tone: 'purple',
  },
  {
    cmd: 'no-restricted-imports',
    desc: {
      en: 'Renderer banned: electron/fs/ws/node:*',
      zh: '渲染层禁 electron/fs/ws/node:*',
      ja: 'レンダラー禁止: electron/fs/ws/node:*',
      ko: '렌더러 금지: electron/fs/ws/node:*',
      fr: 'Renderer interdit : electron/fs/ws/node:*',
      de: 'Renderer verboten: electron/fs/ws/node:*',
      es: 'Renderer prohibido: electron/fs/ws/node:*',
      pt: 'Renderer proibido: electron/fs/ws/node:*',
    },
    tone: 'yellow',
  },
  {
    cmd: 'TypeScript strict',
    desc: {
      en: 'any → error, full strict typecheck',
      zh: 'any → error，全包 typecheck',
      ja: 'any → エラー、完全 strict typecheck',
      ko: 'any → error, 전체 strict typecheck',
      fr: 'any → erreur, typecheck strict complet',
      de: 'any → Fehler, vollständiger strenger Typecheck',
      es: 'any → error, typecheck estricto completo',
      pt: 'any → error, typecheck strict completo',
    },
    tone: 'green',
  },
];

const pipeline: { stage: string; desc: I18nText; tone: Tone }[] = [
  {
    stage: 'Pre-commit',
    desc: {
      en: 'Husky: lint-staged + arch check',
      zh: 'Husky: lint-staged + 架构检查',
      ja: 'Husky: lint-staged + アーキテクチャチェック',
      ko: 'Husky: lint-staged + 아키텍처 검사',
      fr: 'Husky : lint-staged + vérif archi',
      de: 'Husky: lint-staged + Architektur-Check',
      es: 'Husky: lint-staged + check arquitectura',
      pt: 'Husky: lint-staged + check arquitetura',
    },
    tone: 'green',
  },
  {
    stage: 'PR Check',
    desc: {
      en: '8 quality gates + coverage tests + 3-platform build',
      zh: '8 项质量门 + coverage 测试 + 3 平台构建',
      ja: '8つの品質ゲート + カバレッジテスト + 3プラットフォームビルド',
      ko: '8개 품질 게이트 + 커버리지 테스트 + 3 플랫폼 빌드',
      fr: '8 portes qualité + tests couverture + build 3 plateformes',
      de: '8 Quality Gates + Coverage-Tests + 3-Plattform-Build',
      es: '8 puertas de calidad + tests cobertura + build 3 plataformas',
      pt: '8 portas de qualidade + testes cobertura + build 3 plataformas',
    },
    tone: 'cyan',
  },
  {
    stage: 'E2E',
    desc: {
      en: 'Playwright: Smoke + Gateway (Docker)',
      zh: 'Playwright: Smoke + Gateway (Docker)',
      ja: 'Playwright: Smoke + Gateway (Docker)',
      ko: 'Playwright: Smoke + Gateway (Docker)',
      fr: 'Playwright : Smoke + Gateway (Docker)',
      de: 'Playwright: Smoke + Gateway (Docker)',
      es: 'Playwright: Smoke + Gateway (Docker)',
      pt: 'Playwright: Smoke + Gateway (Docker)',
    },
    tone: 'purple',
  },
  {
    stage: 'Release',
    desc: {
      en: 'Version verify → Sign → Notarize → Publish',
      zh: '版本校验 → 签名 → 公证 → 发布',
      ja: 'バージョン検証 → 署名 → 公証 → 公開',
      ko: '버전 검증 → 서명 → 공증 → 게시',
      fr: 'Vérif version → Signer → Notariser → Publier',
      de: 'Versionscheck → Signieren → Notarisieren → Veröffentlichen',
      es: 'Verificar versión → Firmar → Notarizar → Publicar',
      pt: 'Verificar versão → Assinar → Notarizar → Publicar',
    },
    tone: 'yellow',
  },
];
</script>

<template>
  <div class="cw-split--media items-stretch mt-4">
    <div class="flex flex-col gap-2">
      <div v-for="g in guards" :key="g.cmd" class="cw-guard-row" :data-tone="g.tone">
        <span class="cw-guard-cmd">{{ g.cmd }}</span>
        <span class="cw-guard-desc">{{ t(g.desc) }}</span>
      </div>
    </div>

    <div class="cw-pipeline">
      <div v-for="(p, i) in pipeline" :key="p.stage" class="cw-pipeline-step" :data-tone="p.tone">
        <span class="cw-pipeline-num">{{ i + 1 }}</span>
        <div class="cw-pipeline-body">
          <strong class="cw-pipeline-stage">{{ p.stage }}</strong>
          <span class="cw-pipeline-desc">{{ t(p.desc) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
