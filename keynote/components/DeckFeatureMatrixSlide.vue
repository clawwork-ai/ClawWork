<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

interface Feature {
  icon: string;
  name: I18nText;
  tone: Tone;
  stars: number;
  ver: string;
}

const features: Feature[] = [
  {
    icon: '🛡',
    name: {
      en: 'Tool Approval',
      zh: '工具审批',
      ja: 'ツール承認',
      ko: '도구 승인',
      fr: 'Approbation d’outil',
      de: 'Werkzeug-Genehmigung',
      es: 'Aprobación de herramientas',
      pt: 'Aprovação de ferramenta',
    },
    tone: 'red',
    stars: 2,
    ver: 'v0.0.6',
  },
  {
    icon: '🔗',
    name: {
      en: 'Multi-Gateway',
      zh: '多网关',
      ja: 'マルチ Gateway',
      ko: '멀티 Gateway',
      fr: 'Multi-Gateway',
      de: 'Multi-Gateway',
      es: 'Multi-Gateway',
      pt: 'Multi-Gateway',
    },
    tone: 'green',
    stars: 2,
    ver: 'v0.0.3',
  },
  {
    icon: '⏰',
    name: {
      en: 'Cron Jobs',
      zh: '定时任务',
      ja: '定時ジョブ',
      ko: '크론 작업',
      fr: 'Tâches planifiées',
      de: 'Cron-Jobs',
      es: 'Tareas programadas',
      pt: 'Tarefas agendadas',
    },
    tone: 'yellow',
    stars: 2,
    ver: 'v0.0.11',
  },
  {
    icon: '📊',
    name: {
      en: 'Token Dashboard',
      zh: '用量面板',
      ja: 'Token ダッシュボード',
      ko: 'Token 대시보드',
      fr: 'Tableau Token',
      de: 'Token-Dashboard',
      es: 'Panel de Token',
      pt: 'Painel de Token',
    },
    tone: 'green',
    stars: 2,
    ver: 'v0.0.7',
  },
  {
    icon: '🧠',
    name: {
      en: 'Thinking Depth',
      zh: '思考深度',
      ja: '思考深度',
      ko: '사고 깊이',
      fr: 'Profondeur de réflexion',
      de: 'Denktiefe',
      es: 'Profundidad de pensamiento',
      pt: 'Profundidade de raciocínio',
    },
    tone: 'purple',
    stars: 2,
    ver: 'v0.0.3',
  },
  {
    icon: '🤖',
    name: {
      en: 'Agent Manager',
      zh: 'Agent 管理',
      ja: 'Agent マネージャー',
      ko: 'Agent 관리',
      fr: 'Gestionnaire d’Agent',
      de: 'Agent-Verwaltung',
      es: 'Gestor de Agent',
      pt: 'Gerenciador de Agent',
    },
    tone: 'cyan',
    stars: 1,
    ver: 'v0.0.10',
  },
  {
    icon: '@',
    name: {
      en: '@ Mentions',
      zh: '跨任务引用',
      ja: '@ メンション',
      ko: '@ 멘션',
      fr: '@ Mentions',
      de: '@ Erwähnungen',
      es: '@ Menciones',
      pt: '@ Menções',
    },
    tone: 'cyan',
    stars: 1,
    ver: 'v0.0.7',
  },
  {
    icon: '⌘',
    name: {
      en: 'Slash Commands',
      zh: '斜杠命令',
      ja: 'スラッシュコマンド',
      ko: '슬래시 커맨드',
      fr: 'Commandes slash',
      de: 'Slash-Befehle',
      es: 'Comandos slash',
      pt: 'Comandos slash',
    },
    tone: 'green',
    stars: 1,
    ver: 'v0.0.4',
  },
  {
    icon: '📂',
    name: {
      en: 'File Watching',
      zh: '本地文件监听',
      ja: 'ファイル監視',
      ko: '파일 감시',
      fr: 'Surveillance de fichiers',
      de: 'Dateiüberwachung',
      es: 'Vigilancia de archivos',
      pt: 'Monitoramento de arquivos',
    },
    tone: 'yellow',
    stars: 1,
    ver: 'v0.0.11',
  },
  {
    icon: '🔀',
    name: {
      en: 'Model Switch',
      zh: '模型切换',
      ja: 'モデル切替',
      ko: '모델 전환',
      fr: 'Switch de modèle',
      de: 'Modellwechsel',
      es: 'Cambio de modelo',
      pt: 'Troca de modelo',
    },
    tone: 'cyan',
    stars: 1,
    ver: 'v0.0.3',
  },
  {
    icon: '📋',
    name: {
      en: 'Tool Logs',
      zh: '工具执行记录',
      ja: 'ツールログ',
      ko: '도구 로그',
      fr: 'Logs d’outil',
      de: 'Werkzeug-Logs',
      es: 'Logs de herramientas',
      pt: 'Logs de ferramenta',
    },
    tone: 'yellow',
    stars: 1,
    ver: 'v0.0.2',
  },
  {
    icon: '🎙',
    name: {
      en: 'Voice Input',
      zh: '语音输入',
      ja: '音声入力',
      ko: '음성 입력',
      fr: 'Entrée vocale',
      de: 'Spracheingabe',
      es: 'Entrada de voz',
      pt: 'Entrada de voz',
    },
    tone: 'purple',
    stars: 1,
    ver: 'v0.0.4',
  },
  {
    icon: '📤',
    name: {
      en: 'Session Export',
      zh: '会话导出',
      ja: 'セッションエクスポート',
      ko: '세션 내보내기',
      fr: 'Export de session',
      de: 'Sitzungsexport',
      es: 'Exportar sesión',
      pt: 'Exportar sessão',
    },
    tone: 'purple',
    stars: 0,
    ver: 'v0.0.10',
  },
  {
    icon: '🔄',
    name: {
      en: 'Auto-Update',
      zh: '自动更新',
      ja: '自動更新',
      ko: '자동 업데이트',
      fr: 'Mise à jour auto',
      de: 'Auto-Update',
      es: 'Actualización auto',
      pt: 'Atualização auto',
    },
    tone: 'green',
    stars: 0,
    ver: 'v0.0.10',
  },
  {
    icon: '🔍',
    name: {
      en: 'Full-Text Search',
      zh: '全文搜索',
      ja: '全文検索',
      ko: '전문 검색',
      fr: 'Recherche plein texte',
      de: 'Volltextsuche',
      es: 'Búsqueda de texto completo',
      pt: 'Busca textual',
    },
    tone: 'purple',
    stars: 0,
    ver: 'v0.0.8',
  },
  {
    icon: '🔔',
    name: {
      en: 'Notifications',
      zh: '桌面通知',
      ja: 'デスクトップ通知',
      ko: '데스크톱 알림',
      fr: 'Notifications',
      de: 'Benachrichtigungen',
      es: 'Notificaciones',
      pt: 'Notificações',
    },
    tone: 'purple',
    stars: 0,
    ver: 'v0.0.11',
  },
  {
    icon: '🏷',
    name: {
      en: 'Device Identity',
      zh: '设备标识',
      ja: 'デバイス識別',
      ko: '디바이스 식별',
      fr: 'Identité appareil',
      de: 'Geräte-Identität',
      es: 'Identidad de dispositivo',
      pt: 'Identidade do dispositivo',
    },
    tone: 'yellow',
    stars: 0,
    ver: 'v0.0.9',
  },
  {
    icon: '🌐',
    name: {
      en: '8 Languages',
      zh: '8 种语言',
      ja: '8言語対応',
      ko: '8개 언어',
      fr: '8 langues',
      de: '8 Sprachen',
      es: '8 idiomas',
      pt: '8 idiomas',
    },
    tone: 'green',
    stars: 0,
    ver: 'v0.0.12',
  },
  {
    icon: '📲',
    name: {
      en: 'PWA Mobile',
      zh: 'PWA 移动端',
      ja: 'PWA モバイル',
      ko: 'PWA 모바일',
      fr: 'PWA Mobile',
      de: 'PWA Mobil',
      es: 'PWA Móvil',
      pt: 'PWA Mobile',
    },
    tone: 'green',
    stars: 3,
    ver: 'v0.0.13',
  },
  {
    icon: '🎨',
    name: {
      en: 'Dark / Light',
      zh: '主题切换',
      ja: 'ダーク / ライト',
      ko: '다크 / 라이트',
      fr: 'Sombre / Clair',
      de: 'Dunkel / Hell',
      es: 'Oscuro / Claro',
      pt: 'Escuro / Claro',
    },
    tone: 'cyan',
    stars: 0,
    ver: 'v0.0.1',
  },
  {
    icon: '🖼',
    name: {
      en: 'Image Upload',
      zh: '图片上传',
      ja: '画像アップロード',
      ko: '이미지 업로드',
      fr: 'Upload d’image',
      de: 'Bild-Upload',
      es: 'Subida de imagen',
      pt: 'Upload de imagem',
    },
    tone: 'cyan',
    stars: 0,
    ver: 'v0.0.2',
  },
];

const next: Omit<Feature, 'ver'>[] = [
  {
    icon: '🎯',
    name: {
      en: 'Multi-Agent Task',
      zh: '多 Agent 任务',
      ja: 'マルチ Agent タスク',
      ko: '멀티 Agent 태스크',
      fr: 'Tâche multi-Agent',
      de: 'Multi-Agent-Aufgabe',
      es: 'Tarea multi-Agent',
      pt: 'Tarefa multi-Agent',
    },
    tone: 'purple',
    stars: 3,
  },
];

function starLabel(n: number) {
  return n > 0 ? '★'.repeat(n) : '';
}
</script>

<template>
  <div class="cw-feature-matrix">
    <div v-for="f in features" :key="f.name.en" class="cw-feature-cell" :data-tone="f.tone">
      <div class="cw-feature-cell-main">
        <span class="cw-feature-cell-icon">{{ f.icon }}</span>
        <span class="cw-feature-cell-label">{{ t(f.name) }}</span>
        <span v-if="f.stars" class="cw-feature-cell-stars">{{ starLabel(f.stars) }}</span>
      </div>
      <span class="cw-feature-cell-ver">{{ f.ver }}</span>
    </div>
  </div>
  <div class="cw-feature-next-row">
    <span class="cw-feature-next-tag">NEXT</span>
    <div v-for="n in next" :key="n.name.en" class="cw-feature-cell cw-feature-cell--next" :data-tone="n.tone">
      <span class="cw-feature-cell-icon">{{ n.icon }}</span>
      <span class="cw-feature-cell-label">{{ t(n.name) }}</span>
      <span class="cw-feature-cell-stars">{{ starLabel(n.stars) }}</span>
    </div>
  </div>
</template>
