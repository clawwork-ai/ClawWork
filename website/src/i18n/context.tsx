import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { en, type Translations } from './en';
import { zh } from './zh';

type Locale = 'en' | 'zh';

const translations: Record<Locale, Translations> = { en, zh };

function detectLocale(): Locale {
  const stored = localStorage.getItem('locale');
  if (stored === 'en' || stored === 'zh') return stored;
  const lang = navigator.language.toLowerCase();
  return lang.startsWith('zh') ? 'zh' : 'en';
}

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  toggle: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  const toggle = useCallback(() => {
    setLocale((prev) => {
      const next: Locale = prev === 'en' ? 'zh' : 'en';
      localStorage.setItem('locale', next);
      return next;
    });
  }, []);

  return <I18nContext.Provider value={{ locale, t: translations[locale], toggle }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
