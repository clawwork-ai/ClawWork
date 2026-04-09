import { useEffect } from 'react';
import { parseAgentIdFromSessionKey } from '@clawwork/shared';
import { syncSessionMessages } from '../lib/session-sync';
import { useRoomStore, useTaskStore } from '../platform';
import type { GatewayDispatcher } from './useGatewayDispatcherSetup';

export function handlePerformerCandidate(taskId: string, sessionKey: string): void {
  if (useRoomStore.getState().lookupTaskIdBySubagentKey(sessionKey)) return;

  const room = useRoomStore.getState().rooms[taskId];
  if (!room || room.status === 'stopped') return;

  const agentId = parseAgentIdFromSessionKey(sessionKey);
  useRoomStore.getState().registerPerformerKey(taskId, sessionKey, agentId, agentId);
  void syncSessionMessages(taskId, sessionKey).catch((err) => {
    console.error('[performer] syncSessionMessages failed:', err);
  });
}

export function handleSubagentCandidate(sessionKey: string, gatewayId: string): void {
  const tasks = useTaskStore.getState().tasks;
  const ensembleTasks = tasks.filter((task) => task.ensemble && task.gatewayId === gatewayId);
  if (ensembleTasks.length === 0) return;

  for (const task of ensembleTasks) {
    const room = useRoomStore.getState().rooms[task.id];
    if (!room || room.status === 'stopped') continue;

    void useRoomStore
      .getState()
      .verifyCandidates(task.id, task.gatewayId)
      .then(() => {
        if (useRoomStore.getState().lookupTaskIdBySubagentKey(sessionKey) === task.id) {
          return syncSessionMessages(task.id, sessionKey);
        }
        return undefined;
      })
      .catch(() => {});
  }
}

export function useEnsembleSync(dispatcher: GatewayDispatcher): void {
  void dispatcher;

  useEffect(() => {
    return useTaskStore.subscribe((state, prev) => {
      if (state.tasks.length > 0 && prev.tasks.length === 0) {
        for (const task of state.tasks) {
          if (!task.ensemble) continue;
          useRoomStore.getState().hydrateRoom(task.id, task.sessionKey);
        }
      }
    });
  }, []);
}
