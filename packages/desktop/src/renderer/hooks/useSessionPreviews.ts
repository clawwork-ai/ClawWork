import { useEffect, useMemo, useRef, useState } from 'react';
import type { Task, SessionsPreviewEntry, SessionsPreviewResult } from '@clawwork/shared';
import { useUiStore } from '@/stores/uiStore';
import { useMessageStore } from '@/stores/messageStore';

export type SessionPreviewState = 'loading' | 'empty' | 'ready';

export interface TaskSessionPreview {
  text: string | null;
  state: SessionPreviewState;
}

function extractSnippet(entry: SessionsPreviewEntry): string | null {
  if (entry.status !== 'ok' || entry.items.length === 0) return null;
  const last = entry.items[entry.items.length - 1];
  const text = last?.text?.replace(/\s+/g, ' ').trim();
  return text || null;
}

function connectedGatewayKey(statusMap: Record<string, string>): string {
  return Object.entries(statusMap)
    .filter(([, status]) => status === 'connected')
    .map(([id]) => id)
    .sort()
    .join(',');
}

export function useSessionPreviews(tasks: Task[]): Record<string, TaskSessionPreview> {
  const gatewayStatusMap = useUiStore((s) => s.gatewayStatusMap);
  const unreadRevision = useUiStore((s) => Array.from(s.unreadTaskIds).sort().join(','));
  const messageRevision = useMessageStore((s) =>
    tasks.map((task) => `${task.id}:${s.messagesByTask[task.id]?.length ?? 0}`).join('|'),
  );

  const taskFingerprint = useMemo(
    () => tasks.map((task) => `${task.id}:${task.sessionKey}:${task.gatewayId}`).join('|'),
    [tasks],
  );
  const connectedGateways = useMemo(() => connectedGatewayKey(gatewayStatusMap), [gatewayStatusMap]);

  const [previews, setPreviews] = useState<Record<string, TaskSessionPreview>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlightRef = useRef(false);
  const pendingRefreshRef = useRef(false);

  useEffect(() => {
    if (tasks.length === 0) {
      setPreviews({});
      return;
    }

    const runFetch = () => {
      if (inFlightRef.current) {
        pendingRefreshRef.current = true;
        return;
      }
      inFlightRef.current = true;
      pendingRefreshRef.current = false;

      const sessionKeyToTaskId = new Map<string, string>();
      const byGateway = new Map<string, string[]>();

      for (const task of tasks) {
        sessionKeyToTaskId.set(task.sessionKey, task.id);
        if (gatewayStatusMap[task.gatewayId] !== 'connected') continue;
        const keys = byGateway.get(task.gatewayId) ?? [];
        keys.push(task.sessionKey);
        byGateway.set(task.gatewayId, keys);
      }

      setPreviews((prev) => {
        const next: Record<string, TaskSessionPreview> = { ...prev };
        for (const task of tasks) {
          if (gatewayStatusMap[task.gatewayId] !== 'connected') {
            next[task.id] = { text: null, state: 'empty' };
            continue;
          }
          const existing = prev[task.id];
          next[task.id] = {
            text: existing?.text ?? null,
            state: existing?.state === 'ready' ? 'ready' : 'loading',
          };
        }
        return next;
      });

      const applyUpdates = (updates: Record<string, TaskSessionPreview>) => {
        setPreviews((prev) => ({ ...prev, ...updates }));
      };

      void (async () => {
        const updates: Record<string, TaskSessionPreview> = {};

        try {
          await Promise.all(
            Array.from(byGateway.entries()).map(async ([gatewayId, keys]) => {
              const res = await window.clawwork.previewSessions(gatewayId, keys, { limit: 1, maxChars: 120 });
              if (!res.ok || !res.result) return;
              const result = res.result as SessionsPreviewResult;
              for (const entry of result.previews ?? []) {
                const taskId = sessionKeyToTaskId.get(entry.key);
                if (!taskId) continue;
                const snippet = extractSnippet(entry);
                updates[taskId] = { text: snippet, state: snippet ? 'ready' : 'empty' };
              }
            }),
          );
        } catch (err) {
          console.error('[session-preview] fetch failed:', err);
        }

        for (const task of tasks) {
          if (updates[task.id]) continue;
          if (gatewayStatusMap[task.gatewayId] !== 'connected') {
            updates[task.id] = { text: null, state: 'empty' };
          } else if (byGateway.has(task.gatewayId)) {
            updates[task.id] = { text: null, state: 'empty' };
          }
        }

        const needsRefetch = pendingRefreshRef.current;
        if (!needsRefetch && Object.keys(updates).length > 0) applyUpdates(updates);

        inFlightRef.current = false;
        if (needsRefetch) {
          pendingRefreshRef.current = false;
          runFetch();
        }
      })();
    };

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runFetch, 300);

    return () => clearTimeout(timerRef.current);
  }, [taskFingerprint, connectedGateways, unreadRevision, messageRevision, tasks, gatewayStatusMap]);

  return previews;
}
