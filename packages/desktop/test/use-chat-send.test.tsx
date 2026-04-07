// @vitest-environment jsdom

import { act, useRef, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '@clawwork/shared';

const mocks = vi.hoisted(() => {
  const activeTask: Task = {
    id: 'task-1',
    sessionKey: 'agent:main:clawwork:task:task-1',
    sessionId: '',
    title: 'Task 1',
    status: 'active',
    createdAt: '2026-04-07T00:00:00.000Z',
    updatedAt: '2026-04-07T00:00:00.000Z',
    tags: [],
    artifactDir: '',
    gatewayId: 'gw-1',
    agentId: 'main',
  };

  return {
    abort: vi.fn(async () => {}),
    taskState: {
      tasks: [activeTask],
      activeTaskId: 'task-1',
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
      gatewayStatusMap: { 'gw-1': 'connected' },
      modelCatalogByGateway: {},
      toolsCatalogByGateway: {},
    },
    roomState: {
      rooms: {},
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

vi.mock('../src/renderer/platform', () => ({
  composer: {
    abort: mocks.abort,
  },
  useTaskStore: <T,>(selector?: (state: typeof mocks.taskState) => T) =>
    selector ? selector(mocks.taskState) : mocks.taskState,
  useMessageStore: <T,>(selector?: (state: typeof mocks.messageState) => T) =>
    selector ? selector(mocks.messageState) : mocks.messageState,
  useUiStore: <T,>(selector?: (state: typeof mocks.uiState) => T) =>
    selector ? selector(mocks.uiState) : mocks.uiState,
  useRoomStore: <T,>(selector?: (state: typeof mocks.roomState) => T) =>
    selector ? selector(mocks.roomState) : mocks.roomState,
}));

import { useChatSend } from '../src/renderer/components/ChatInput/useChatSend';

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

  return (
    <>
      <textarea ref={textareaRef} />
      <button type="button" onClick={() => void chat.handleAbort()}>
        abort
      </button>
      <div data-testid="aborting">{chat.aborting ? 'aborting' : 'idle'}</div>
    </>
  );
}

describe('useChatSend abort flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    mocks.abort.mockClear();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clears the abort reset timer on unmount', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container, unmount } = render(<Harness />);

    const button = container.querySelector('button');
    expect(button).not.toBeNull();

    await act(async () => {
      button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });
    expect(container.querySelector('[data-testid="aborting"]')?.textContent).toBe('aborting');
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(consoleError).not.toHaveBeenCalled();
  });
});
