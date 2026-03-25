<script setup lang="ts">
withDefaults(
  defineProps<{
    marginClass?: string;
  }>(),
  {
    marginClass: '',
  },
);
</script>

<template>
  <div :class="['cw-split', 'cw-split--media', marginClass]">
    <div>
      <slot name="left" />
    </div>
    <div class="cw-stack-md">
      <slot name="right" />
    </div>
  </div>
</template>
