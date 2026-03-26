import { ref } from 'vue';

export const LANGS = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'pt'] as const;
export type Lang = (typeof LANGS)[number];
export type I18nText = { en: string } & { [K in Exclude<Lang, 'en'>]?: string };
export type Tone = 'green' | 'cyan' | 'purple' | 'yellow' | 'red';

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

function detect(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const prefix = navigator.language.slice(0, 2);
  return (LANGS as readonly string[]).includes(prefix) ? (prefix as Lang) : 'en';
}

export const lang = ref<Lang>(detect());

export function t(text: I18nText): string {
  return text[lang.value] ?? text.en;
}

export function setLang(l: Lang) {
  lang.value = l;
}

export function nextLang() {
  const i = LANGS.indexOf(lang.value);
  lang.value = LANGS[(i + 1) % LANGS.length];
}
