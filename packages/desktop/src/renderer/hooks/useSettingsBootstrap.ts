import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';

export function useSettingsBootstrap(ready: boolean): void {
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    if (!ready) return;
    if (settingsLoaded) return;
    void loadSettings().catch((err: unknown) => {
      console.error('[App] loadSettings failed:', err);
    });
  }, [ready, settingsLoaded, loadSettings]);

  useEffect(() => {
    if (!ready || !settings) return;
    useUiStore.setState({
      ...(settings.sendShortcut ? { sendShortcut: settings.sendShortcut } : {}),
      ...(settings.leftNavShortcut ? { leftNavShortcut: settings.leftNavShortcut } : {}),
      ...(settings.rightPanelShortcut ? { rightPanelShortcut: settings.rightPanelShortcut } : {}),
      devMode: Boolean(settings.devMode),
    });
  }, [ready, settings]);
}
