<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { lang, nextLang, setLang, LANGS, LANG_LABELS, type Lang } from './composables/i18n';

const open = ref(false);

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'l' || e.key === 'L') {
    nextLang();
    open.value = false;
  }
}

function pick(l: Lang) {
  setLang(l);
  open.value = false;
}

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="lang-anchor">
    <button class="lang-switch" @click="open = !open">
      {{ LANG_LABELS[lang] }}
    </button>
    <div v-if="open" class="lang-menu">
      <button
        v-for="l in LANGS"
        :key="l"
        class="lang-option"
        :class="{ 'lang-option--active': l === lang }"
        @click="pick(l)"
      >
        {{ LANG_LABELS[l] }}
      </button>
    </div>
  </div>
</template>
