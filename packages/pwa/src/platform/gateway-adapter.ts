import type {
  GatewayTransportPort,
  GatewayEvent,
  GatewayStatusEvent,
  GatewayStatusMap,
  GatewayListItem,
  DiscoveredSession,
  SyncResult,
} from '@clawwork/core';
import { INTERNAL_ASSISTANT_MARKERS, parseToolArgs } from '@clawwork/core';
import { isClawWorkSession, parseTaskIdFromSessionKey, parseAgentIdFromSessionKey } from '@clawwork/shared';
import type { BrowserGatewayClient } from '../gateway/client.js';
import { listGateways as listGatewayConfigs } from '../persistence/db.js';
import { reportDebugEvent } from '../lib/debug.js';

interface GatewaySessionRow {
  key: string;
  sessionId?: string;
  updatedAt: number | null;
  derivedTitle?: string;
  label?: string;
  displayName?: string;
  model?: string;
  modelProvider?: string;
  thinkingLevel?: string;
  inputTokens?: number;
  outputTokens?: number;
  contextTokens?: number;
}

interface SessionsListPayload {
  sessions?: GatewaySessionRow[];
}

interface ChatHistoryContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  arguments?: unknown;
  result?: unknown;
}

interface ChatHistoryMessage {
  role: string;
  content: ChatHistoryContentBlock[];
  timestamp?: number;
}

interface ChatHistoryPayload {
  messages?: ChatHistoryMessage[];
}

interface ParsedToolCall {
  id: string;
  name: string;
  status: 'running' | 'done' | 'error';
  args?: Record<string, unknown>;
  result?: string;
  startedAt: string;
  completedAt?: string;
}

type EventCallback = (data: GatewayEvent) => void;
type StatusCallback = (status: GatewayStatusEvent) => void;

export interface BrowserGatewayTransportResult {
  transport: GatewayTransportPort;
  broadcastEvent: EventCallback;
  broadcastStatus: StatusCallback;
}

export function createBrowserGatewayTransport(
  getClients: () => BrowserGatewayClient[],
  getClient: (id: string) => BrowserGatewayClient | undefined,
  getDeviceId: () => Promise<string>,
): BrowserGatewayTransportResult {
  const eventListeners = new Set<EventCallback>();
  const statusListeners = new Set<StatusCallback>();

  function broadcastEvent(data: GatewayEvent): void {
    for (const listener of eventListeners) {
      try {
        listener(data);
      } catch (err) {
        reportDebugEvent({
          level: 'warn',
          domain: 'gateway',
          event: 'gateway.listener.event.failed',
          error: { message: err instanceof Error ? err.message : 'event listener failed' },
        });
      }
    }
  }

  function broadcastStatus(status: GatewayStatusEvent): void {
    for (const listener of statusListeners) {
      try {
        listener(status);
      } catch (err) {
        reportDebugEvent({
          level: 'warn',
          domain: 'gateway',
          event: 'gateway.listener.status.failed',
          error: { message: err instanceof Error ? err.message : 'status listener failed' },
        });
      }
    }
  }

  const transport: GatewayTransportPort = {
    async sendMessage(gatewayId, sessionKey, content, attachments) {
      const client = getClient(gatewayId);
      if (!client?.isConnected)
        return { ok: false, error: 'gateway not connected', errorCode: 'GATEWAY_NOT_CONNECTED' };
      try {
        await client.sendChatMessage(sessionKey, content, attachments);
        return { ok: true };
      } catch (err) {
        const typed = err as Error & { code?: string; details?: Record<string, unknown> };
        return { ok: false, error: typed.message, errorCode: typed.code, errorDetails: typed.details };
      }
    },

    async chatHistory(gatewayId, sessionKey, limit) {
      const client = getClient(gatewayId);
      if (!client?.isConnected)
        return { ok: false, error: 'gateway not connected', errorCode: 'GATEWAY_NOT_CONNECTED' };
      try {
        const result = await client.getChatHistory(sessionKey, limit);
        return { ok: true, result };
      } catch (err) {
        const typed = err as Error & { code?: string };
        return { ok: false, error: typed.message, errorCode: typed.code };
      }
    },

    async abortChat(gatewayId, sessionKey) {
      const client = getClient(gatewayId);
      if (!client?.isConnected)
        return { ok: false, error: 'gateway not connected', errorCode: 'GATEWAY_NOT_CONNECTED' };
      try {
        await client.abortChat(sessionKey);
        return { ok: true };
      } catch (err) {
        const typed = err as Error & { code?: string };
        return { ok: false, error: typed.message, errorCode: typed.code };
      }
    },

    async listSessionsBySpawner(_gatewayId, _spawnedBy) {
      return { ok: false as const, error: 'not supported in PWA', errorCode: 'NOT_SUPPORTED' };
    },

    async patchSession(gatewayId, sessionKey, patch) {
      const client = getClient(gatewayId);
      if (!client?.isConnected)
        return { ok: false, error: 'gateway not connected', errorCode: 'GATEWAY_NOT_CONNECTED' };
      try {
        await client.patchSession({ sessionKey, ...patch });
        return { ok: true };
      } catch (err) {
        const typed = err as Error & { code?: string };
        return { ok: false, error: typed.message, errorCode: typed.code };
      }
    },

    async gatewayStatus() {
      const clients = getClients();
      const statusMap: GatewayStatusMap = {};
      for (const client of clients) {
        statusMap[client.id] = {
          connected: client.isConnected,
          name: client.name,
          error: client.lastError,
          serverVersion: client.serverVersion,
        };
      }
      return statusMap;
    },

    async syncSessions(): Promise<SyncResult> {
      const clients = getClients();
      const deviceId = await getDeviceId();
      const discovered: DiscoveredSession[] = [];

      for (const client of clients) {
        if (!client.isConnected) continue;
        try {
          const raw = (await client.listSessions()) as unknown as SessionsListPayload;
          const allSessions = raw.sessions ?? [];
          const ours = allSessions.filter((s) => isClawWorkSession(s.key, deviceId));

          for (const s of ours) {
            const taskId = parseTaskIdFromSessionKey(s.key);
            if (!taskId) continue;

            const historyRaw = (await client.getChatHistory(s.key, 200)) as unknown as ChatHistoryPayload;
            const rawMsgs = historyRaw.messages ?? [];

            const toolResultMap = new Map<string, string>();
            for (const m of rawMsgs) {
              if (m.role === 'toolResult') {
                for (const b of m.content ?? []) {
                  if (b.type === 'toolResult' && b.id && b.result !== undefined) {
                    toolResultMap.set(b.id, typeof b.result === 'string' ? b.result : JSON.stringify(b.result));
                  }
                }
              }
            }

            const msgs = rawMsgs
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .map((m) => {
                const textContent = (m.content ?? [])
                  .filter((b) => b.type === 'text' && b.text)
                  .map((b) => b.text!)
                  .join('');

                const toolCalls: ParsedToolCall[] = (m.content ?? [])
                  .filter((b) => b.type === 'toolCall' && b.id && b.name)
                  .map((b) => {
                    const tcId = b.id!;
                    const resultText = toolResultMap.get(tcId);
                    return {
                      id: tcId,
                      name: b.name!,
                      status: (resultText !== undefined ? 'done' : 'running') as ParsedToolCall['status'],
                      args:
                        typeof b.arguments === 'object' && b.arguments !== null
                          ? (b.arguments as Record<string, unknown>)
                          : typeof b.arguments === 'string'
                            ? parseToolArgs(b.arguments)
                            : undefined,
                      result: resultText,
                      startedAt: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
                      completedAt:
                        resultText !== undefined
                          ? m.timestamp
                            ? new Date(m.timestamp).toISOString()
                            : new Date().toISOString()
                          : undefined,
                    };
                  });

                return {
                  role: m.role,
                  content: textContent,
                  timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
                  toolCalls,
                };
              })
              .filter((m) => {
                if (!m.content && m.toolCalls.length === 0) return false;
                if (m.role === 'assistant' && INTERNAL_ASSISTANT_MARKERS.has(m.content.trim())) return false;
                return true;
              });

            const firstUserMsg = msgs.find((m) => m.role === 'user' && m.content);
            const titleFromMsg = firstUserMsg ? firstUserMsg.content.slice(0, 30) : '';

            discovered.push({
              gatewayId: client.id,
              taskId,
              sessionKey: s.key,
              title: s.derivedTitle ?? s.label ?? titleFromMsg,
              updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
              agentId: parseAgentIdFromSessionKey(s.key),
              model: s.model,
              modelProvider: s.modelProvider,
              thinkingLevel: s.thinkingLevel,
              inputTokens: s.inputTokens,
              outputTokens: s.outputTokens,
              contextTokens: s.contextTokens,
              messages: msgs,
            });
          }
        } catch (err) {
          reportDebugEvent({
            level: 'warn',
            domain: 'gateway',
            event: 'gateway.sync.client.failed',
            data: { gatewayId: client.id },
            error: { message: err instanceof Error ? err.message : 'sync sessions failed' },
          });
          continue;
        }
      }

      return { ok: true, discovered };
    },

    async listGateways(): Promise<GatewayListItem[]> {
      const configs = await listGatewayConfigs();
      const clients = getClients();
      const clientMap = new Map(clients.map((c) => [c.id, c]));

      return configs.map((cfg) => {
        const client = clientMap.get(cfg.id);
        return {
          id: cfg.id,
          name: cfg.name,
          url: cfg.url,
          token: cfg.token,
          password: cfg.password,
          pairingCode: cfg.pairingCode,
          authMode: cfg.authMode ?? 'token',
          isDefault: cfg.isDefault,
          connected: client?.isConnected ?? false,
        };
      });
    },

    async listModels(gatewayId) {
      const client = getClient(gatewayId);
      if (!client?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        const result = await client.listModels();
        return { ok: true, result };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'listModels failed' };
      }
    },

    async listAgents(gatewayId) {
      const client = getClient(gatewayId);
      if (!client?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        const result = await client.listAgents();
        return { ok: true, result };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'listAgents failed' };
      }
    },

    async getToolsCatalog(gatewayId, agentId) {
      const client = getClient(gatewayId);
      if (!client?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        const result = await client.getToolsCatalog(agentId);
        return { ok: true, result };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'getToolsCatalog failed' };
      }
    },

    async getSkillsStatus(gatewayId, agentId) {
      const client = getClient(gatewayId);
      if (!client?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        const result = await client.getSkillsStatus(agentId);
        return { ok: true, result };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'getSkillsStatus failed' };
      }
    },

    onGatewayEvent(callback) {
      eventListeners.add(callback);
      return () => {
        eventListeners.delete(callback);
      };
    },

    onGatewayStatus(callback) {
      statusListeners.add(callback);
      return () => {
        statusListeners.delete(callback);
      };
    },
  };

  return { transport, broadcastEvent, broadcastStatus };
}
