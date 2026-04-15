import { useEffect } from 'react';
import { useRoomStore, useTaskStore } from '../platform';

export function useEnsembleSync(): void {
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
