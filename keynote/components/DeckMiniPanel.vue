<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'green' | 'cyan' | 'purple' | 'yellow' | 'red';
    neutral?: boolean;
    enTitle: string;
    zhTitle?: string;
    enBody?: string;
    zhBody?: string;
  }>(),
  {
    tone: 'green',
    neutral: false,
    zhTitle: '',
    enBody: '',
    zhBody: '',
  },
);
</script>

<template>
  <div class="cw-mini-panel" :class="neutral ? 'cw-mini-panel--neutral' : ''" :data-tone="tone">
    <strong class="en cw-mini-panel-title">{{ enTitle }}</strong>
    <strong v-if="zhTitle" class="zh cw-mini-panel-title">{{ zhTitle }}</strong>
    <p v-if="enBody" class="en cw-mini-panel-copy" v-html="enBody"></p>
    <p v-if="zhBody" class="zh cw-mini-panel-copy" v-html="zhBody"></p>
  </div>
</template>
