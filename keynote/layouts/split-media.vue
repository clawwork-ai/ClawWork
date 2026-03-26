<script setup lang="ts">
withDefaults(defineProps<{ gap?: string }>(), { gap: 'mt-4' });
</script>

<template>
  <div class="slidev-layout">
    <slot />
    <div :class="['cw-split--media', gap]">
      <div>
        <slot name="left" />
      </div>
      <div class="flex flex-col gap-3">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>
