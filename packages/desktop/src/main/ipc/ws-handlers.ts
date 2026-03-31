import { ipcMain } from 'electron';
import { getGatewayClient, getAllGatewayClients, reconnectGateway } from '../ws/index.js';
import { readConfig, ensureDeviceId } from '../workspace/config.js';
import { isClawWorkSession, parseTaskIdFromSessionKey, parseAgentIdFromSessionKey } from '@clawwork/shared';
import { parseToolArgs } from '@clawwork/core';
import type { ApprovalDecision, ChatAttachment, ExecApprovalResolveParams } from '@clawwork/shared';
import { getDebugLogger } from '../debug/index.js';
import type { GatewayClient } from '../ws/gateway-client.js';

async function gatewayRpc(
  gatewayId: string,
  fn: (gw: GatewayClient) => Promise<Record<string, unknown> | void>,
): Promise<{
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
  errorCode?: string;
  errorDetails?: Record<string, unknown>;
}> {
  const gw = getGatewayClient(gatewayId);
  if (!gw?.isConnected) return { ok: false, error: 'gateway not connected', errorCode: 'GATEWAY_NOT_CONNECTED' };
  try {
    const result = await fn(gw);
    return result ? { ok: true, result } : { ok: true };
  } catch (err) {
    const typed = err as Error & { code?: string; details?: Record<string, unknown> };
    return {
      ok: false,
      error: typed.message ?? 'unknown error',
      errorCode: typed.code,
      errorDetails: typed.details,
    };
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

const INTERNAL_ASSISTANT_MARKERS = new Set(['NO_REPLY']);

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
        return { ok: false, error: 'gateway not connected', errorCode: 'GATEWAY_NOT_CONNECTED' };
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
        const typed = err as Error & { code?: string; details?: Record<string, unknown> };
        const msg = typed.message ?? 'unknown error';
        getDebugLogger().error({
          domain: 'ipc',
          event: 'ipc.ws.send-message.failed',
          gatewayId: payload.gatewayId,
          sessionKey: payload.sessionKey,
          taskId,
          error: { message: msg, code: typed.code },
        });
        return { ok: false, error: msg, errorCode: typed.code, errorDetails: typed.details };
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

  ipcMain.handle('ws:list-sessions-by-spawner', async (_event, payload: { gatewayId: string; spawnedBy: string }) => {
    const gw = getGatewayClient(payload.gatewayId);
    if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
    try {
      const result = await gw.listSessionsBySpawner(payload.spawnedBy);
      return { ok: true, result };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
    }
  });

  ipcMain.handle(
    'ws:create-session',
    async (_event, payload: { gatewayId: string; key: string; agentId: string; message?: string }) => {
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        const result = await gw.createSession({
          key: payload.key,
          agentId: payload.agentId,
          message: payload.message,
        });
        return { ok: true, result };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
      }
    },
  );

  ipcMain.handle('ws:gateway-status', () => {
    const clients = getAllGatewayClients();
    const statusMap: Record<string, { connected: boolean; name: string; error?: string; serverVersion?: string }> = {};
    for (const [id, client] of clients) {
      statusMap[id] = {
        connected: client.isConnected,
        name: client.name,
        error: client.lastConnectionError ?? undefined,
        serverVersion: client.version,
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
        const deviceId = ensureDeviceId();
        const raw = (await gw.listSessions()) as unknown as SessionsListPayload;
        const allSessions = raw.sessions ?? [];
        const ours = allSessions.filter((s) => isClawWorkSession(s.key, deviceId));

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
            gatewayId,
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

  ipcMain.handle('ws:agents-list', async (_event, payload: { gatewayId: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.listAgents()),
  );

  ipcMain.handle(
    'ws:agents-create',
    async (_event, payload: { gatewayId: string; name: string; workspace: string; emoji?: string; avatar?: string }) =>
      gatewayRpc(payload.gatewayId, (gw) =>
        gw.createAgent({
          name: payload.name,
          workspace: payload.workspace,
          emoji: payload.emoji,
          avatar: payload.avatar,
        }),
      ),
  );

  ipcMain.handle(
    'ws:agents-update',
    async (
      _event,
      payload: {
        gatewayId: string;
        agentId: string;
        name?: string;
        workspace?: string;
        model?: string;
        avatar?: string;
        emoji?: string;
      },
    ) =>
      gatewayRpc(payload.gatewayId, (gw) =>
        gw.updateAgent({
          agentId: payload.agentId,
          name: payload.name,
          workspace: payload.workspace,
          model: payload.model,
          avatar: payload.avatar,
          emoji: payload.emoji,
        }),
      ),
  );

  ipcMain.handle(
    'ws:agents-delete',
    async (_event, payload: { gatewayId: string; agentId: string; deleteFiles?: boolean }) =>
      gatewayRpc(payload.gatewayId, (gw) =>
        gw.deleteAgent({ agentId: payload.agentId, deleteFiles: payload.deleteFiles }),
      ),
  );

  ipcMain.handle('ws:agents-files-list', async (_event, payload: { gatewayId: string; agentId: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.listAgentFiles(payload.agentId)),
  );

  ipcMain.handle('ws:agents-files-get', async (_event, payload: { gatewayId: string; agentId: string; name: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.getAgentFile(payload.agentId, payload.name)),
  );

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
        const result = await gw.patchSession({ key: payload.sessionKey, ...payload.patch });
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
      payload: ExecApprovalResolveParams & {
        gatewayId: string;
      },
    ) => {
      const gw = getGatewayClient(payload.gatewayId);
      if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
      try {
        await gw.sendReq('exec.approval.resolve', {
          id: payload.id,
          decision: payload.decision as ApprovalDecision,
        });
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

  ipcMain.handle('ws:cron-list', async (_event, payload: { gatewayId: string; [k: string]: unknown }) => {
    const { gatewayId, ...params } = payload;
    return gatewayRpc(gatewayId, (gw) => gw.listCronJobs(params));
  });

  ipcMain.handle('ws:cron-status', async (_event, payload: { gatewayId: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.getCronStatus()),
  );

  ipcMain.handle('ws:cron-add', async (_event, payload: { gatewayId: string; [k: string]: unknown }) => {
    const { gatewayId, ...params } = payload;
    return gatewayRpc(gatewayId, (gw) => gw.addCronJob(params));
  });

  ipcMain.handle(
    'ws:cron-update',
    async (_event, payload: { gatewayId: string; jobId: string; patch: Record<string, unknown> }) =>
      gatewayRpc(payload.gatewayId, (gw) => gw.updateCronJob(payload.jobId, payload.patch)),
  );

  ipcMain.handle('ws:cron-remove', async (_event, payload: { gatewayId: string; jobId: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.removeCronJob(payload.jobId)),
  );

  ipcMain.handle('ws:cron-run', async (_event, payload: { gatewayId: string; jobId: string; mode?: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.runCronJob(payload.jobId, payload.mode)),
  );

  ipcMain.handle('ws:cron-runs', async (_event, payload: { gatewayId: string; [k: string]: unknown }) => {
    const { gatewayId, ...params } = payload;
    return gatewayRpc(gatewayId, (gw) => gw.listCronRuns(params));
  });
}
