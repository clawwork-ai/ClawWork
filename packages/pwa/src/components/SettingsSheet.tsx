import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, LogOut } from 'lucide-react';
import { useUiStore } from '../stores/hooks';
import { SUPPORTED_LANGUAGE_CODES } from '@clawwork/shared';
import { BottomSheet } from './BottomSheet';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  zh: '简体中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  de: 'Deutsch',
  es: 'Español',
};

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export function SettingsSheet({ open, onClose, onSignOut }: SettingsSheetProps) {
  const { t, i18n } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const changeLanguage = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang);
      try {
        localStorage.setItem('clawwork-lang', lang);
      } catch {
        /* storage unavailable */
      }
    },
    [i18n],
  );

  return (
    <BottomSheet open={open} onClose={onClose} maxHeight="70vh" ariaLabel={t('drawer.settings')}>
      <div className="overflow-y-auto px-4 pb-4" style={{ touchAction: 'pan-y' }}>
        <h2 className="type-label py-3" style={{ color: 'var(--text-primary)' }}>
          {t('drawer.settings')}
        </h2>

        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
          <span className="flex-1 text-left type-body">
            {isDark
              ? t('settings.darkMode', { defaultValue: 'Dark Mode' })
              : t('settings.lightMode', { defaultValue: 'Light Mode' })}
          </span>
          <span className="type-support" style={{ color: 'var(--text-muted)' }}>
            {isDark ? '🌙' : '☀️'}
          </span>
        </button>

        <div className="mt-1">
          <div className="flex items-center gap-3 px-3 py-3">
            <Globe size={18} style={{ color: 'var(--text-primary)' }} />
            <span className="type-body" style={{ color: 'var(--text-primary)' }}>
              {t('settings.language', { defaultValue: 'Language' })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 px-1">
            {(SUPPORTED_LANGUAGE_CODES as readonly string[]).map((code) => {
              const active = i18n.resolvedLanguage === code;
              return (
                <button
                  key={code}
                  onClick={() => changeLanguage(code)}
                  className="rounded-lg px-3 py-2 text-left type-support transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--bg-hover)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {LANGUAGE_LABELS[code] ?? code}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={18} />
            <span className="type-body">{t('drawer.signOut')}</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
