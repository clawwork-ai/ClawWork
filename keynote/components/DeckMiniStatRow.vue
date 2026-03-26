<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

withDefaults(
  defineProps<{
    tone?: Tone;
    text: I18nText;
  }>(),
  {
    tone: 'green',
  },
);
</script>

<template>
  <div class="cw-mini-panel cw-mini-panel--neutral" :data-tone="tone">
    <div class="flex items-center gap-3">
      <div class="cw-release-dot cw-release-dot--inline"></div>
      <span>{{ t(text) }}</span>
    </div>
  </div>
</template>
