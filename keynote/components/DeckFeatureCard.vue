<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'green' | 'cyan' | 'purple' | 'yellow' | 'red';
    icon: string;
    enTitle: string;
    zhTitle: string;
    enBody: string;
    zhBody: string;
    compact?: boolean;
  }>(),
  {
    tone: 'green',
    compact: false,
  },
);
</script>

<template>
  <div class="cw-card" :class="compact ? 'cw-card--compact' : 'cw-card--feature'" :data-tone="tone">
    <div class="cw-card-icon">{{ icon }}</div>
    <h3 class="en" :class="compact ? 'cw-card-title cw-card-title--compact' : 'cw-card-title'">{{ enTitle }}</h3>
    <h3 class="zh" :class="compact ? 'cw-card-title cw-card-title--compact' : 'cw-card-title'">{{ zhTitle }}</h3>
    <p class="en" :class="compact ? 'cw-card-copy cw-card-copy--compact' : 'cw-card-copy'">{{ enBody }}</p>
    <p class="zh" :class="compact ? 'cw-card-copy cw-card-copy--compact' : 'cw-card-copy'">{{ zhBody }}</p>
  </div>
</template>
