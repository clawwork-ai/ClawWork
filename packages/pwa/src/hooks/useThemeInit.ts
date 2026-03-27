import { useEffect } from 'react';
import { useUiStore } from '../stores/hooks';
import { THEME_STORAGE_KEY } from '../lib/constants';

type ResolvedTheme = 'dark' | 'light';

function resolve(theme: string): ResolvedTheme {
  if (theme === 'dark' || theme === 'light') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyToDOM(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(root).getPropertyValue('--bg-primary').trim();
    if (bg) meta.setAttribute('content', bg);
  }
}

export function useThemeInit(): void {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    applyToDOM(resolve(theme));
    if (theme === 'dark' || theme === 'light') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {}
    }
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = useUiStore.getState().theme;
      if (current !== 'dark' && current !== 'light') {
        applyToDOM(mq.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
}
