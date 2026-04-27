// @vitest-environment jsdom

import { act, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Team } from '@clawwork/shared';
import TeamDetailView from '../src/renderer/layouts/TeamsPanel/TeamDetailView';
import AgentConfigStep from '../src/renderer/layouts/TeamsPanel/AgentConfigStep';
import type { AgentDraft } from '../src/renderer/layouts/TeamsPanel/types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      if (key === 'teams.detail.agentSkillCount') return `${values?.count} skills`;
      if (key === 'teams.detail.agentSkillsLabel') return `${values?.name} Skills`;
      return key;
    },
  }),
}));

const mocks = vi.hoisted(() => ({
  uiState: {
    agentCatalogByGateway: {
      'gw-1': { agents: [{ id: 'agent-a', name: 'Agent A', model: { primary: 'model-a' } }], defaultId: 'agent-a' },
    },
    modelCatalogByGateway: {},
    skillsStatusByGateway: {} as Record<string, unknown>,
    setSkillsStatusForGateway: vi.fn((gatewayId: string, report: unknown) => {
      mocks.uiState.skillsStatusByGateway[gatewayId] = report;
    }),
  },
}));

vi.mock('../src/renderer/stores/uiStore', () => ({
  useUiStore: <T,>(selector: (state: typeof mocks.uiState) => T) => selector(mocks.uiState),
}));

vi.mock('../src/renderer/hooks/useResizePanel', () => ({
  useResizePanel: () => ({ width: 240, isDragging: false, handleMouseDown: vi.fn() }),
}));

vi.mock('../src/renderer/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@radix-ui/react-tabs', async () => {
  const React = await import('react');
  return {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    List: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )),
    Trigger: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
      ({ children, ...props }, ref) => (
        <button ref={ref} type="button" {...props}>
          {children}
        </button>
      ),
    ),
  };
});

vi.mock('@radix-ui/react-popover', async () => {
  const React = await import('react');
  return {
    Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Content: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )),
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

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
      act(() => root.unmount());
      container.remove();
    },
  };
}

const cleanups: Array<() => void> = [];

describe('team skill bindings UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    (window as unknown as { clawwork: Partial<Window['clawwork']> }).clawwork = {
      listAgentFiles: vi.fn(async () => ({ ok: true, result: { files: [] } })),
      getAgentFile: vi.fn(async () => ({ ok: true, result: { content: '' } })),
      setAgentFile: vi.fn(async () => ({ ok: true })),
      listAgents: vi.fn(async () => ({ ok: true, result: { agents: [] } })),
      getSkillsStatus: vi.fn(async () => ({
        ok: true,
        result: {
          workspaceDir: '',
          managedSkillsDir: '',
          skills: [
            {
              name: 'Installed Skill',
              description: 'Installed skill summary',
              skillKey: 'installed-skill',
              source: 'clawhub',
              bundled: false,
              filePath: '',
              baseDir: '',
              always: false,
              disabled: false,
              blockedByAllowlist: false,
              eligible: true,
              requirements: { bins: [], anyBins: [], env: [], config: [], os: [] },
              missing: { bins: [], anyBins: [], env: [], config: [], os: [] },
              configChecks: [],
              install: [],
            },
          ],
        },
      })),
      searchSkills: vi.fn(async () => ({
        ok: true,
        result: {
          results: [{ score: 1, slug: 'searched-skill', displayName: 'Searched Skill', summary: 'Search hit' }],
        },
      })),
    };
    mocks.uiState.skillsStatusByGateway = {};
    mocks.uiState.setSkillsStatusForGateway.mockClear();
  });

  afterEach(() => {
    while (cleanups.length) cleanups.pop()?.();
    vi.clearAllMocks();
  });

  it('renders only team-bound skills in team detail', async () => {
    const team: Team = {
      id: 'team-1',
      name: 'Team',
      emoji: '',
      description: '',
      gatewayId: 'gw-1',
      source: 'local',
      version: '1',
      agents: [{ agentId: 'agent-a', role: 'coordinator', isManager: true, skills: ['team-skill'] }],
      createdAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z',
    };

    const view = render(<TeamDetailView team={team} onBack={vi.fn()} onStartChat={vi.fn()} onEdit={vi.fn()} />);
    cleanups.push(view.unmount);

    await act(async () => Promise.resolve());
    const skillsFolder = Array.from(view.container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('teams.detail.skills'),
    );
    expect(skillsFolder).toBeTruthy();
    act(() => {
      skillsFolder!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(view.container.textContent).toContain('team-skill');
    expect(view.container.textContent).not.toContain('global-only');
    expect(window.clawwork.getSkillsStatus).not.toHaveBeenCalled();
  });

  it('selects skills from the current gateway and ClawHub search', async () => {
    let agents: AgentDraft[] = [
      {
        uid: 'a1',
        name: 'Agent A',
        description: '',
        role: 'coordinator',
        model: 'model-a',
        agentMd: '',
        soulMd: '',
        skills: [],
        existingAgentId: 'agent-a',
        lockedExisting: true,
      },
    ];
    const handleChange = vi.fn();
    function Harness() {
      const [drafts, setDrafts] = useState(agents);
      agents = drafts;
      return (
        <AgentConfigStep
          agents={drafts}
          onChange={(nextAgents) => {
            handleChange(nextAgents);
            setDrafts(nextAgents);
          }}
          gatewayId="gw-1"
          editMode
        />
      );
    }

    const view = render(<Harness />);
    cleanups.push(view.unmount);

    await act(async () => Promise.resolve());
    expect(window.clawwork.getSkillsStatus).toHaveBeenCalledWith('gw-1');

    const installed = Array.from(view.container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Installed Skill'),
    );
    expect(installed).toBeTruthy();
    act(() => {
      installed!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(agents[0].skills).toEqual(['installed-skill']);

    const searchInput = view.container.querySelector('input[placeholder="settings.skillHubSearchPlaceholder"]');
    expect(searchInput).toBeTruthy();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(searchInput, 'search');
      searchInput!.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'search' }));
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    expect(window.clawwork.searchSkills).toHaveBeenCalledWith('gw-1', { query: 'search', limit: 20 });
    const searched = Array.from(view.container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Searched Skill'),
    );
    expect(searched).toBeTruthy();
    act(() => {
      searched!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(agents[0].skills).toEqual(['installed-skill', 'searched-skill']);
  });

  it('locks existing agent mode while editing a team', async () => {
    const agents: AgentDraft[] = [
      {
        uid: 'a1',
        name: 'Agent A',
        description: '',
        role: 'coordinator',
        model: 'model-a',
        agentMd: '',
        soulMd: '',
        skills: [],
        existingAgentId: 'agent-a',
        lockedExisting: true,
      },
    ];

    const view = render(<AgentConfigStep agents={agents} onChange={vi.fn()} gatewayId="gw-1" editMode />);
    cleanups.push(view.unmount);

    await act(async () => Promise.resolve());

    expect(view.container.textContent).not.toContain('teams.wizard.createNew');
    expect(view.container.textContent).not.toContain('teams.wizard.selectExisting');
    expect(view.container.textContent).toContain('teams.wizard.addAgent');
  });

  it('allows adding a configurable agent while editing a team', async () => {
    let agents: AgentDraft[] = [
      {
        uid: 'a1',
        name: 'Agent A',
        description: '',
        role: 'coordinator',
        model: 'model-a',
        agentMd: '',
        soulMd: '',
        skills: [],
        existingAgentId: 'agent-a',
        lockedExisting: true,
      },
      {
        uid: 'a2',
        name: 'Agent B',
        description: '',
        role: 'worker',
        model: 'model-b',
        agentMd: '',
        soulMd: '',
        skills: [],
        existingAgentId: 'agent-b',
        lockedExisting: true,
      },
    ];
    function Harness() {
      const [drafts, setDrafts] = useState(agents);
      agents = drafts;
      return <AgentConfigStep agents={drafts} onChange={setDrafts} gatewayId="gw-1" editMode />;
    }

    const view = render(<Harness />);
    cleanups.push(view.unmount);

    await act(async () => Promise.resolve());
    const addButton = Array.from(view.container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('teams.wizard.addAgent'),
    );
    expect(addButton).toBeTruthy();

    act(() => {
      addButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(agents).toHaveLength(3);
    expect(view.container.textContent).toContain('teams.wizard.createNew');
    expect(view.container.textContent).toContain('teams.wizard.selectExisting');
  });
});
