import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import de from './locales/de.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

function detectLanguage(): string {
  try {
    const stored = localStorage.getItem('clawwork-lang');
    if (stored) return stored;
  } catch {
    /* storage unavailable */
  }
  const nav = navigator.language;
  if (nav.startsWith('zh-TW') || nav.startsWith('zh-Hant')) return 'zh-TW';
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('ko')) return 'ko';
  if (nav.startsWith('de')) return 'de';
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('pt')) return 'pt';
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    'zh-TW': { translation: zhTW },
    ja: { translation: ja },
    ko: { translation: ko },
    de: { translation: de },
    es: { translation: es },
    pt: { translation: pt },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
