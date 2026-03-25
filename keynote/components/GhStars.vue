<script setup>
import { ref, onMounted } from 'vue';
const props = defineProps({ repo: { type: String, required: true } });
const stars = ref('…');
onMounted(async () => {
  try {
    const r = await fetch(`https://api.github.com/repos/${props.repo}`);
    const d = await r.json();
    const n = d.stargazers_count;
    stars.value = n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  } catch {
    stars.value = '—';
  }
});
</script>

<template>
  <span>⭐ {{ stars }}</span>
</template>
