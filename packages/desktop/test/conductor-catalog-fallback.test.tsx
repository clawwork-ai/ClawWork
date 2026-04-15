// @vitest-environment jsdom

import { act, useRef, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task, Team } from '@clawwork/shared';

/* ---------- hoisted mocks ---------- */
const mocks = vi.hoisted(() => {
  const ensembleTask: Task = {
    id: 'task-ensemble',
    sessionKey: 'agent:main:clawwork:task:task-ensemble',
    sessionId: '',
    title: 'Team Task',
    status: 'active',
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
    tags: [],
    artifactDir: '',
    gatewayId: 'gw-1',
    agentId: 'manager-agent',
    ensemble: true,
    teamId: 'team-1',
  };

  const teamData: Team = {
    id: 'team-1',
    name: 'Test Team',
    emoji: '',
    description: 'A test team',
    gatewayId: 'gw-1',
    source: 'local',
    version: '1',
    agents: [
      { agentId: 'manager-agent', role: 'manager', isManager: true },
      { agentId: 'worker-a', role: 'coder', isManager: false },
      { agentId: 'worker-b', role: 'reviewer', isManager: false },
    ],
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
  };

  return {
    ensembleTask,
    teamData,
    initConductor: vi.fn(async () => true),
    composerSend: vi.fn(async () => {}),
    taskState: {
      tasks: [ensembleTask],
      activeTaskId: 'task-ensemble',
      pendingNewTask: null,
      commitPendingTask: vi.fn(),
      updateTaskMetadata: vi.fn(),
    },
    messageState: {
      addMessage: vi.fn(),
      setProcessing: vi.fn(),
      processingBySession: new Set<string>(),
      activeTurnBySession: {},
    },
    uiState: {
      gatewayStatusMap: { 'gw-1': 'connected' } as Record<string, string>,
      modelCatalogByGateway: {} as Record<string, unknown>,
      toolsCatalogByGateway: {} as Record<string, unknown>,
      agentCatalogByGateway: {} as Record<string, unknown>,
      setMainView: vi.fn(),
    },
    roomState: {
      rooms: {} as Record<string, unknown>,
      initConductor: vi.fn(async () => true),
    },
    teamState: {
      teams: {} as Record<string, Team>,
    },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@clawwork/core', () => ({
  extractDescription: (content: string) => content.slice(0, 50),
}));

/* Build mock store functions that support both hook calls and .getState() */
function makeStoreMock<T extends object>(stateRef: T) {
  const fn = <U,>(selector?: (state: T) => U) => (selector ? selector(stateRef) : stateRef);
  fn.getState = () => stateRef;
  fn.setState = () => {};
  fn.subscribe = () => () => {};
  return fn;
}

vi.mock('../src/renderer/platform', () => ({
  composer: {
    send: mocks.composerSend,
    abort: vi.fn(async () => {}),
  },
  useTaskStore: makeStoreMock(mocks.taskState),
  useMessageStore: makeStoreMock(mocks.messageState),
  useUiStore: makeStoreMock(mocks.uiState),
  useRoomStore: makeStoreMock(mocks.roomState),
  useTeamStore: makeStoreMock(mocks.teamState),
}));

import { toast } from 'sonner';
import { useChatSend } from '../src/renderer/components/ChatInput/useChatSend';

/* ---------- helpers ---------- */
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

let capturedHandleSend: (() => Promise<void>) | null = null;

function Harness() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chat = useChatSend({
    textareaRef,
    pendingImages: [],
    setPendingImages: vi.fn(),
    selectedTasks: [],
    setSelectedTasks: vi.fn(),
    selectedArtifacts: [],
    setSelectedArtifacts: vi.fn(),
    selectedLocalFiles: [],
    setSelectedLocalFiles: vi.fn(),
    selectedAgents: [],
    setSelectedAgents: vi.fn(),
    contextFolders: [],
    stopVoiceInput: vi.fn(),
  });
  capturedHandleSend = chat.handleSend;
  return <textarea ref={textareaRef} defaultValue="hello team" />;
}

/* ---------- tests ---------- */
describe('conductor initialization - catalog fallback', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    capturedHandleSend = null;
    vi.clearAllMocks();

    // Stub IPC call used to fetch agent IDENTITY.md
    (globalThis as Record<string, unknown>).window = globalThis;
    (globalThis as Record<string, unknown> & { clawwork?: Record<string, unknown> }).clawwork = {
      getAgentFile: vi.fn(async () => ({ ok: false })),
    };

    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to team agents when gateway catalog is not yet loaded', async () => {
    // --- Setup: gateway catalog is empty (not yet fetched), but team data is available ---
    mocks.uiState.agentCatalogByGateway = {};
    mocks.teamState.teams = { 'team-1': mocks.teamData };
    mocks.roomState.rooms = {};
    mocks.roomState.initConductor.mockResolvedValue(true);

    const { unmount } = render(<Harness />);
    expect(capturedHandleSend).not.toBeNull();

    await act(async () => {
      await capturedHandleSend!();
    });

    // The conductor should have been initialized (not the error toast).
    expect(toast.error).not.toHaveBeenCalledWith('errors.conductorInitFailed');
    expect(mocks.roomState.initConductor).toHaveBeenCalledTimes(1);

    // Verify the agentCatalogStr passed to initConductor contains the two worker agents.
    const catalogArg = mocks.roomState.initConductor.mock.calls[0][3] as string;
    expect(catalogArg).toContain('worker-a');
    expect(catalogArg).toContain('worker-b');
    // Manager agent should be excluded (it equals task.agentId).
    expect(catalogArg).not.toContain('manager-agent');

    unmount();
  });

  it('shows error toast when gateway catalog is empty AND no team data exists', async () => {
    // --- Setup: gateway catalog empty, no team data ---
    mocks.uiState.agentCatalogByGateway = {};
    mocks.teamState.teams = {};
    mocks.roomState.rooms = {};

    const { unmount } = render(<Harness />);
    expect(capturedHandleSend).not.toBeNull();

    await act(async () => {
      await capturedHandleSend!();
    });

    expect(toast.error).toHaveBeenCalledWith('errors.conductorInitFailed');
    expect(mocks.roomState.initConductor).not.toHaveBeenCalled();

    unmount();
  });

  it('uses gateway catalog agents when catalog IS loaded (no fallback needed)', async () => {
    // --- Setup: gateway catalog is populated ---
    mocks.uiState.agentCatalogByGateway = {
      'gw-1': {
        defaultId: 'main',
        agents: [
          { id: 'manager-agent', name: 'Manager' },
          { id: 'worker-a', name: 'Worker A', identity: { emoji: '🔧' } },
          { id: 'worker-b', name: 'Worker B' },
          { id: 'unrelated-agent', name: 'Other' },
        ],
      },
    };
    mocks.teamState.teams = { 'team-1': mocks.teamData };
    mocks.roomState.rooms = {};
    mocks.roomState.initConductor.mockResolvedValue(true);

    const { unmount } = render(<Harness />);

    await act(async () => {
      await capturedHandleSend!();
    });

    expect(toast.error).not.toHaveBeenCalledWith('errors.conductorInitFailed');
    expect(mocks.roomState.initConductor).toHaveBeenCalledTimes(1);

    // When catalog IS loaded, agent names from the catalog should appear.
    const catalogArg = mocks.roomState.initConductor.mock.calls[0][3] as string;
    expect(catalogArg).toContain('Worker A');
    expect(catalogArg).toContain('Worker B');
    // unrelated-agent is not in the team, should not appear.
    expect(catalogArg).not.toContain('unrelated-agent');

    unmount();
  });
});
