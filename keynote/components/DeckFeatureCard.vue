<script setup lang="ts">
import { t, type I18nText, type Tone } from '../composables/i18n';

withDefaults(
  defineProps<{
    tone?: Tone;
    icon: string;
    title: I18nText;
    body: I18nText;
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
    <h3 class="cw-card-title" :class="{ 'cw-card-title--compact': compact }">{{ t(title) }}</h3>
    <p class="cw-card-copy" :class="{ 'cw-card-copy--compact': compact }">{{ t(body) }}</p>
  </div>
</template>
