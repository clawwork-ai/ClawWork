<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'green' | 'cyan' | 'purple' | 'yellow' | 'red';
    enTitle: string;
    zhTitle?: string;
    enNote?: string;
    zhNote?: string;
  }>(),
  {
    tone: 'green',
    zhTitle: '',
    enNote: '',
    zhNote: '',
  },
);
</script>

<template>
  <div class="cw-card cw-card--signal" :data-tone="tone">
    <div class="en cw-card-label">{{ enTitle }}</div>
    <div v-if="zhTitle" class="zh cw-card-label">{{ zhTitle }}</div>
    <slot />
    <p v-if="enNote" class="en cw-card-note">{{ enNote }}</p>
    <p v-if="zhNote" class="zh cw-card-note">{{ zhNote }}</p>
  </div>
</template>
