import { ipcMain } from 'electron';
import { getGatewayClient, getAllGatewayClients, reconnectGateway } from '../ws/index.js';
import { readConfig } from '../workspace/config.js';
import { isClawWorkSession, parseTaskIdFromSessionKey, parseAgentIdFromSessionKey } from '@clawwork/shared';
import type { ChatAttachment } from '@clawwork/shared';
import { getDebugLogger } from '../debug/index.js';
import type { GatewayClient } from '../ws/gateway-client.js';

async function gatewayRpc(
  gatewayId: string,
  fn: (gw: GatewayClient) => Promise<Record<string, unknown> | void>,
): Promise<{ ok: boolean; result?: Record<string, unknown>; error?: string }> {
  const gw = getGatewayClient(gatewayId);
  if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
  try {
    const result = await fn(gw);
    return result ? { ok: true, result } : { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

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
  reasoningLevel?: string;
  fastMode?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  contextTokens?: number;
}

interface SessionsListPayload {
  sessions?: GatewaySessionRow[];
}

interface ChatHistoryMessage {
  role: string;
  content: {
    type: string;
    text?: string;
    thinking?: string;
    id?: string;
    name?: string;
    arguments?: unknown;
    result?: unknown;
  }[];
  timestamp?: number;
}

interface ChatHistoryPayload {
  messages?: ChatHistoryMessage[];
  sessionId?: string;
}

/** Parsed tool call for transport to renderer */
interface ParsedToolCall {
  id: string;
  name: string;
  status: 'running' | 'done' | 'error';
  args?: Record<string, unknown>;
  result?: string;
  startedAt: string;
  completedAt?: string;
}

export function registerWsHandlers(): void {
  ipcMain.handle(
    'ws:send-message',
    async (
      _event,
      payload: {
        gatewayId: string;
        sessionKey: string;
        content: string;
        attachments?: ChatAttachment[];
      },
    ) => {
      const taskId = parseTaskIdFromSessionKey(payload.sessionKey) ?? undefined;
      getDebugLogger().info({
        domain: 'ipc',
        event: 'ipc.ws.send-message.requested',
        gatewayId: payload.gatewayId,
        sessionKey: payload.sessionKey,
        taskId,
        data: { contentLength: payload.content.length, attachmentCount: payload.attachments?.length ?? 0 },
      });
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) {
        getDebugLogger().error({
          domain: 'ipc',
          event: 'ipc.ws.send-message.failed',
          gatewayId: payload.gatewayId,
          sessionKey: payload.sessionKey,
          taskId,
          error: { message: 'gateway not connected' },
        });
        return { ok: false, error: 'gateway not connected' };
      }
      try {
        await gw.sendChatMessage(payload.sessionKey, payload.content, payload.attachments);
        getDebugLogger().info({
          domain: 'ipc',
          event: 'ipc.ws.send-message.completed',
          gatewayId: payload.gatewayId,
          sessionKey: payload.sessionKey,
          taskId,
          ok: true,
        });
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        getDebugLogger().error({
          domain: 'ipc',
          event: 'ipc.ws.send-message.failed',
          gatewayId: payload.gatewayId,
          sessionKey: payload.sessionKey,
          taskId,
          error: { message: msg },
        });
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle(
    'ws:chat-history',
    async (
      _event,
      payload: {
        gatewayId: string;
        sessionKey: string;
        limit?: number;
      },
    ) => {
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) {
        return { ok: false, error: 'gateway not connected' };
      }
      try {
        const result = await gw.getChatHistory(payload.sessionKey, payload.limit);
        return { ok: true, result };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle(
    'ws:list-sessions',
    async (
      _event,
      payload: {
        gatewayId: string;
      },
    ) => {
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) {
        return { ok: false, error: 'gateway not connected' };
      }
      try {
        const result = await gw.listSessions();
        return { ok: true, result };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle('ws:gateway-status', () => {
    const clients = getAllGatewayClients();
    const statusMap: Record<string, { connected: boolean; name: string; error?: string }> = {};
    for (const [id, client] of clients) {
      statusMap[id] = {
        connected: client.isConnected,
        name: client.name,
        error: client.lastConnectionError ?? undefined,
      };
    }
    return statusMap;
  });

  ipcMain.handle('ws:sync-sessions', async () => {
    const clients = getAllGatewayClients();
    getDebugLogger().info({
      domain: 'ipc',
      event: 'ipc.ws.sync-sessions.started',
      data: { gatewayCount: clients.size },
    });

    const discovered: {
      gatewayId: string;
      taskId: string;
      sessionKey: string;
      title: string;
      updatedAt: string;
      agentId: string;
      model?: string;
      modelProvider?: string;
      thinkingLevel?: string;
      inputTokens?: number;
      outputTokens?: number;
      contextTokens?: number;
      messages: { role: string; content: string; timestamp: string; toolCalls: ParsedToolCall[] }[];
    }[] = [];

    for (const [gatewayId, gw] of clients) {
      if (!gw.isConnected) continue;
      try {
        const raw = (await gw.listSessions()) as unknown as SessionsListPayload;
        const allSessions = raw.sessions ?? [];
        const ours = allSessions.filter((s) => isClawWorkSession(s.key));

        for (const s of ours) {
          const taskId = parseTaskIdFromSessionKey(s.key);
          if (!taskId) continue;

          const historyRaw = (await gw.getChatHistory(s.key, 200)) as unknown as ChatHistoryPayload;
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
                          ? safeJsonParse(b.arguments)
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
            .filter((m) => m.content || m.toolCalls.length > 0);

          discovered.push({
            gatewayId,
            taskId,
            sessionKey: s.key,
            title: s.derivedTitle ?? s.label ?? s.displayName ?? '',
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
        const msg = err instanceof Error ? err.message : 'unknown error';
        getDebugLogger().error({
          domain: 'ipc',
          event: 'ipc.ws.sync-sessions.gateway-failed',
          gatewayId,
          error: { message: msg },
        });
      }
    }

    getDebugLogger().info({
      domain: 'ipc',
      event: 'ipc.ws.sync-sessions.completed',
      data: { discoveredCount: discovered.length },
    });
    return { ok: true, discovered };
  });

  ipcMain.handle('ws:models-list', async (_event, payload: { gatewayId: string }) => {
    const gw = getGatewayClient(payload.gatewayId);
    if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
    try {
      const result = await gw.listModels();
      return { ok: true, result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle('ws:agents-list', async (_event, payload: { gatewayId: string }) => {
    const gw = getGatewayClient(payload.gatewayId);
    if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
    try {
      const result = await gw.listAgents();
      return { ok: true, result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle(
    'ws:session-patch',
    async (
      _event,
      payload: {
        gatewayId: string;
        sessionKey: string;
        patch: Record<string, unknown>;
      },
    ) => {
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        const result = await gw.patchSession({ sessionKey: payload.sessionKey, ...payload.patch });
        return { ok: true, result };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle('ws:list-gateways', async () => {
    const config = readConfig();
    const clients = getAllGatewayClients();
    return (config?.gateways ?? []).map((gw) => ({
      ...gw,
      connected: clients.get(gw.id)?.isConnected ?? false,
    }));
  });

  ipcMain.handle('ws:abort-chat', async (_event, payload: { gatewayId: string; sessionKey: string }) => {
    const gw = getGatewayClient(payload.gatewayId);
    if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
    try {
      await gw.abortChat(payload.sessionKey);
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return { ok: false, error: msg };
    }
  });

  ipcMain.handle(
    'ws:tools-catalog',
    async (
      _event,
      payload: {
        gatewayId: string;
        agentId?: string;
      },
    ) => gatewayRpc(payload.gatewayId, (gw) => gw.getToolsCatalog(payload.agentId)),
  );

  ipcMain.handle('ws:usage-status', async (_event, payload: { gatewayId: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.getUsageStatus()),
  );

  ipcMain.handle(
    'ws:usage-cost',
    async (
      _event,
      payload: {
        gatewayId: string;
        startDate?: string;
        endDate?: string;
        days?: number;
      },
    ) =>
      gatewayRpc(payload.gatewayId, (gw) =>
        gw.getUsageCost({
          startDate: payload.startDate,
          endDate: payload.endDate,
          days: payload.days,
        }),
      ),
  );

  ipcMain.handle('ws:session-usage', async (_event, payload: { gatewayId: string; sessionKey: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.getSessionUsage({ key: payload.sessionKey })),
  );

  ipcMain.handle(
    'ws:exec-approval-resolve',
    async (
      _event,
      payload: {
        gatewayId: string;
        id: string;
        decision: string;
      },
    ) => {
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        await gw.sendReq('exec.approval.resolve', { id: payload.id, decision: payload.decision });
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle(
    'ws:session-reset',
    async (
      _event,
      payload: {
        gatewayId: string;
        sessionKey: string;
        reason?: 'new' | 'reset';
      },
    ) => {
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        await gw.resetSession(payload.sessionKey, payload.reason);
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle(
    'ws:session-delete',
    async (
      _event,
      payload: {
        gatewayId: string;
        sessionKey: string;
      },
    ) => {
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        await gw.deleteSession(payload.sessionKey, true);
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle(
    'ws:session-compact',
    async (
      _event,
      payload: {
        gatewayId: string;
        sessionKey: string;
        maxLines?: number;
      },
    ) => {
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        await gw.compactSession(payload.sessionKey, payload.maxLines);
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle('ws:reconnect-gateway', (_event, payload: { gatewayId: string }) => {
    reconnectGateway(payload.gatewayId);
    return { ok: true };
  });
}

function safeJsonParse(raw: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { raw };
  }
}
