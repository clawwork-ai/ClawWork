<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

const days: { day: I18nText; prs: number; phase: I18nText; tone: Tone }[] = [
  {
    day: {
      en: 'Fri 3/13',
      zh: '周五 3/13',
      ja: '金 3/13',
      ko: '금 3/13',
      fr: 'Ven 13/3',
      de: 'Fr 13.3.',
      es: 'Vie 13/3',
      pt: 'Sex 13/3',
    },
    prs: 11,
    phase: {
      en: 'Kickoff',
      zh: '起步',
      ja: 'キックオフ',
      ko: '킥오프',
      fr: 'Lancement',
      de: 'Kickoff',
      es: 'Inicio',
      pt: 'Início',
    },
    tone: 'green',
  },
  {
    day: {
      en: 'Sat 3/14',
      zh: '周六 3/14',
      ja: '土 3/14',
      ko: '토 3/14',
      fr: 'Sam 14/3',
      de: 'Sa 14.3.',
      es: 'Sáb 14/3',
      pt: 'Sáb 14/3',
    },
    prs: 11,
    phase: {
      en: 'Accelerate',
      zh: '加速',
      ja: '加速',
      ko: '가속',
      fr: 'Accélération',
      de: 'Beschleunigung',
      es: 'Aceleración',
      pt: 'Aceleração',
    },
    tone: 'cyan',
  },
  {
    day: {
      en: 'Sun 3/15',
      zh: '周日 3/15',
      ja: '日 3/15',
      ko: '일 3/15',
      fr: 'Dim 15/3',
      de: 'So 15.3.',
      es: 'Dom 15/3',
      pt: 'Dom 15/3',
    },
    prs: 4,
    phase: {
      en: 'Accelerate',
      zh: '加速',
      ja: '加速',
      ko: '가속',
      fr: 'Accélération',
      de: 'Beschleunigung',
      es: 'Aceleración',
      pt: 'Aceleração',
    },
    tone: 'cyan',
  },
  {
    day: {
      en: 'Mon 3/16',
      zh: '周一 3/16',
      ja: '月 3/16',
      ko: '월 3/16',
      fr: 'Lun 16/3',
      de: 'Mo 16.3.',
      es: 'Lun 16/3',
      pt: 'Seg 16/3',
    },
    prs: 25,
    phase: {
      en: 'Explosion',
      zh: '爆发',
      ja: '爆発',
      ko: '폭발',
      fr: 'Explosion',
      de: 'Explosion',
      es: 'Explosión',
      pt: 'Explosão',
    },
    tone: 'purple',
  },
  {
    day: {
      en: 'Tue 3/17',
      zh: '周二 3/17',
      ja: '火 3/17',
      ko: '화 3/17',
      fr: 'Mar 17/3',
      de: 'Di 17.3.',
      es: 'Mar 17/3',
      pt: 'Ter 17/3',
    },
    prs: 14,
    phase: {
      en: 'Infra',
      zh: '基建',
      ja: 'インフラ',
      ko: '인프라',
      fr: 'Infra',
      de: 'Infra',
      es: 'Infra',
      pt: 'Infra',
    },
    tone: 'yellow',
  },
  {
    day: {
      en: 'Wed 3/18',
      zh: '周三 3/18',
      ja: '水 3/18',
      ko: '수 3/18',
      fr: 'Mer 18/3',
      de: 'Mi 18.3.',
      es: 'Mié 18/3',
      pt: 'Qua 18/3',
    },
    prs: 14,
    phase: {
      en: 'Polish',
      zh: '打磨',
      ja: '磨き上げ',
      ko: '다듬기',
      fr: 'Polissage',
      de: 'Feinschliff',
      es: 'Pulido',
      pt: 'Polimento',
    },
    tone: 'cyan',
  },
  {
    day: {
      en: 'Thu 3/19',
      zh: '周四 3/19',
      ja: '木 3/19',
      ko: '목 3/19',
      fr: 'Jeu 19/3',
      de: 'Do 19.3.',
      es: 'Jue 19/3',
      pt: 'Qui 19/3',
    },
    prs: 18,
    phase: {
      en: 'Security',
      zh: '安全',
      ja: 'セキュリティ',
      ko: '보안',
      fr: 'Sécurité',
      de: 'Sicherheit',
      es: 'Seguridad',
      pt: 'Segurança',
    },
    tone: 'red',
  },
  {
    day: {
      en: 'Sun 3/22',
      zh: '周日 3/22',
      ja: '日 3/22',
      ko: '일 3/22',
      fr: 'Dim 22/3',
      de: 'So 22.3.',
      es: 'Dom 22/3',
      pt: 'Dom 22/3',
    },
    prs: 4,
    phase: {
      en: 'Stabilize',
      zh: '稳定',
      ja: '安定化',
      ko: '안정화',
      fr: 'Stabilisation',
      de: 'Stabilisierung',
      es: 'Estabilización',
      pt: 'Estabilização',
    },
    tone: 'yellow',
  },
  {
    day: {
      en: 'Mon 3/23',
      zh: '周一 3/23',
      ja: '月 3/23',
      ko: '월 3/23',
      fr: 'Lun 23/3',
      de: 'Mo 23.3.',
      es: 'Lun 23/3',
      pt: 'Seg 23/3',
    },
    prs: 17,
    phase: {
      en: 'Ship v10',
      zh: '发版',
      ja: 'v10 出荷',
      ko: 'v10 릴리스',
      fr: 'Livrer v10',
      de: 'Ship v10',
      es: 'Lanzar v10',
      pt: 'Lançar v10',
    },
    tone: 'green',
  },
  {
    day: {
      en: 'Tue 3/24',
      zh: '周二 3/24',
      ja: '火 3/24',
      ko: '화 3/24',
      fr: 'Mar 24/3',
      de: 'Di 24.3.',
      es: 'Mar 24/3',
      pt: 'Ter 24/3',
    },
    prs: 8,
    phase: {
      en: 'Expand',
      zh: '扩展',
      ja: '拡張',
      ko: '확장',
      fr: 'Expansion',
      de: 'Erweiterung',
      es: 'Expansión',
      pt: 'Expansão',
    },
    tone: 'cyan',
  },
  {
    day: {
      en: 'Wed 3/25',
      zh: '周三 3/25',
      ja: '水 3/25',
      ko: '수 3/25',
      fr: 'Mer 25/3',
      de: 'Mi 25.3.',
      es: 'Mié 25/3',
      pt: 'Qua 25/3',
    },
    prs: 9,
    phase: {
      en: 'i18n + DX',
      zh: '国际化',
      ja: 'i18n + DX',
      ko: 'i18n + DX',
      fr: 'i18n + DX',
      de: 'i18n + DX',
      es: 'i18n + DX',
      pt: 'i18n + DX',
    },
    tone: 'purple',
  },
  {
    day: {
      en: 'Thu 3/26',
      zh: '周四 3/26',
      ja: '木 3/26',
      ko: '목 3/26',
      fr: 'Jeu 26/3',
      de: 'Do 26.3.',
      es: 'Jue 26/3',
      pt: 'Qui 26/3',
    },
    prs: 8,
    phase: {
      en: 'Toolchain',
      zh: '工具链',
      ja: 'ツールチェーン',
      ko: '툴체인',
      fr: 'Outillage',
      de: 'Toolchain',
      es: 'Cadena de herramientas',
      pt: 'Toolchain',
    },
    tone: 'red',
  },
  {
    day: {
      en: 'Fri 3/27',
      zh: '周五 3/27',
      ja: '金 3/27',
      ko: '금 3/27',
      fr: 'Ven 27/3',
      de: 'Fr 27.3.',
      es: 'Vie 27/3',
      pt: 'Sex 27/3',
    },
    prs: 18,
    phase: {
      en: 'Ship v13',
      zh: '发布 v13',
      ja: 'v13 出荷',
      ko: 'v13 릴리스',
      fr: 'Livrer v13',
      de: 'Ship v13',
      es: 'Lanzar v13',
      pt: 'Lançar v13',
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
              ja: 'マージ済み PR 総数',
              ko: '머지된 PR 총수',
              fr: 'PR mergées au total',
              de: 'Gemergte PRs gesamt',
              es: 'PRs mergeados en total',
              pt: 'PRs mergeados no total',
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
              ja: '安定版リリース',
              ko: '정식 릴리스',
              fr: 'Releases stables',
              de: 'Stabile Releases',
              es: 'Releases estables',
              pt: 'Releases estáveis',
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
