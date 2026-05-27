// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GatewaysSection from '../src/renderer/layouts/Settings/sections/GatewaysSection';
import { resetSettingsStore } from '../src/renderer/stores/settingsStore';
import { useUiStore } from '../src/renderer/stores/uiStore';

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

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
}

describe('gateway settings flow', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    useUiStore.setState({
      gatewayStatusMap: {},
      defaultGatewayId: null,
      gatewayInfoMap: {},
    });
    resetSettingsStore();
    (globalThis.window as unknown as Window & typeof globalThis & { clawwork: Record<string, unknown> }).clawwork = {
      getSettings: vi.fn().mockResolvedValue({ gateways: [], defaultGatewayId: null }),
      addGateway: vi.fn().mockResolvedValue({ ok: true }),
      updateGateway: vi.fn().mockResolvedValue({ ok: true }),
      removeGateway: vi.fn().mockResolvedValue({ ok: true }),
      setDefaultGateway: vi.fn().mockResolvedValue({ ok: true }),
      testGateway: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as Window['clawwork'] & Record<string, unknown>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to token auth and hides test connection for pairing code mode', async () => {
    const { container, unmount } = render(<GatewaysSection />);

    await flushAsync();

    const addButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Add Gateway'),
    );
    expect(addButton).toBeTruthy();

    act(() => {
      addButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await flushAsync();

    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.some((button) => button.textContent?.includes('Test Connection'))).toBe(true);

    const pairingTab = buttons.find((button) => button.textContent?.includes('Pairing Code'));
    expect(pairingTab).toBeTruthy();

    act(() => {
      pairingTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await flushAsync();

    expect(
      Array.from(container.querySelectorAll('button')).some((button) =>
        button.textContent?.includes('Test Connection'),
      ),
    ).toBe(false);

    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

    await act(async () => {
      setInputValue(
        inputs[1],
        Buffer.from(JSON.stringify({ url: 'wss://pair.example.com', bootstrapToken: 'pair-token' })).toString('base64'),
      );
    });

    await flushAsync();

    expect(container.textContent).toContain('Verify TLS certificate');

    unmount();
  });

  it('shows TLS verification only for WSS gateways and saves disabled verification', async () => {
    const { container, unmount } = render(<GatewaysSection />);

    await flushAsync();

    const addButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Add Gateway'),
    );
    expect(addButton).toBeTruthy();

    act(() => {
      addButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await flushAsync();

    expect(container.textContent).not.toContain('Verify TLS certificate');

    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
    expect(inputs.length).toBeGreaterThanOrEqual(3);

    await act(async () => {
      setInputValue(inputs[0], 'Private Gateway');
      setInputValue(inputs[1], 'wss://gateway.example.com');
      setInputValue(inputs[2], 'secret');
    });

    await flushAsync();

    expect(container.textContent).toContain('Verify TLS certificate');

    const tlsSwitch = container.querySelector(
      'button[role="switch"][aria-label="Verify TLS certificate"]',
    ) as HTMLButtonElement | null;
    expect(tlsSwitch).toBeTruthy();
    expect(tlsSwitch?.getAttribute('aria-checked')).toBe('true');

    act(() => {
      tlsSwitch?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await flushAsync();

    expect(tlsSwitch?.getAttribute('aria-checked')).toBe('false');

    const saveButtons = Array.from(container.querySelectorAll('button')).filter((button) =>
      button.textContent?.includes('Add Gateway'),
    );
    const saveButton = saveButtons[saveButtons.length - 1];

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    await flushAsync();

    expect(window.clawwork.addGateway).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Private Gateway',
        url: 'wss://gateway.example.com',
        token: 'secret',
        tlsVerify: false,
      }),
    );

    unmount();
  });
});
