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
    icon: '👥',
    name: {
      en: 'Teams',
      zh: '团队',
    },
    tone: 'purple',
    stars: 3,
    ver: 'v0.0.14',
  },
  {
    icon: '🏪',
    name: {
      en: 'TeamsHub',
      zh: '团队市场',
    },
    tone: 'cyan',
    stars: 3,
    ver: 'v0.0.14',
  },
  {
    icon: '🧩',
    name: {
      en: 'Skills',
      zh: '技能',
    },
    tone: 'green',
    stars: 3,
    ver: 'v0.0.14',
  },
  {
    icon: '🛡',
    name: {
      en: 'Tool Approval',
      zh: '工具审批',
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
    },
    tone: 'cyan',
    stars: 0,
    ver: 'v0.0.2',
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
</template>
