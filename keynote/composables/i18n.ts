import { ref, watch } from 'vue';

export const LANGS = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'pt'] as const;
export type Lang = (typeof LANGS)[number];
export type I18nText = { en: string } & { [K in Exclude<Lang, 'en'>]?: string };
export type Tone = 'green' | 'cyan' | 'purple' | 'yellow' | 'red';

const STORAGE_KEY = 'cw-lang';

export const LANG_LABELS: Record<Lang, string> = {
  en: 'EN',
  zh: '中',
  ja: '日',
  ko: '한',
  fr: 'FR',
  de: 'DE',
  es: 'ES',
  pt: 'PT',
};

function isKnown(l: string): l is Lang {
  return (LANGS as readonly string[]).includes(l);
}

function detect(): Lang {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isKnown(saved)) return saved;
  }
  if (typeof navigator === 'undefined') return 'en';
  const prefix = navigator.language.slice(0, 2);
  return isKnown(prefix) ? prefix : 'en';
}

export const lang = ref<Lang>(detect());

watch(lang, (l) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, l);
  }
});

export function t(text: I18nText): string {
  return text[lang.value] ?? text.en;
}

export function setLang(l: Lang) {
  lang.value = l;
}
