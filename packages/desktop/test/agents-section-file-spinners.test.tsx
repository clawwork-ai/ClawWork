// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';
import '../src/renderer/i18n';
import { toast as sonnerToast } from 'sonner';
import { useUiStore } from '../src/renderer/stores/uiStore';
import { resetSettingsStore } from '../src/renderer/stores/settingsStore';
import AgentsSection from '../src/renderer/layouts/Settings/sections/AgentsSection';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...props }, ref) =>
          React.createElement(tag, { ...props, ref }, children),
        ),
    },
  );
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion,
  };
});

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

vi.mock('../src/renderer/components/AgentBuilderDialog', () => ({
  default: () => null,
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

async function settle(): Promise<void> {
  for (let i = 0; i < 10; i += 1) {
    await flushAsync();
  }
}

async function clickSettle(el: HTMLElement): Promise<void> {
  await act(async () => {
    el.click();
  });
  await settle();
}

function findByAriaKey(container: HTMLElement, key: string): HTMLElement {
  const translated = i18next.t(key);
  const candidates = Array.from(container.querySelectorAll('[aria-label]')) as HTMLElement[];
  const match = candidates.find((el) => {
    const value = el.getAttribute('aria-label');
    return value === key || value === translated;
  });
  if (!match) throw new Error(`element with aria-label for key "${key}" not found`);
  return match;
}

function findFileButton(container: HTMLElement, name: string): HTMLElement {
  const buttons = Array.from(container.querySelectorAll('button'));
  const match = buttons.find((b) => (b.textContent ?? '').includes(name));
  if (!match) throw new Error(`file button "${name}" not found`);
  return match;
}

function seedConnectedGateway(): void {
  useUiStore.setState({
    gatewayStatusMap: { 'gw-1': 'connected' },
    gatewayInfoMap: { 'gw-1': { id: 'gw-1', name: 'Gateway 1' } },
    defaultGatewayId: 'gw-1',
    agentCatalogByGateway: {
      'gw-1': { agents: [{ id: 'main', name: 'Main' }], defaultId: 'main' },
    },
    modelCatalogByGateway: {},
    skillsStatusByGateway: {},
  });
}

describe('AgentsSection file loading/saving spinners', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    document.body.innerHTML = '';
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.clearAllMocks();
    seedConnectedGateway();
    resetSettingsStore();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    (globalThis.window as unknown as Window & typeof globalThis & { clawwork: Record<string, unknown> }).clawwork = {
      listAgents: vi.fn().mockResolvedValue({ ok: true, result: { agents: [], defaultId: 'main' } }),
      listAgentFiles: vi
        .fn()
        .mockResolvedValue({ ok: true, result: { workspace: '/ws', files: [{ name: 'IDENTITY.md' }] } }),
      getAgentFile: vi.fn(),
      setAgentFile: vi.fn(),
      getSkillsStatus: vi.fn().mockResolvedValue({ ok: true, result: { skills: [] } }),
    } as unknown as Window['clawwork'] & Record<string, unknown>;
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    vi.restoreAllMocks();
  });

  it('clears loadingFileContent and toasts when getAgentFile rejects', async () => {
    window.clawwork.getAgentFile = vi.fn().mockRejectedValue(new Error('boom'));

    const { container, unmount } = render(<AgentsSection />);
    await settle();

    await clickSettle(findByAriaKey(container, 'settings.agentDetails'));
    await clickSettle(findFileButton(container, 'IDENTITY.md'));

    expect(sonnerToast.error).toHaveBeenCalledTimes(1);
    expect(() => findByAriaKey(container, 'settings.agentFileEdit')).not.toThrow();

    unmount();
  });

  it('clears savingFile and toasts when setAgentFile rejects', async () => {
    window.clawwork.getAgentFile = vi.fn().mockResolvedValue({ ok: true, result: { file: { content: 'hello' } } });
    window.clawwork.setAgentFile = vi.fn().mockRejectedValue(new Error('boom'));

    const { container, unmount } = render(<AgentsSection />);
    await settle();

    await clickSettle(findByAriaKey(container, 'settings.agentDetails'));
    await clickSettle(findFileButton(container, 'IDENTITY.md'));
    await clickSettle(findByAriaKey(container, 'settings.agentFileEdit'));
    await clickSettle(findByAriaKey(container, 'settings.agentFileSave'));

    expect(sonnerToast.error).toHaveBeenCalledTimes(1);
    expect((findByAriaKey(container, 'settings.agentFileSave') as HTMLButtonElement).disabled).toBe(false);

    unmount();
  });
});
