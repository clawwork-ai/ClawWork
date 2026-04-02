// @vitest-environment jsdom

import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoomPerformer } from '@clawwork/shared';
import '../src/renderer/i18n';
import { useTaskStore } from '../src/renderer/stores/taskStore';
import { useRoomStore } from '../src/renderer/stores/roomStore';
import { useUiStore } from '../src/renderer/stores/uiStore';
import EnsembleAgentBar from '../src/renderer/components/EnsembleAgentBar';

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

vi.mock('@radix-ui/react-tooltip', async () => {
  const React = await import('react');
  return {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Trigger: React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { asChild?: boolean }>(
      ({ children }, _ref) => <>{children}</>,
    ),
    Content: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
      <div ref={ref} data-testid="tooltip-content" {...props}>
        {children}
      </div>
    )),
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const TASK_ID = 'task-1';
const GATEWAY_ID = 'gw-1';

function buildPerformer(overrides: Partial<RoomPerformer> & { agentId: string }): RoomPerformer {
  return {
    sessionKey: `agent:${overrides.agentId}:subagent:${crypto.randomUUID()}`,
    agentName: overrides.agentId,
    verifiedAt: new Date().toISOString(),
    ...overrides,
  };
}

function seedTask(ensemble: boolean): void {
  useTaskStore.setState({
    tasks: [
      {
        id: TASK_ID,
        sessionKey: `agent:main:clawwork:task:${TASK_ID}`,
        sessionId: 'sid-1',
        title: 'Test Task',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        artifactDir: '/tmp',
        gatewayId: GATEWAY_ID,
        ensemble,
      },
    ],
  });
}

function seedRoom(performers: RoomPerformer[]): void {
  useRoomStore.setState({
    rooms: {
      [TASK_ID]: {
        taskId: TASK_ID,
        conductorSessionKey: `agent:main:clawwork:task:${TASK_ID}`,
        conductorReady: true,
        status: 'active',
        performers,
      },
    },
  });
}

function render(ui: ReactElement): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  act(() => {
    root.render(ui);
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

const cleanups: Array<() => void> = [];

describe('EnsembleAgentBar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    useTaskStore.setState({ tasks: [] });
    useRoomStore.setState({ rooms: {}, subagentKeyMap: {} });
    useUiStore.setState({ agentCatalogByGateway: {} });
  });

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
  });

  it('renders nothing when task is not ensemble', () => {
    seedTask(false);
    seedRoom([buildPerformer({ agentId: 'researcher', agentName: 'Researcher', emoji: '🔬' })]);

    const { container, unmount } = render(<EnsembleAgentBar taskId={TASK_ID} />);
    cleanups.push(unmount);

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when no performers exist', () => {
    seedTask(true);

    const { container, unmount } = render(<EnsembleAgentBar taskId={TASK_ID} />);
    cleanups.push(unmount);

    expect(container.innerHTML).toBe('');
  });

  it('renders one avatar per unique agent', () => {
    seedTask(true);
    seedRoom([
      buildPerformer({ agentId: 'researcher', agentName: 'Researcher', emoji: '🔬' }),
      buildPerformer({ agentId: 'coder', agentName: 'Coder', emoji: '💻' }),
    ]);

    const { container, unmount } = render(<EnsembleAgentBar taskId={TASK_ID} />);
    cleanups.push(unmount);

    expect(container.querySelectorAll('[data-testid="agent-avatar"]').length).toBe(2);
  });

  it('deduplicates performers with the same agentId', () => {
    seedTask(true);
    seedRoom([
      buildPerformer({ agentId: 'researcher', agentName: 'Researcher', emoji: '🔬' }),
      buildPerformer({ agentId: 'researcher', agentName: 'Researcher', emoji: '🔬' }),
      buildPerformer({ agentId: 'researcher', agentName: 'Researcher', emoji: '🔬' }),
      buildPerformer({ agentId: 'coder', agentName: 'Coder', emoji: '💻' }),
    ]);

    const { container, unmount } = render(<EnsembleAgentBar taskId={TASK_ID} />);
    cleanups.push(unmount);

    expect(container.querySelectorAll('[data-testid="agent-avatar"]').length).toBe(2);
  });

  it('displays agent name in tooltip content', () => {
    seedTask(true);
    seedRoom([buildPerformer({ agentId: 'researcher', agentName: 'Researcher', emoji: '🔬' })]);

    const { container, unmount } = render(<EnsembleAgentBar taskId={TASK_ID} />);
    cleanups.push(unmount);

    const tooltips = container.querySelectorAll('[data-testid="tooltip-content"]');
    expect(tooltips.length).toBe(1);
    expect(tooltips[0].textContent).toContain('Researcher');
  });
});
