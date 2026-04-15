import { createContext, useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import { useUiStore, type Theme, type DensityMode } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  density: DensityMode;
  setDensity: (density: DensityMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveThemeMode(theme: Theme): 'dark' | 'light' {
  if (theme !== 'auto') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);
  const settingsTheme = useSettingsStore((s) => s.settings?.theme);
  const settingsDensity = useSettingsStore((s) => s.settings?.density);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.load);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resolvedTheme = useMemo(() => resolveThemeMode(theme), [theme]);
  const hydratedFromSettingsRef = useRef(false);

  useEffect(() => {
    if (settingsLoaded) return;
    void loadSettings().catch(() => {});
  }, [settingsLoaded, loadSettings]);

  useEffect(() => {
    if (hydratedFromSettingsRef.current) return;
    if (!settingsLoaded) return;

    let waitingForHydration = false;
    if (settingsTheme) {
      if (theme !== settingsTheme) {
        setTheme(settingsTheme);
        waitingForHydration = true;
      }
    }
    if (settingsDensity) {
      if (density !== settingsDensity) {
        setDensity(settingsDensity);
        waitingForHydration = true;
      }
    }
    if (waitingForHydration) {
      return;
    }
    hydratedFromSettingsRef.current = true;
  }, [density, settingsDensity, settingsLoaded, settingsTheme, setDensity, setTheme, theme]);

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
    if (!settingsLoaded || !hydratedFromSettingsRef.current) return;
    if (settingsTheme === theme) return;
    void updateSettings({ theme });
  }, [settingsLoaded, settingsTheme, theme, updateSettings]);

  useEffect(() => {
    if (!settingsLoaded || !hydratedFromSettingsRef.current) return;
    if (settingsDensity === density) return;
    void updateSettings({ density });
  }, [density, settingsDensity, settingsLoaded, updateSettings]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}
