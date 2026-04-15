import { create } from 'zustand';

type RendererSettings = NonNullable<Awaited<ReturnType<Window['clawwork']['getSettings']>>>;
type SettingsPatch = Partial<RendererSettings>;

type SettingsUpdateResult = { ok?: boolean; config?: Partial<RendererSettings> | null } | null | undefined;

interface SettingsState {
  settings: RendererSettings | null;
  loaded: boolean;
  loading: boolean;
  load: () => Promise<RendererSettings | null>;
  refresh: () => Promise<RendererSettings | null>;
  updateSettings: (partial: SettingsPatch) => Promise<SettingsUpdateResult>;
  replaceSettings: (settings: RendererSettings | null) => void;
}

let pendingLoad: Promise<RendererSettings | null> | null = null;

function mergeSettings(current: RendererSettings | null, partial: SettingsPatch): RendererSettings | null {
  if (!current) return current;
  return {
    ...current,
    ...partial,
    notifications: partial.notifications
      ? { ...current.notifications, ...partial.notifications }
      : current.notifications,
    quickLaunch: partial.quickLaunch ? { ...current.quickLaunch, ...partial.quickLaunch } : current.quickLaunch,
    voiceInput: partial.voiceInput ? { ...current.voiceInput, ...partial.voiceInput } : current.voiceInput,
  };
}

function resolveUpdatedSettings(
  current: RendererSettings | null,
  partial: SettingsPatch,
  result: SettingsUpdateResult,
): RendererSettings | null {
  if (result && typeof result === 'object' && 'config' in result && result.config) {
    return mergeSettings(current, result.config) ?? current;
  }
  return mergeSettings(current, partial);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loaded: false,
  loading: false,
  load: async () => {
    if (get().loaded) return get().settings;
    if (pendingLoad) return pendingLoad;

    set({ loading: true });
    pendingLoad = window.clawwork
      .getSettings()
      .then((settings) => {
        set({ settings, loaded: true, loading: false });
        return settings;
      })
      .catch((err) => {
        set({ loading: false });
        throw err;
      })
      .finally(() => {
        pendingLoad = null;
      });

    return pendingLoad;
  },
  refresh: async () => {
    set({ loading: true });
    try {
      const settings = await window.clawwork.getSettings();
      set({ settings, loaded: true, loading: false });
      return settings;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  updateSettings: async (partial) => {
    const previous = get().settings;
    if (previous) {
      set({ settings: mergeSettings(previous, partial), loaded: true });
    }

    try {
      const result = await window.clawwork.updateSettings(partial);
      set({ settings: resolveUpdatedSettings(get().settings, partial, result), loaded: true });
      return result;
    } catch (err) {
      set({ settings: previous, loaded: previous !== null });
      throw err;
    }
  },
  replaceSettings: (settings) => set({ settings, loaded: true, loading: false }),
}));

export function replaceSettingsSnapshot(settings: RendererSettings | null): void {
  useSettingsStore.getState().replaceSettings(settings);
}

export function syncSettingsUpdate(partial: SettingsPatch, result: SettingsUpdateResult): void {
  useSettingsStore.setState((state) => ({
    settings: resolveUpdatedSettings(state.settings, partial, result),
    loaded: true,
    loading: false,
  }));
}

export function resetSettingsStore(): void {
  pendingLoad = null;
  useSettingsStore.setState({ settings: null, loaded: false, loading: false });
}
