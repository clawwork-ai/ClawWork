import { createStore } from 'zustand/vanilla';

export interface SystemSessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type SystemSessionStatus = 'idle' | 'active' | 'streaming' | 'error';

export interface SystemSessionState {
  sessionKey: string | null;
  gatewayId: string | null;
  agentId: string | null;
  purpose: string | null;
  status: SystemSessionStatus;
  messages: SystemSessionMessage[];
  error: string | null;

  open(opts: { sessionKey: string; gatewayId: string; agentId: string; purpose: string }): void;
  appendMessage(msg: SystemSessionMessage): void;
  updateLastAssistant(content: string): void;
  setStatus(status: SystemSessionStatus): void;
  setError(error: string): void;
  close(): void;
}

const INITIAL: Pick<
  SystemSessionState,
  'sessionKey' | 'gatewayId' | 'agentId' | 'purpose' | 'status' | 'messages' | 'error'
> = {
  sessionKey: null,
  gatewayId: null,
  agentId: null,
  purpose: null,
  status: 'idle',
  messages: [],
  error: null,
};

export function createSystemSessionStore() {
  return createStore<SystemSessionState>((set) => ({
    ...INITIAL,

    open(opts) {
      set({
        sessionKey: opts.sessionKey,
        gatewayId: opts.gatewayId,
        agentId: opts.agentId,
        purpose: opts.purpose,
        status: 'active',
        messages: [],
        error: null,
      });
    },

    appendMessage(msg) {
      set((s) => ({ messages: [...s.messages, msg] }));
    },

    updateLastAssistant(content) {
      set((s) => {
        const msgs = [...s.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            msgs[i] = { ...msgs[i], content };
            return { messages: msgs };
          }
        }
        return s;
      });
    },

    setStatus(status) {
      set({ status });
    },

    setError(error) {
      set({ error, status: 'error' });
    },

    close() {
      set({ ...INITIAL });
    },
  }));
}
