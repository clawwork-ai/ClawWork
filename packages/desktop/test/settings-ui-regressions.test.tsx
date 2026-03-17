// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from '../src/renderer/hooks/useTheme';
import { useUiStore } from '../src/renderer/stores/uiStore';
import GatewaysSection from '../src/renderer/layouts/Settings/sections/GatewaysSection';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../src/renderer/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('../src/renderer/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
}));

vi.mock('../src/renderer/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

function ThemeHarness() {
  useTheme();
  return null;
}

describe('settings UI regressions', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    useUiStore.setState({
      theme: 'auto',
      gatewayInfoMap: {},
      gatewayStatusMap: {},
      defaultGatewayId: null,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    (globalThis.window as Window & typeof globalThis & { clawwork: Record<string, unknown> }).clawwork = {
      getSettings: vi.fn().mockResolvedValue(null),
      updateSettings: vi.fn().mockResolvedValue({ ok: true, config: {} }),
      getQuickLaunchConfig: vi.fn().mockResolvedValue({ enabled: false, shortcut: 'Alt+Space', sendShortcut: 'enter' }),
      getTrayEnabled: vi.fn().mockResolvedValue(true),
      setTrayEnabled: vi.fn().mockResolvedValue(true),
      testGateway: vi.fn().mockResolvedValue({ ok: true }),
      updateGateway: vi.fn().mockResolvedValue({ ok: true }),
      addGateway: vi.fn().mockResolvedValue({ ok: true }),
      removeGateway: vi.fn().mockResolvedValue({ ok: true }),
      setDefaultGateway: vi.fn().mockResolvedValue({ ok: true }),
    };
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    vi.restoreAllMocks();
  });

  it('does not persist the default auto theme before loading saved settings', async () => {
    const getSettings = vi.fn().mockResolvedValue({
      workspacePath: '/tmp/workspace',
      gateways: [],
      theme: 'light',
    });
    const updateSettings = vi.fn().mockResolvedValue({ ok: true, config: {} });
    window.clawwork.getSettings = getSettings;
    window.clawwork.updateSettings = updateSettings;

    const { unmount } = render(<ThemeHarness />);

    expect(updateSettings).not.toHaveBeenCalled();

    await flushAsync();

    expect(useUiStore.getState().theme).toBe('light');
    expect(updateSettings).toHaveBeenCalledTimes(1);
    expect(updateSettings).toHaveBeenLastCalledWith({ theme: 'light' });

    unmount();
  });

  it('syncs the default gateway into the ui store when settings are loaded', async () => {
    window.clawwork.getSettings = vi.fn().mockResolvedValue({
      workspacePath: '/tmp/workspace',
      defaultGatewayId: 'gw-2',
      gateways: [
        { id: 'gw-1', name: 'Gateway 1', url: 'ws://127.0.0.1:18789' },
        { id: 'gw-2', name: 'Gateway 2', url: 'ws://127.0.0.1:28789' },
      ],
    });

    const { unmount } = render(<GatewaysSection />);

    await flushAsync();

    expect(useUiStore.getState().defaultGatewayId).toBe('gw-2');

    unmount();
  });
});
