import { SUPPORTED_LANGUAGE_CODES, type LanguageCode } from '@clawwork/shared';

export type Language = LanguageCode;

interface LanguageConfig {
  code: Language;
  label: string;
  intlLocale: string;
  cronstrueLocale: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', label: 'English', intlLocale: 'en', cronstrueLocale: 'en' },
  { code: 'zh', label: '中文', intlLocale: 'zh-CN', cronstrueLocale: 'zh_CN' },
  { code: 'zh-TW', label: '繁體中文', intlLocale: 'zh-TW', cronstrueLocale: 'zh_TW' },
  { code: 'ja', label: '日本語', intlLocale: 'ja', cronstrueLocale: 'ja' },
  { code: 'ko', label: '한국어', intlLocale: 'ko', cronstrueLocale: 'ko' },
  { code: 'pt', label: 'Português', intlLocale: 'pt-BR', cronstrueLocale: 'pt_BR' },
  { code: 'de', label: 'Deutsch', intlLocale: 'de', cronstrueLocale: 'de' },
  { code: 'es', label: 'Español', intlLocale: 'es', cronstrueLocale: 'es' },
];

const CONFIG_MAP = new Map(SUPPORTED_LANGUAGES.map((l) => [l.code, l]));
const EN_CONFIG = CONFIG_MAP.get('en')!;

export function getLanguageConfig(code: string): LanguageConfig {
  return CONFIG_MAP.get(code as Language) ?? EN_CONFIG;
}

export function resolveSystemLanguage(): Language {
  const raw = navigator.language.toLowerCase();

  if (raw === 'zh-tw' || raw === 'zh-hk' || raw === 'zh-hant' || raw.startsWith('zh-hant-')) return 'zh-TW';
  if (raw.startsWith('zh')) return 'zh';

  const primary = raw.split('-')[0];
  if ((SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(primary)) return primary as Language;

  return 'en';
}
