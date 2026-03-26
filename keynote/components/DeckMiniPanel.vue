<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

withDefaults(
  defineProps<{
    tone?: Tone;
    neutral?: boolean;
    title: I18nText;
    body?: I18nText;
  }>(),
  {
    tone: 'green',
    neutral: false,
  },
);
</script>

<template>
  <div class="cw-mini-panel" :class="{ 'cw-mini-panel--neutral': neutral }" :data-tone="tone">
    <strong class="cw-mini-panel-title">{{ t(title) }}</strong>
    <p v-if="body" class="cw-mini-panel-copy">{{ t(body) }}</p>
    <p v-else-if="$slots.default" class="cw-mini-panel-copy"><slot /></p>
  </div>
</template>
