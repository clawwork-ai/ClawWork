<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'green' | 'cyan' | 'purple' | 'yellow' | 'red';
    version: string;
    enText: string;
    zhText: string;
  }>(),
  {
    tone: 'green',
  },
);
</script>

<template>
  <div class="cw-release-item" :data-tone="tone">
    <div class="cw-release-dot"></div>
    <div class="cw-release-copy">
      <span class="cw-release-version">{{ version }}</span>
      <span class="en"> {{ enText }}</span>
      <span class="zh"> {{ zhText }}</span>
    </div>
  </div>
</template>
