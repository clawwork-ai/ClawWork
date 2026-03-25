<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'green' | 'cyan' | 'purple' | 'yellow' | 'red';
    enText: string;
    zhText: string;
  }>(),
  {
    tone: 'green',
  },
);
</script>

<template>
  <div class="cw-mini-panel cw-mini-panel--neutral" :data-tone="tone">
    <div class="cw-cluster-md">
      <div class="cw-release-dot cw-release-dot--inline"></div>
      <span class="en">{{ enText }}</span>
      <span class="zh">{{ zhText }}</span>
    </div>
  </div>
</template>
