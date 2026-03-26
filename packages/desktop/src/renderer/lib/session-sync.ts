import { createSessionSync } from '@clawwork/core';
import { ports, useTaskStore, useMessageStore } from '../platform';

const sync = createSessionSync({
  persistence: ports.persistence,
  gateway: ports.gateway,
  getTaskStore: () => useTaskStore.getState(),
  getMessageStore: () => ({
    ...useMessageStore.getState(),
    setState: useMessageStore.setState,
  }),
});

export const { hydrateFromLocal, syncSessionMessages, syncFromGateway, retrySyncPending } = sync;
