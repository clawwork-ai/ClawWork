import { create } from 'zustand';
import { parseTaskIdFromSessionKey } from '@clawwork/shared';
import type { ApprovalDecision, ExecApprovalRequest } from '@clawwork/shared';
import { toast } from 'sonner';
import i18n from '../i18n';
import { useTaskStore } from './taskStore';
import { useUiStore } from './uiStore';
import { buildAppError, formatErrorForToast } from '@clawwork/core';

type PendingApproval = ExecApprovalRequest & { gatewayId: string; taskId: string | null };

function resolveTaskId(sessionKey?: string | null): string | null {
  if (!sessionKey) return null;
  const taskId = parseTaskIdFromSessionKey(sessionKey);
  if (!taskId) return null;
  const tasks = useTaskStore.getState().tasks;
  return tasks.some((task) => task.id === taskId) ? taskId : null;
}

const expireTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useApprovalStore = create<{
  pendingApprovals: PendingApproval[];
  addApproval: (gatewayId: string, req: ExecApprovalRequest) => void;
  removeApproval: (id: string) => void;
  resolveApproval: (id: string, decision: ApprovalDecision) => void;
  clear: () => void;
}>((set, get) => ({
  pendingApprovals: [],

  addApproval(gatewayId, req) {
    if (get().pendingApprovals.some((a) => a.id === req.id)) return;
    const taskId = resolveTaskId(req.request.sessionKey);
    if (taskId && taskId !== useTaskStore.getState().activeTaskId) {
      useUiStore.getState().markUnread(taskId);
    }
    set((s) => ({ pendingApprovals: [...s.pendingApprovals, { ...req, gatewayId, taskId }] }));
    const ttl = req.expiresAtMs - Date.now();
    if (ttl > 0) {
      expireTimers.set(
        req.id,
        setTimeout(() => {
          expireTimers.delete(req.id);
          get().removeApproval(req.id);
        }, ttl),
      );
    }
  },

  removeApproval(id) {
    const approval = get().pendingApprovals.find((a) => a.id === id);
    if (approval?.taskId && !get().pendingApprovals.some((a) => a.id !== id && a.taskId === approval.taskId)) {
      useUiStore.getState().clearUnread(approval.taskId);
    }
    clearTimeout(expireTimers.get(id));
    expireTimers.delete(id);
    set((s) => ({ pendingApprovals: s.pendingApprovals.filter((a) => a.id !== id) }));
  },

  resolveApproval(id, decision) {
    const approval = get().pendingApprovals.find((a) => a.id === id);
    if (!approval) return;
    window.clawwork
      .resolveExecApproval(approval.gatewayId, id, decision)
      .then((result) => {
        if (!result.ok) {
          const appError = buildAppError({
            source: 'gateway',
            stage: 'send',
            rawMessage: result.error ?? 'exec approval resolve failed',
            code: result.errorCode,
            details: result.errorDetails,
          });
          const { title, description } = formatErrorForToast(appError, i18n.t);
          toast.error(title, { description });
          return;
        }
        get().removeApproval(id);
      })
      .catch((err) => {
        const appError = buildAppError({
          source: 'gateway',
          stage: 'send',
          rawMessage: err instanceof Error ? err.message : 'exec approval resolve failed',
        });
        const { title, description } = formatErrorForToast(appError, i18n.t);
        toast.error(title, { description });
      });
  },

  clear() {
    for (const timer of expireTimers.values()) {
      clearTimeout(timer);
    }
    expireTimers.clear();
    set({ pendingApprovals: [] });
  },
}));
