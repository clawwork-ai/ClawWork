<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

withDefaults(
  defineProps<{
    tone?: Tone;
    title: I18nText;
    note?: I18nText;
  }>(),
  {
    tone: 'green',
  },
);
</script>

<template>
  <div class="cw-card cw-card--signal" :data-tone="tone">
    <div class="cw-card-label">{{ t(title) }}</div>
    <slot />
    <p v-if="note" class="cw-card-note">{{ t(note) }}</p>
  </div>
</template>
