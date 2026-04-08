import { createStore } from 'zustand/vanilla';
import { buildSessionKey } from '@clawwork/shared';
import type { Task, TaskStatus, IpcResult } from '@clawwork/shared';

export interface PendingNewTask {
  gatewayId: string;
  agentId: string;
  model?: string;
  thinkingLevel?: string;
  ensemble?: boolean;
  teamId?: string;
}

export interface TaskState {
  tasks: Task[];
  activeTaskId: string | null;
  hydrated: boolean;
  pendingNewTask: PendingNewTask | null;

  startNewTask: (opts?: Partial<PendingNewTask>) => void;
  commitPendingTask: () => Task;
  clearPending: () => void;
  createTask: (opts?: { gatewayId?: string; agentId?: string; ensemble?: boolean; teamId?: string }) => Task;
  setActiveTask: (id: string | null) => void;
  updateTaskTitle: (id: string, title: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTaskMetadata: (
    id: string,
    meta: {
      ensemble?: boolean;
      model?: string;
      modelProvider?: string;
      thinkingLevel?: string;
      inputTokens?: number;
      outputTokens?: number;
      contextTokens?: number;
      teamId?: string | null;
      updatedAt?: string;
    },
  ) => void;
  removeTask: (id: string) => void;
  hydrate: () => Promise<void>;
  adoptTasks: (
    discovered: {
      taskId: string;
      sessionKey: string;
      title: string;
      updatedAt: string;
      gatewayId: string;
      agentId?: string;
      model?: string;
      modelProvider?: string;
      thinkingLevel?: string;
      inputTokens?: number;
      outputTokens?: number;
      contextTokens?: number;
    }[],
  ) => void;
}

export interface TaskStoreDeps {
  persistTask: (task: Task) => Promise<IpcResult>;
  persistTaskUpdate: (params: {
    id: string;
    title?: string;
    status?: string;
    ensemble?: boolean;
    model?: string;
    modelProvider?: string;
    thinkingLevel?: string;
    inputTokens?: number;
    outputTokens?: number;
    contextTokens?: number;
    teamId?: string | null;
    updatedAt: string;
  }) => Promise<IpcResult>;
  deleteTask: (taskId: string) => Promise<IpcResult>;
  loadTasks: () => Promise<{
    ok: boolean;
    rows?: {
      id: string;
      sessionKey: string;
      sessionId: string;
      title: string;
      status: string;
      ensemble?: boolean | null;
      model?: string | null;
      modelProvider?: string | null;
      thinkingLevel?: string | null;
      inputTokens?: number | null;
      outputTokens?: number | null;
      contextTokens?: number | null;
      teamId?: string | null;
      createdAt: string;
      updatedAt: string;
      tags: string[];
      artifactDir: string;
      gatewayId: string;
    }[];
  }>;
  patchSession: (gatewayId: string, sessionKey: string, patch: Record<string, unknown>) => Promise<IpcResult>;
  getDeviceId: () => Promise<string>;
  getDefaultGatewayId: () => string | null;
  getAgentCatalog: (gatewayId: string) => { agents: unknown[]; defaultId: string | null };
  onTaskCreated?: () => void;
}

let cachedDeviceId: string | null = null;

export function createTaskStore(deps: TaskStoreDeps) {
  return createStore<TaskState>((set, get) => ({
    tasks: [],
    activeTaskId: null,
    hydrated: false,
    pendingNewTask: null,

    startNewTask: (opts?) => {
      const resolvedGatewayId = opts?.gatewayId ?? deps.getDefaultGatewayId() ?? '';
      const catalog = deps.getAgentCatalog(resolvedGatewayId);
      const resolvedAgentId = opts?.agentId || catalog.defaultId || '';
      set({
        activeTaskId: null,
        pendingNewTask: { ...opts, gatewayId: resolvedGatewayId, agentId: resolvedAgentId },
      });
      deps.onTaskCreated?.();
    },

    commitPendingTask: () => {
      const pending = get().pendingNewTask;
      const gwId = pending?.gatewayId ?? deps.getDefaultGatewayId() ?? '';
      const catalog = deps.getAgentCatalog(gwId);
      const agId = pending?.agentId || catalog.defaultId;
      if (!agId) throw new Error('no agent available — gateway catalog not loaded');
      const task = get().createTask({
        gatewayId: gwId,
        agentId: agId,
        ensemble: pending?.ensemble,
        teamId: pending?.teamId,
      });
      set({ pendingNewTask: null });
      return task;
    },

    clearPending: () => set({ pendingNewTask: null }),

    createTask: (opts) => {
      const resolvedGatewayId = opts?.gatewayId ?? deps.getDefaultGatewayId() ?? '';
      const catalog = deps.getAgentCatalog(resolvedGatewayId);
      const resolvedAgentId = opts?.agentId || catalog.defaultId;
      if (!resolvedAgentId) throw new Error('no agent available — gateway catalog not loaded');
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const task: Task = {
        id,
        sessionKey: buildSessionKey(id, resolvedAgentId, cachedDeviceId ?? undefined),
        sessionId: '',
        title: '',
        status: 'active',
        ensemble: opts?.ensemble ?? undefined,
        createdAt: now,
        updatedAt: now,
        tags: [],
        artifactDir: '',
        gatewayId: resolvedGatewayId,
        agentId: resolvedAgentId,
        teamId: opts?.teamId,
      };
      set((s) => ({ tasks: [task, ...s.tasks], activeTaskId: id }));
      deps.persistTask(task).catch((err) => {
        console.error('[persist:task]', err);
      });
      return task;
    },

    setActiveTask: (id) => set({ activeTaskId: id }),

    updateTaskTitle: (id, title) => {
      const now = new Date().toISOString();
      const task = get().tasks.find((t) => t.id === id);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, title, updatedAt: now } : t)),
      }));
      deps.persistTaskUpdate({ id, title, updatedAt: now }).catch((err) => {
        console.error('[persist:task]', err);
      });
      if (task?.gatewayId && task?.sessionKey) {
        deps.patchSession(task.gatewayId, task.sessionKey, { label: title }).catch((err) => {
          console.error('[patch:session]', err);
        });
      }
    },

    updateTaskStatus: (id, status) => {
      const now = new Date().toISOString();
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: now } : t)),
      }));
      deps.persistTaskUpdate({ id, status, updatedAt: now }).catch((err) => {
        console.error('[persist:task]', err);
      });
    },

    updateTaskMetadata: (id, meta) => {
      const updatedAt = meta.updatedAt ?? new Date().toISOString();
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id
            ? { ...t, ...meta, teamId: meta.teamId === null ? undefined : (meta.teamId ?? t.teamId), updatedAt }
            : t,
        ),
      }));
      deps
        .persistTaskUpdate({
          id,
          ensemble: meta.ensemble,
          model: meta.model,
          modelProvider: meta.modelProvider,
          thinkingLevel: meta.thinkingLevel,
          inputTokens: meta.inputTokens,
          outputTokens: meta.outputTokens,
          contextTokens: meta.contextTokens,
          teamId: meta.teamId,
          updatedAt,
        })
        .catch((err) => {
          console.error('[persist:task]', err);
        });
    },

    removeTask: (id) => {
      set((s) => {
        const nextActiveId = s.activeTaskId === id ? null : s.activeTaskId;
        return {
          tasks: s.tasks.filter((t) => t.id !== id),
          activeTaskId: nextActiveId,
        };
      });
      deps.deleteTask(id).catch((err) => {
        console.error('[persist:task]', err);
      });
    },

    hydrate: async () => {
      if (get().hydrated) return;
      try {
        cachedDeviceId = await deps.getDeviceId();
        const res = await deps.loadTasks();
        if (res.ok && res.rows) {
          set({
            tasks: res.rows.map((r) => ({
              id: r.id,
              sessionKey: r.sessionKey,
              sessionId: r.sessionId,
              title: r.title,
              status: r.status as TaskStatus,
              ensemble: r.ensemble ?? undefined,
              model: r.model ?? undefined,
              modelProvider: r.modelProvider ?? undefined,
              thinkingLevel: r.thinkingLevel ?? undefined,
              inputTokens: r.inputTokens ?? undefined,
              outputTokens: r.outputTokens ?? undefined,
              contextTokens: r.contextTokens ?? undefined,
              teamId: r.teamId ?? undefined,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              tags: r.tags,
              artifactDir: r.artifactDir,
              gatewayId: r.gatewayId,
            })),
            hydrated: true,
          });
        }
      } catch (err) {
        console.warn('[taskStore] hydrate failed:', err);
      }
    },

    adoptTasks: (discovered) => {
      const toPersist: Task[] = [];
      set((s) => {
        const existing = new Set(s.tasks.map((t) => t.id));
        const newTasks: Task[] = [];
        for (const d of discovered) {
          if (existing.has(d.taskId)) continue;
          const task: Task = {
            id: d.taskId,
            sessionKey: d.sessionKey,
            sessionId: '',
            title: d.title,
            status: 'active',
            createdAt: d.updatedAt,
            updatedAt: d.updatedAt,
            tags: [],
            artifactDir: '',
            gatewayId: d.gatewayId,
            agentId: d.agentId,
            model: d.model,
            modelProvider: d.modelProvider,
            thinkingLevel: d.thinkingLevel,
            inputTokens: d.inputTokens,
            outputTokens: d.outputTokens,
            contextTokens: d.contextTokens,
          };
          newTasks.push(task);
        }
        if (newTasks.length === 0) return s;
        toPersist.push(...newTasks);
        return { tasks: [...newTasks, ...s.tasks] };
      });
      for (const task of toPersist) {
        deps.persistTask(task).catch((err) => {
          console.error('[persist:task]', err);
        });
      }
    },
  }));
}
