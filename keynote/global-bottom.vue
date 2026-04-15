<script setup lang="ts">
import { ref } from 'vue';
import { lang, setLang, LANGS, LANG_LABELS, type Lang } from './composables/i18n';

const open = ref(false);

function pick(l: Lang) {
  setLang(l);
  open.value = false;
}
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
