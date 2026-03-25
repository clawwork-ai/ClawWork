import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import pt from './locales/pt.json';
import de from './locales/de.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  'zh-TW': { translation: zhTW },
  ja: { translation: ja },
  ko: { translation: ko },
  pt: { translation: pt },
  de: { translation: de },
  es: { translation: es },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
