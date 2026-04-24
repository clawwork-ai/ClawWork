<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

withDefaults(
  defineProps<{
    tone?: Tone;
    neutral?: boolean;
    compact?: boolean;
    title: I18nText;
    body?: I18nText;
  }>(),
  {
    tone: 'green',
    neutral: false,
    compact: false,
  },
);
</script>

<template>
  <div
    class="cw-mini-panel"
    :class="{ 'cw-mini-panel--neutral': neutral, 'cw-mini-panel--compact': compact }"
    :data-tone="tone"
  >
    <strong class="cw-mini-panel-title">{{ t(title) }}</strong>
    <p v-if="body" class="cw-mini-panel-copy">{{ t(body) }}</p>
    <p v-else-if="$slots.default" class="cw-mini-panel-copy"><slot /></p>
  </div>
</template>
