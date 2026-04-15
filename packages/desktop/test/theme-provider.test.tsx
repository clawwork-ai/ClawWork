// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../src/renderer/context/ThemeProvider';
import { useUiStore } from '../src/renderer/stores/uiStore';
import { resetSettingsStore } from '../src/renderer/stores/settingsStore';

function render(element: React.ReactElement): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  act(() => {
    root.render(element);
  });

  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

async function flushAsync(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('theme provider', () => {
  const originalMatchMedia = window.matchMedia;
  let getSettingsMock: ReturnType<typeof vi.fn>;
  let updateSettingsMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-density');
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    useUiStore.setState({ theme: 'auto', density: 'comfortable' });
    resetSettingsStore();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    getSettingsMock = vi.fn().mockResolvedValue({});
    updateSettingsMock = vi.fn().mockResolvedValue({ ok: true, config: {} });

    (globalThis.window as Window & typeof globalThis & { clawwork: Record<string, unknown> }).clawwork = {
      getSettings: getSettingsMock,
      updateSettings: updateSettingsMock,
    };
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    vi.restoreAllMocks();
  });

  it('applies resolved theme and density attributes', async () => {
    const { unmount } = render(
      <ThemeProvider>
        <div />
      </ThemeProvider>,
    );

    await flushAsync();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-density')).toBe('comfortable');
    expect(document.documentElement.style.colorScheme).toBe('light');

    unmount();
  });

  it('does not persist settings again during hydration', async () => {
    getSettingsMock.mockResolvedValue({
      theme: 'dark',
      density: 'compact',
    });

    const { unmount } = render(
      <ThemeProvider>
        <div />
      </ThemeProvider>,
    );

    await flushAsync();
    await flushAsync();

    expect(useUiStore.getState().theme).toBe('dark');
    expect(useUiStore.getState().density).toBe('compact');
    expect(updateSettingsMock).not.toHaveBeenCalled();

    unmount();
  });

  it('persists user theme and density changes after hydration', async () => {
    getSettingsMock.mockResolvedValue({
      theme: 'light',
      density: 'comfortable',
    });

    const { unmount } = render(
      <ThemeProvider>
        <div />
      </ThemeProvider>,
    );

    await flushAsync();
    await flushAsync();

    await act(async () => {
      useUiStore.getState().setTheme('dark');
      await Promise.resolve();
    });

    expect(updateSettingsMock).toHaveBeenCalledWith({ theme: 'dark' });

    await act(async () => {
      useUiStore.getState().setDensity('compact');
      await Promise.resolve();
    });

    expect(updateSettingsMock).toHaveBeenCalledWith({ density: 'compact' });
    expect(updateSettingsMock).toHaveBeenCalledTimes(2);

    unmount();
  });
});
