<script setup>
import { ref, onMounted } from 'vue';
const props = defineProps({
  repo: { type: String, required: true },
  prefix: { type: String, default: 'v' },
});
const tag = ref('…');
onMounted(async () => {
  try {
    const r = await fetch(`https://api.github.com/repos/${props.repo}/releases?per_page=1`);
    const d = await r.json();
    tag.value = d[0]?.tag_name || '—';
  } catch {
    tag.value = '—';
  }
});
</script>

<template>
  <span>{{ tag }}</span>
</template>
