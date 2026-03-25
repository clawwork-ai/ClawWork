import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useUiStore, type Theme, type DensityMode } from '@/stores/uiStore';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  density: DensityMode;
  setDensity: (density: DensityMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function resolveThemeMode(theme: Theme): 'dark' | 'light' {
  if (theme !== 'auto') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const resolvedTheme = useMemo(() => resolveThemeMode(theme), [theme]);

  useEffect(() => {
    let active = true;

    window.clawwork
      .getSettings()
      .then((settings) => {
        if (!active) return;
        if (settings?.theme) {
          setTheme(settings.theme);
        }
        if (settings?.density) {
          setDensity(settings.density);
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
  }, [setTheme, setDensity]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-density', density);
    root.style.colorScheme = resolvedTheme;

    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      root.setAttribute('data-theme', event.matches ? 'dark' : 'light');
      root.style.colorScheme = event.matches ? 'dark' : 'light';
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [density, resolvedTheme, theme]);

  useEffect(() => {
    if (!settingsLoaded) return;
    window.clawwork.updateSettings({ theme });
  }, [settingsLoaded, theme]);

  useEffect(() => {
    if (!settingsLoaded) return;
    window.clawwork.updateSettings({ density });
  }, [settingsLoaded, density]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function useResolvedTheme() {
  return useTheme().resolvedTheme;
}
