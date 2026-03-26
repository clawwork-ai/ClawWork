<script setup lang="ts">
const features = [
  { icon: '🛡', zh: '工具审批', en: 'Tool Approval', tone: 'red' as const, stars: 2, ver: 'v0.0.6' },
  { icon: '🔗', zh: '多网关', en: 'Multi-Gateway', tone: 'green' as const, stars: 2, ver: 'v0.0.3' },
  { icon: '⏰', zh: '定时任务', en: 'Cron Jobs', tone: 'yellow' as const, stars: 2, ver: 'v0.0.11' },
  { icon: '📊', zh: '用量面板', en: 'Token Dashboard', tone: 'green' as const, stars: 2, ver: 'v0.0.7' },
  { icon: '🧠', zh: '思考深度', en: 'Thinking Depth', tone: 'purple' as const, stars: 2, ver: 'v0.0.3' },
  { icon: '🤖', zh: 'Agent 管理', en: 'Agent Manager', tone: 'cyan' as const, stars: 1, ver: 'v0.0.10' },
  { icon: '@', zh: '跨任务引用', en: '@ Mentions', tone: 'cyan' as const, stars: 1, ver: 'v0.0.7' },
  { icon: '⌘', zh: '斜杠命令', en: 'Slash Commands', tone: 'green' as const, stars: 1, ver: 'v0.0.4' },
  { icon: '📂', zh: '本地文件监听', en: 'File Watching', tone: 'yellow' as const, stars: 1, ver: 'v0.0.11' },
  { icon: '🔀', zh: '模型切换', en: 'Model Switch', tone: 'cyan' as const, stars: 1, ver: 'v0.0.3' },
  { icon: '📋', zh: '工具执行记录', en: 'Tool Logs', tone: 'yellow' as const, stars: 1, ver: 'v0.0.2' },
  { icon: '🎙', zh: '语音输入', en: 'Voice Input', tone: 'purple' as const, stars: 1, ver: 'v0.0.4' },
  { icon: '📤', zh: '会话导出', en: 'Session Export', tone: 'purple' as const, stars: 0, ver: 'v0.0.10' },
  { icon: '🔄', zh: '自动更新', en: 'Auto-Update', tone: 'green' as const, stars: 0, ver: 'v0.0.10' },
  { icon: '🔍', zh: '全文搜索', en: 'Full-Text Search', tone: 'purple' as const, stars: 0, ver: 'v0.0.8' },
  { icon: '🔔', zh: '桌面通知', en: 'Notifications', tone: 'purple' as const, stars: 0, ver: 'v0.0.11' },
  { icon: '🏷', zh: '设备标识', en: 'Device Identity', tone: 'yellow' as const, stars: 0, ver: 'v0.0.9' },
  { icon: '🌐', zh: '8 种语言', en: '8 Languages', tone: 'green' as const, stars: 0, ver: 'v0.0.12' },
  { icon: '🎨', zh: '主题切换', en: 'Dark / Light', tone: 'cyan' as const, stars: 0, ver: 'v0.0.1' },
  { icon: '🖼', zh: '图片上传', en: 'Image Upload', tone: 'cyan' as const, stars: 0, ver: 'v0.0.2' },
];

const next = [
  { icon: '📲', zh: 'PWA 移动端', en: 'PWA Mobile', tone: 'green' as const, stars: 3 },
  { icon: '🎯', zh: '多 Agent 任务', en: 'Multi-Agent Task', tone: 'purple' as const, stars: 3 },
];

function starLabel(n: number) {
  return n > 0 ? '★'.repeat(n) : '';
}
</script>

<template>
  <div class="cw-feature-matrix">
    <div v-for="f in features" :key="f.en" class="cw-feature-cell" :data-tone="f.tone">
      <div class="cw-feature-cell-main">
        <span class="cw-feature-cell-icon">{{ f.icon }}</span>
        <span class="en cw-feature-cell-label">{{ f.en }}</span>
        <span class="zh cw-feature-cell-label">{{ f.zh }}</span>
        <span v-if="f.stars" class="cw-feature-cell-stars">{{ starLabel(f.stars) }}</span>
      </div>
      <span class="cw-feature-cell-ver">{{ f.ver }}</span>
    </div>
  </div>
  <div class="cw-feature-next-row">
    <span class="cw-feature-next-tag">NEXT</span>
    <div v-for="n in next" :key="n.en" class="cw-feature-cell cw-feature-cell--next" :data-tone="n.tone">
      <span class="cw-feature-cell-icon">{{ n.icon }}</span>
      <span class="en cw-feature-cell-label">{{ n.en }}</span>
      <span class="zh cw-feature-cell-label">{{ n.zh }}</span>
      <span class="cw-feature-cell-stars">{{ starLabel(n.stars) }}</span>
    </div>
  </div>
</template>
