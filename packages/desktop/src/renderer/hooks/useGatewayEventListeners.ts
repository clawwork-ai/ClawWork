import { useEffect } from 'react';
import type { GatewayDispatcher } from './useGatewayDispatcherSetup';

export function useGatewayEventListeners(dispatcher: GatewayDispatcher): void {
  useEffect(() => {
    const removeEvents = dispatcher.start();
    const removeStatus = dispatcher.startGatewayStatus();
    dispatcher.initialize();
    const removeDebug = window.clawwork.onDebugEvent(() => {});

    return () => {
      removeEvents();
      removeStatus();
      removeDebug();
      dispatcher.reset();
    };
  }, [dispatcher]);
}
