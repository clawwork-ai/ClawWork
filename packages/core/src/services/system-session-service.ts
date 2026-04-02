import type { IpcResult } from '@clawwork/shared';
import { buildSystemSessionKey, mergeGatewayStreamText } from '@clawwork/shared';
import type { GatewayEvent } from '../ports/gateway-transport.js';
import type { SystemSessionState } from '../stores/system-session-store.js';

interface SystemSessionGateway {
  createSession: (gatewayId: string, params: { key: string; agentId: string; message?: string }) => Promise<IpcResult>;
  deleteSession: (gatewayId: string, sessionKey: string) => Promise<IpcResult>;
  sendMessage: (gatewayId: string, sessionKey: string, content: string) => Promise<IpcResult>;
  onGatewayEvent: (callback: (data: GatewayEvent) => void) => () => void;
}

export interface SystemSessionServiceDeps {
  gateway: SystemSessionGateway;
  getStore: () => SystemSessionState;
}

export interface SystemSessionService {
  start(opts: { gatewayId: string; agentId: string; purpose: string; initialMessage?: string }): Promise<IpcResult>;
  send(content: string): Promise<IpcResult>;
  abort(): void;
  end(): Promise<void>;
}

interface ChatEventPayload {
  sessionKey: string;
  state?: 'delta' | 'final' | 'aborted' | 'error';
  text?: string;
  errorMessage?: string;
  error?: { message?: string };
}

export function createSystemSessionService(deps: SystemSessionServiceDeps): SystemSessionService {
  let removeListener: (() => void) | null = null;

  function handleEvent(data: GatewayEvent): void {
    if (data.event !== 'chat') return;
    const store = deps.getStore();
    const payload = data.payload as unknown as ChatEventPayload;
    if (!store.sessionKey || payload.sessionKey !== store.sessionKey) return;

    const text = payload.text ?? '';

    switch (payload.state) {
      case 'delta': {
        const msgs = store.messages;
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') {
          store.updateLastAssistant(mergeGatewayStreamText(last.content, text));
        }
        store.setStatus('streaming');
        break;
      }
      case 'final': {
        if (text) {
          const msgs = store.messages;
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') {
            store.updateLastAssistant(mergeGatewayStreamText(last.content, text));
          }
        }
        store.setStatus('active');
        break;
      }
      case 'aborted':
        store.setStatus('active');
        break;
      case 'error': {
        const errMsg = payload.errorMessage ?? payload.error?.message ?? 'unknown error';
        store.setError(errMsg);
        break;
      }
    }
  }

  return {
    async start(opts) {
      const store = deps.getStore();
      if (store.sessionKey) {
        return { ok: false, error: 'system session already active' };
      }

      const sessionKey = buildSystemSessionKey(opts.purpose);
      store.open({
        sessionKey,
        gatewayId: opts.gatewayId,
        agentId: opts.agentId,
        purpose: opts.purpose,
      });

      removeListener = deps.gateway.onGatewayEvent(handleEvent);

      const res = await deps.gateway.createSession(opts.gatewayId, {
        key: sessionKey,
        agentId: opts.agentId,
      });

      if (!res.ok) {
        removeListener();
        removeListener = null;
        store.close();
        return res;
      }

      if (opts.initialMessage) {
        return this.send(opts.initialMessage);
      }

      return { ok: true };
    },

    async send(content) {
      const store = deps.getStore();
      if (!store.sessionKey || !store.gatewayId) {
        return { ok: false, error: 'no active system session' };
      }

      const now = new Date().toISOString();
      store.appendMessage({ role: 'user', content, timestamp: now });
      store.appendMessage({ role: 'assistant', content: '', timestamp: now });
      store.setStatus('streaming');

      return deps.gateway.sendMessage(store.gatewayId, store.sessionKey, content);
    },

    abort() {
      removeListener?.();
      removeListener = null;
      deps.getStore().close();
    },

    async end() {
      const store = deps.getStore();
      const { gatewayId, sessionKey } = store;

      removeListener?.();
      removeListener = null;

      if (gatewayId && sessionKey) {
        await deps.gateway.deleteSession(gatewayId, sessionKey).catch(() => {});
      }

      store.close();
    },
  };
}
