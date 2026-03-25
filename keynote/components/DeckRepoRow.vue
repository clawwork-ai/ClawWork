<script setup lang="ts">
withDefaults(
  defineProps<{
    image: string;
    label: string;
    meta: string;
    badge?: string;
    badgeTone?: 'green' | 'cyan' | 'purple' | 'yellow' | 'red';
  }>(),
  {
    badge: '',
    badgeTone: 'cyan',
  },
);
</script>

<template>
  <div class="cw-project-row">
    <img :src="image" class="cw-project-icon" :alt="label" />
    <span v-if="badge" class="cw-project-badge" :data-tone="badgeTone">{{ badge }}</span>
    <span class="cw-project-label">{{ label }}</span>
    <span class="cw-project-meta">{{ meta }}</span>
  </div>
</template>
