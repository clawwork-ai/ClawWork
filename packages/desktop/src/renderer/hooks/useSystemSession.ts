import { useCallback, useEffect, useRef } from 'react';
import type { IpcResult } from '@clawwork/shared';
import type { SystemSessionMessage, SystemSessionStatus } from '@clawwork/core';
import { useSystemSessionStore, systemSessionService } from '../platform';

interface UseSystemSessionReturn {
  status: SystemSessionStatus;
  messages: SystemSessionMessage[];
  error: string | null;
  start: (opts: { gatewayId: string; agentId: string; purpose: string; initialMessage?: string }) => Promise<IpcResult>;
  send: (content: string) => Promise<IpcResult>;
  end: () => Promise<void>;
}

export function useSystemSession(): UseSystemSessionReturn {
  const status = useSystemSessionStore((s) => s.status);
  const messages = useSystemSessionStore((s) => s.messages);
  const error = useSystemSessionStore((s) => s.error);
  const activeRef = useRef(false);

  const start = useCallback(
    async (opts: { gatewayId: string; agentId: string; purpose: string; initialMessage?: string }) => {
      activeRef.current = true;
      return systemSessionService.start(opts);
    },
    [],
  );

  const send = useCallback(async (content: string) => {
    return systemSessionService.send(content);
  }, []);

  const end = useCallback(async () => {
    activeRef.current = false;
    return systemSessionService.end();
  }, []);

  useEffect(() => {
    return () => {
      if (activeRef.current) {
        systemSessionService.end();
      }
    };
  }, []);

  return { status, messages, error, start, send, end };
}
