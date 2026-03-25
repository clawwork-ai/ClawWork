<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const lang = ref(navigator.language.startsWith('zh') ? 'zh' : 'en');

function toggle() {
  lang.value = lang.value === 'en' ? 'zh' : 'en';
  document.documentElement.setAttribute('data-lang', lang.value);
}

function onKey(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'l' || e.key === 'L') toggle();
}

onMounted(() => {
  document.documentElement.setAttribute('data-lang', lang.value);
  window.addEventListener('keydown', onKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
});
</script>

<template>
  <button @click="toggle" class="lang-switch">
    {{ lang === 'en' ? 'EN' : '中' }}
  </button>
</template>
