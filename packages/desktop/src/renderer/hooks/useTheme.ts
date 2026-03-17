import { useEffect, useState } from 'react';
import { useUiStore } from '../stores/uiStore';

function resolveTheme(theme: 'dark' | 'light' | 'auto'): 'dark' | 'light' {
  if (theme !== 'auto') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    window.clawwork
      .getSettings()
      .then((settings) => {
        if (!active) return;
        if (settings?.theme) {
          setTheme(settings.theme);
        }
      })
      .finally(() => {
        if (active) {
          setSettingsLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolveTheme(theme));

    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  useEffect(() => {
    if (!settingsLoaded) return;
    window.clawwork.updateSettings({ theme });
  }, [settingsLoaded, theme]);
}
