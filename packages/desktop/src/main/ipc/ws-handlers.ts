import { ipcMain } from 'electron';
import { createHash } from 'crypto';
import { getGatewayClient, getAllGatewayClients, reconnectGateway } from '../ws/index.js';
import { readConfig, ensureDeviceId } from '../workspace/config.js';
import {
  isClawWorkSession,
  isSubagentSession,
  isSystemSession,
  parseTaskIdFromSessionKey,
  parseAgentIdFromSessionKey,
} from '@clawwork/shared';
import { normalizeContentBlocks, parseToolArgs } from '@clawwork/core';
import type {
  ApprovalDecision,
  ChatAttachment,
  CommandsListParams,
  ConfigPatchParams,
  ConfigSetParams,
  ExecApprovalResolveParams,
  SkillInstallParams,
  SkillSearchParams,
  SkillUpdateParams,
} from '@clawwork/shared';
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
  agentId?: string;
  agent?: {
    id?: string;
    workspace?: string;
  };
  sessionId?: string;
  workspace?: string;
  workspacePath?: string;
  cwd?: string;
  workingDir?: string;
  workingDirectory?: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  parentKey?: string;
  spawnerKey?: string;
  isSubagent?: boolean;
  type?: string;
  role?: string;
  updatedAt: number | string | null;
  startedAt?: number | string;
  derivedTitle?: string;
  title?: string;
  name?: string;
  label?: string;
  displayName?: string;
  model?: string;
  modelProvider?: string;
  provider?: string;
  thinkingLevel?: string;
  reasoningLevel?: string;
  fastMode?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  contextTokens?: number;
}

interface ChatHistoryMessage {
  role: string;
  content:
    | string
    | {
        type: string;
        text?: string;
        thinking?: string;
        url?: string;
        openUrl?: string;
        alt?: string;
        mimeType?: string;
        id?: string;
        name?: string;
        arguments?: Record<string, unknown> | string;
        result?: unknown;
      }[];
  timestamp?: number;
  ts?: number;
}

interface ChatHistoryPayload {
  messages?: ChatHistoryMessage[];
  sessionId?: string;
}

const INTERNAL_ASSISTANT_MARKERS = new Set(['NO_REPLY']);
const RELATIVE_GATEWAY_MEDIA_PATH_RE = /^\/(?:api\/chat\/media\/outgoing\/|media\/|__openclaw__\/media\/)/;
const SESSION_METADATA_KEYS = new Set([
  'recent',
  'count',
  'path',
  'defaults',
  'sessionDefaults',
  'ts',
  'timestamp',
  'updatedAt',
  'sessions',
  'items',
  'rows',
  'data',
  'result',
  'global',
  'main',
  'default',
  'current',
  'active',
  'latest',
  'unknown',
]);

function nativeTaskIdForSessionKey(sessionKey: string): string {
  const parsed = parseTaskIdFromSessionKey(sessionKey);
  if (parsed) return parsed;
  return `native-${createHash('sha256').update(sessionKey).digest('hex').slice(0, 24)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stringField(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = nonEmptyString(source[key]);
    if (value) return value;
  }
  return undefined;
}

function isSessionMetadataKey(key: string): boolean {
  return SESSION_METADATA_KEYS.has(key);
}

function isLikelySessionKey(key: string | undefined): key is string {
  if (!key || isSessionMetadataKey(key)) return false;
  return /^(agent|openclaw|dashboard)[:\uFF1A]/i.test(key) || (key.includes(':') && /session/i.test(key));
}

function hasSessionTitlePrefix(value: Record<string, unknown>): boolean {
  const title = stringField(value, ['derivedTitle', 'label', 'title', 'displayName', 'name']);
  return /^\s*(dashboard|cron)\s*[:\uFF1A]/i.test(title ?? '');
}

function normalizeGatewaySessionRow(value: unknown, mapKey?: string): GatewaySessionRow | null {
  if (!isRecord(value)) {
    const key = nonEmptyString(mapKey);
    return isLikelySessionKey(key) ? ({ key, updatedAt: null } as GatewaySessionRow) : null;
  }

  const agent = isRecord(value.agent) ? (value.agent as GatewaySessionRow['agent']) : undefined;
  const explicitKey = stringField(value, ['key', 'sessionKey', 'sessionId', 'id']);
  const mapSessionKey = nonEmptyString(mapKey);
  const key = explicitKey ?? (isLikelySessionKey(mapSessionKey) || hasSessionTitlePrefix(value) ? mapSessionKey : undefined);
  if (!key || isSessionMetadataKey(key)) return null;

  return {
    ...(value as Record<string, unknown>),
    key,
    agent,
    agentId: stringField(value, ['agentId', 'agentID', 'agent_id']) ?? agent?.id,
    sessionId: stringField(value, ['sessionId', 'sessionID']) ?? stringField(value, ['id']),
    spawnedBy: stringField(value, ['spawnedBy', 'spawnedBySessionKey']),
    parentSessionKey: stringField(value, ['parentSessionKey', 'parentSessionId']),
    parentKey: stringField(value, ['parentKey']),
    spawnerKey: stringField(value, ['spawnerKey']),
    workspace: stringField(value, ['workspace', 'workspaceRoot']),
    workspacePath: stringField(value, ['workspacePath', 'worktreePath']),
    cwd: stringField(value, ['cwd']),
    workingDir: stringField(value, ['workingDir']),
    workingDirectory: stringField(value, ['workingDirectory']),
    updatedAt: typeof value.updatedAt === 'number' || typeof value.updatedAt === 'string' ? value.updatedAt : null,
  } as GatewaySessionRow;
}

function collectSessionRows(value: unknown): GatewaySessionRow[] {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeGatewaySessionRow(item)).filter((item): item is GatewaySessionRow => !!item);
  }

  if (!isRecord(value)) return [];

  const nestedKeys = ['sessions', 'items', 'rows', 'data', 'result'];
  for (const key of nestedKeys) {
    if (key in value) {
      return collectSessionRows(value[key]);
    }
  }

  const single = normalizeGatewaySessionRow(value);
  if (single) return [single];

  return Object.entries(value)
    .filter(([key]) => !isSessionMetadataKey(key))
    .map(([key, row]) => normalizeGatewaySessionRow(row, key))
    .filter((item): item is GatewaySessionRow => !!item);
}

function explicitSessionAgentId(session: GatewaySessionRow): string | undefined {
  return session.agentId || session.agent?.id;
}

function dashboardSessionAgentId(sessionKey: string): string | undefined {
  return sessionKey.match(/^dashboard[:\uFF1A]([^:\uFF1A]+)(?:[:\uFF1A]|$)/i)?.[1];
}

function inferredSessionAgentId(session: GatewaySessionRow): string | undefined {
  return explicitSessionAgentId(session) || dashboardSessionAgentId(session.key);
}

function sessionAgentId(session: GatewaySessionRow, fallbackAgentId?: string): string {
  return inferredSessionAgentId(session) || fallbackAgentId || parseAgentIdFromSessionKey(session.key);
}

function sessionWorkspace(session: GatewaySessionRow): string | undefined {
  return (
    session.workspace ||
    session.workspacePath ||
    session.cwd ||
    session.workingDir ||
    session.workingDirectory ||
    session.agent?.workspace
  );
}

function normalizePathForCompare(path: string | undefined): string {
  return (path ?? '').trim().replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function isDerivedSession(session: GatewaySessionRow): boolean {
  return Boolean(
    session.spawnedBy ||
      session.parentSessionKey ||
      session.parentKey ||
      session.spawnerKey ||
      session.isSubagent ||
      session.type === 'subagent' ||
      session.role === 'subagent',
  );
}

function shouldSyncSession(session: GatewaySessionRow, deviceId: string, filter?: SyncSessionFilter): boolean {
  if (
    !session.key ||
    isDerivedSession(session) ||
    session.type === 'system' ||
    session.role === 'system' ||
    isSystemSession(session.key) ||
    isSubagentSession(session.key)
  )
    return false;
  if (!filter?.agentId && !filter?.workspace) return isClawWorkSession(session.key, deviceId);

  const agentId = inferredSessionAgentId(session);
  if (filter.agentId && agentId && agentId !== filter.agentId) return false;

  const workspace = sessionWorkspace(session);
  if (!filter.agentId && filter.workspace && workspace) {
    return normalizePathForCompare(workspace) === normalizePathForCompare(filter.workspace);
  }
  return true;
}

function sessionListParamsForFilter(filter?: SyncSessionFilter): Record<string, unknown> {
  if (!filter?.agentId && !filter?.workspace) return {};
  if (filter.agentId) return { agentId: filter.agentId };

  return {
    includeGlobal: true,
    includeUnknown: true,
    includeDerivedTitles: true,
    includeLastMessage: true,
  };
}

function messageContentBlocks(message: ChatHistoryMessage): Exclude<ChatHistoryMessage['content'], string> {
  if (Array.isArray(message.content)) return message.content;
  if (typeof message.content === 'string' && message.content.length > 0) {
    return [{ type: 'text', text: message.content }];
  }
  return [];
}

function messageTimestamp(message: ChatHistoryMessage): number | undefined {
  return typeof message.timestamp === 'number'
    ? message.timestamp
    : typeof message.ts === 'number'
      ? message.ts
      : undefined;
}

function toIsoTimestamp(value: number | string | null | undefined): string {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return new Date().toISOString();
  const millis = value < 10_000_000_000 ? value * 1000 : value;
  return new Date(millis).toISOString();
}

function sessionTitle(session: GatewaySessionRow, titleFromMsg: string): string {
  const explicitTitle = session.derivedTitle ?? session.label ?? session.title ?? session.displayName ?? session.name;
  if (explicitTitle) return explicitTitle;
  if (/^dashboard[:\uFF1A]/i.test(session.key)) return session.key.replace(/^dashboard[:\uFF1A]?/i, 'dashboard: ');
  return titleFromMsg;
}

function isCronSessionTitle(title: string | undefined): boolean {
  return /^\s*cron\s*[:\uFF1A]/i.test(title ?? '');
}

function isDashboardSession(session: GatewaySessionRow, title: string | undefined): boolean {
  return /^dashboard[:\uFF1A]/i.test(session.key) || /^\s*dashboard\s*[:\uFF1A]/i.test(title ?? '');
}

interface SyncSessionFilter {
  gatewayId?: string;
  agentId?: string;
  workspace?: string;
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

function resolveRelativeImageUrls(messages: Record<string, unknown>[], httpBase: string): void {
  for (const msg of messages) {
    const blocks = msg.content;
    if (!Array.isArray(blocks)) continue;
    for (const block of blocks) {
      if (typeof block !== 'object' || block === null) continue;
      const imageBlock = block as Record<string, unknown>;
      if (imageBlock.type !== 'image') continue;
      if (typeof imageBlock.url === 'string' && RELATIVE_GATEWAY_MEDIA_PATH_RE.test(imageBlock.url)) {
        imageBlock.url = new URL(imageBlock.url, httpBase).toString();
      }
      if (typeof imageBlock.openUrl === 'string' && RELATIVE_GATEWAY_MEDIA_PATH_RE.test(imageBlock.openUrl)) {
        imageBlock.openUrl = new URL(imageBlock.openUrl, httpBase).toString();
      }
    }
  }
}

export function registerWsHandlers(): void {
  ipcMain.handle('ws:get-http-base', async (_event, payload: { gatewayId: string }) => {
    const gw = getGatewayClient(payload.gatewayId);
    return gw?.httpBase;
  });

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
        const result = (await gw.getChatHistory(payload.sessionKey, payload.limit)) as Record<string, unknown> & {
          messages?: Record<string, unknown>[];
        };
        if (result?.messages?.length) {
          resolveRelativeImageUrls(result.messages, gw.httpBase);
        }
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
    const { spawnedBy } = payload;
    if (!spawnedBy || typeof spawnedBy !== 'string' || spawnedBy.length === 0) {
      return { ok: false, error: 'invalid spawnedBy parameter' };
    }
    const gw = getGatewayClient(payload.gatewayId);
    if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
    try {
      const result = await gw.listSessionsBySpawner(spawnedBy);
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

  ipcMain.handle('ws:sync-sessions', async (_event, filter?: SyncSessionFilter) => {
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
      messages: {
        role: string;
        content: string;
        timestamp: string;
        attachments?: unknown[];
        toolCalls: ParsedToolCall[];
      }[];
    }[] = [];

    for (const [gatewayId, gw] of clients) {
      if (filter?.gatewayId && filter.gatewayId !== gatewayId) continue;
      if (!gw.isConnected) continue;
      try {
        const deviceId = ensureDeviceId();
        const params = sessionListParamsForFilter(filter);
        const raw = await gw.listSessions(params);
        const allSessions = collectSessionRows(raw);
        const ours = allSessions.filter((s) => shouldSyncSession(s, deviceId, filter));
        getDebugLogger().info({
          domain: 'ipc',
          event: 'ipc.ws.sync-sessions.listed',
          gatewayId,
          data: {
            requestedAgentId: filter?.agentId,
            requestedWorkspace: filter?.workspace,
            paramKeys: Object.keys(params),
            sessionCount: allSessions.length,
            importableCount: ours.length,
          },
        });

        for (const s of ours) {
          const taskId = nativeTaskIdForSessionKey(s.key);
          if (!taskId) continue;

          let rawMsgs: ChatHistoryMessage[] = [];
          try {
            const historyRaw = (await gw.getChatHistory(s.key, 200)) as unknown as ChatHistoryPayload;
            rawMsgs = Array.isArray(historyRaw.messages) ? historyRaw.messages : [];
          } catch (err) {
            getDebugLogger().warn({
              domain: 'ipc',
              event: 'ipc.ws.sync-sessions.history-failed',
              gatewayId,
              sessionKey: s.key,
              data: { agentId: filter?.agentId },
              error: { message: err instanceof Error ? err.message : 'unknown error' },
            });
          }

          const toolResultMap = new Map<string, string>();
          for (const m of rawMsgs) {
            if (m.role === 'toolResult') {
              for (const b of messageContentBlocks(m)) {
                if (b.type === 'toolResult' && b.id && b.result !== undefined) {
                  toolResultMap.set(b.id, typeof b.result === 'string' ? b.result : JSON.stringify(b.result));
                }
              }
            }
          }

          const msgs = rawMsgs
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => {
              const blocks = messageContentBlocks(m);
              const timestamp = messageTimestamp(m);
              const normalizedContent =
                m.role === 'assistant'
                  ? normalizeContentBlocks(blocks, gw.httpBase)
                  : {
                      content: blocks
                        .filter((b) => b.type === 'text' && b.text)
                        .map((b) => b.text!)
                        .join(''),
                    };

              const toolCalls: ParsedToolCall[] = blocks
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
                    startedAt: toIsoTimestamp(timestamp),
                    completedAt:
                      resultText !== undefined
                        ? toIsoTimestamp(timestamp)
                        : undefined,
                  };
                });

              return {
                role: m.role,
                content: normalizedContent.content,
                attachments: normalizedContent.attachments,
                timestamp: toIsoTimestamp(timestamp),
                toolCalls,
              };
            })
            .filter((m) => {
              if (!m.content && m.toolCalls.length === 0 && !m.attachments?.length) return false;
              if (m.role === 'assistant' && INTERNAL_ASSISTANT_MARKERS.has(m.content.trim())) return false;
              return true;
            });

          const firstUserMsg = msgs.find((m) => m.role === 'user' && m.content);
          const titleFromMsg = firstUserMsg ? firstUserMsg.content.slice(0, 30) : '';
          const title = sessionTitle(s, titleFromMsg);
          if (isCronSessionTitle(title)) continue;
          if (!title.trim() && msgs.length === 0 && !isDashboardSession(s, title)) continue;

          discovered.push({
            gatewayId,
            taskId,
            sessionKey: s.key,
            title,
            updatedAt: toIsoTimestamp(s.updatedAt),
            agentId: sessionAgentId(s, filter?.agentId),
            model: s.model,
            modelProvider: s.modelProvider ?? s.provider,
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
      return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
    }
  });

  ipcMain.handle('ws:commands-list', async (_event, payload: { gatewayId: string } & CommandsListParams) => {
    const gw = getGatewayClient(payload.gatewayId);
    if (!gw?.isConnected) return { ok: false, error: 'gateway not connected' };
    const params: Record<string, unknown> = {
      scope: payload.scope ?? 'text',
      includeArgs: payload.includeArgs ?? true,
    };
    if (payload.agentId) params.agentId = payload.agentId;
    if (payload.provider) params.provider = payload.provider;
    try {
      const result = await gw.listCommands(params);
      return { ok: true, result };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
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
      },
    ) =>
      gatewayRpc(payload.gatewayId, (gw) =>
        gw.updateAgent({
          agentId: payload.agentId,
          name: payload.name,
          workspace: payload.workspace,
          model: payload.model,
          avatar: payload.avatar,
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
    'ws:agents-files-set',
    async (_event, payload: { gatewayId: string; agentId: string; name: string; content: string }) =>
      gatewayRpc(payload.gatewayId, (gw) => gw.setAgentFile(payload.agentId, payload.name, payload.content)),
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

  ipcMain.handle(
    'ws:skills-status',
    async (
      _event,
      payload: {
        gatewayId: string;
        agentId?: string;
      },
    ) => gatewayRpc(payload.gatewayId, (gw) => gw.getSkillsStatus(payload.agentId)),
  );

  ipcMain.handle('ws:skills-search', async (_event, payload: { gatewayId: string } & SkillSearchParams) => {
    const { gatewayId, ...params } = payload;
    return gatewayRpc(gatewayId, (gw) => gw.searchSkills(params));
  });

  ipcMain.handle('ws:skills-detail', async (_event, payload: { gatewayId: string; slug: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.getSkillDetail(payload.slug)),
  );

  ipcMain.handle('ws:skills-install', async (_event, payload: { gatewayId: string } & SkillInstallParams) => {
    const { gatewayId, ...params } = payload;
    return gatewayRpc(gatewayId, (gw) => gw.installSkill(params));
  });

  ipcMain.handle('ws:skills-update', async (_event, payload: { gatewayId: string } & SkillUpdateParams) => {
    const { gatewayId, ...params } = payload;
    return gatewayRpc(gatewayId, (gw) => gw.updateSkill(params));
  });

  ipcMain.handle('ws:skills-bins', async (_event, payload: { gatewayId: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.getSkillBins()),
  );

  ipcMain.handle('ws:config-get', async (_event, payload: { gatewayId: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.getConfig()),
  );

  ipcMain.handle('ws:config-set', async (_event, payload: { gatewayId: string } & ConfigSetParams) => {
    const { gatewayId, ...params } = payload;
    return gatewayRpc(gatewayId, (gw) => gw.setConfig(params));
  });

  ipcMain.handle('ws:config-patch', async (_event, payload: { gatewayId: string } & ConfigPatchParams) => {
    const { gatewayId, ...params } = payload;
    return gatewayRpc(gatewayId, (gw) => gw.patchConfig(params));
  });

  ipcMain.handle('ws:config-schema', async (_event, payload: { gatewayId: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.getConfigSchema()),
  );

  ipcMain.handle('ws:config-schema-lookup', async (_event, payload: { gatewayId: string; path: string }) =>
    gatewayRpc(payload.gatewayId, (gw) => gw.lookupConfigSchema(payload.path)),
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
    'ws:session-preview',
    async (
      _event,
      payload: {
        gatewayId: string;
        keys: string[];
        limit?: number;
        maxChars?: number;
      },
    ) => {
      const { gatewayId, keys, limit, maxChars } = payload;
      if (!keys.length) return { ok: false, error: 'no session keys provided' };
      return gatewayRpc(gatewayId, (gw) => gw.previewSessions({ keys, limit, maxChars }));
    },
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
