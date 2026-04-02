import WebSocket from 'ws';
import { app } from 'electron';
import { randomUUID } from 'crypto';
import {
  HEARTBEAT_INTERVAL_MS,
  RECONNECT_DELAY_MS,
  MAX_RECONNECT_ATTEMPTS,
  parseTaskIdFromSessionKey,
  summarizePayload,
} from '@clawwork/shared';
import type {
  GatewayFrame,
  GatewayReqFrame,
  GatewayResFrame,
  GatewayConnectParams,
  GatewayClientConfig,
  GatewayAuth,
  ChatAttachment,
} from '@clawwork/shared';
import { sendToWindow } from './window-utils.js';
import { getMainWindow } from '../window-manager.js';
import {
  loadOrCreateDeviceIdentity,
  buildDeviceConnectPayload,
  saveDeviceToken,
  loadDeviceToken,
  type DeviceIdentity,
} from './device-identity.js';
import { getDebugLogger } from '../debug/index.js';
import { ensureGatewayWindowsSystemTrust } from './tls-trust.js';

const WS_CLOSE_POLICY_VIOLATION = 1008;
const WS_HANDSHAKE_TIMEOUT_MS = 10_000;

type GatewayClientOptions = {
  noReconnect?: boolean;
  onPairingSuccess?: (gatewayId: string) => void;
};

type PendingReq = {
  resolve: (payload: Record<string, unknown>) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  method: string;
  startedAt: number;
  requestId: string;
  sessionKey?: string;
  taskId?: string;
};

const REQ_TIMEOUT_MS = 15_000;

export class GatewayClient {
  private ws: WebSocket | null = null;
  private authenticated = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pendingRequests = new Map<string, PendingReq>();
  private destroyed = false;
  private noReconnect = false;
  private wsUrl: string;
  private auth: GatewayAuth;
  private gatewayId: string;
  private gatewayName: string;
  private connectNonce: string | null = null;
  private deviceIdentity: DeviceIdentity;
  private lastError: string | null = null;
  private lastErrorCode: string | null = null;
  private serverVersion: string | undefined;
  private onPairingSuccess?: (gatewayId: string) => void;

  constructor(config: GatewayClientConfig, opts?: GatewayClientOptions) {
    this.gatewayId = config.id;
    this.gatewayName = config.name;
    this.wsUrl = config.url;
    this.auth = config.auth;
    this.deviceIdentity = loadOrCreateDeviceIdentity();
    if (opts?.noReconnect) this.noReconnect = true;
    this.onPairingSuccess = opts?.onPairingSuccess;
  }

  get id(): string {
    return this.gatewayId;
  }

  get name(): string {
    return this.gatewayName;
  }

  updateConfig(config: Partial<GatewayClientConfig>): void {
    if (config.id !== undefined) this.gatewayId = config.id;
    if (config.name !== undefined) this.gatewayName = config.name;
    if (config.url !== undefined) this.wsUrl = config.url;
    if (config.auth !== undefined) this.auth = config.auth;
    this.reconnectAttempts = 0;
    this.connect();
  }

  connect(): void {
    if (this.destroyed) return;
    ensureGatewayWindowsSystemTrust();
    this.cleanup();
    this.lastError = null;

    getDebugLogger().info({
      domain: 'gateway',
      event: 'gateway.connect.start',
      gatewayId: this.gatewayId,
      attempt: this.reconnectAttempts + 1,
      data: { wsUrl: this.wsUrl },
    });
    this.ws = new WebSocket(this.wsUrl, { handshakeTimeout: WS_HANDSHAKE_TIMEOUT_MS });

    this.ws.on('open', () => {
      getDebugLogger().info({
        domain: 'gateway',
        event: 'gateway.ws.open',
        gatewayId: this.gatewayId,
        message: 'Waiting for connect challenge',
      });
    });

    this.ws.on('message', (raw) => {
      this.handleRaw(raw.toString());
    });

    this.ws.on('close', (code, reason) => {
      const reasonStr = reason.toString();
      const error =
        this.lastError ?? (code === WS_CLOSE_POLICY_VIOLATION ? reasonStr || 'policy violation' : undefined);
      getDebugLogger().warn({
        domain: 'gateway',
        event: 'gateway.ws.close',
        gatewayId: this.gatewayId,
        data: {
          code,
          reason: reasonStr,
          pendingRequests: this.pendingRequests.size,
        },
      });
      this.authenticated = false;
      this.serverVersion = undefined;
      this.stopHeartbeat();
      sendToWindow(getMainWindow(), 'gateway-status', {
        gatewayId: this.gatewayId,
        connected: false,
        error,
        reconnectAttempt: this.reconnectAttempts,
        maxAttempts: MAX_RECONNECT_ATTEMPTS,
      });
      if (code === WS_CLOSE_POLICY_VIOLATION) return;
      this.scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      this.lastError = err.message;
      getDebugLogger().error({
        domain: 'gateway',
        event: 'gateway.ws.error',
        gatewayId: this.gatewayId,
        error: { name: err.name, message: err.message, stack: err.stack },
      });
      sendToWindow(getMainWindow(), 'gateway-status', {
        gatewayId: this.gatewayId,
        connected: false,
        error: err.message,
      });
    });
  }

  private handleRaw(raw: string): void {
    let frame: GatewayFrame;
    try {
      frame = JSON.parse(raw) as GatewayFrame;
    } catch {
      getDebugLogger().error({
        domain: 'gateway',
        event: 'gateway.frame.invalid-json',
        gatewayId: this.gatewayId,
        data: { raw },
      });
      return;
    }

    if (frame.type === 'event') {
      if (typeof frame.event !== 'string' || !frame.payload || typeof frame.payload !== 'object') {
        getDebugLogger().error({
          domain: 'gateway',
          event: 'gateway.frame.invalid-shape',
          gatewayId: this.gatewayId,
        });
        return;
      }
      getDebugLogger().debug({
        domain: 'gateway',
        event: 'gateway.event.received',
        gatewayId: this.gatewayId,
        seq: frame.seq,
        data: {
          name: frame.event,
          payload: summarizePayload(frame.payload),
        },
      });
      this.handleEvent(frame as { event: string; payload: Record<string, unknown>; seq?: number });
      return;
    }

    if (frame.type === 'res') {
      this.handleResponse(frame);
      return;
    }
  }

  private handleEvent(frame: { event: string; payload: Record<string, unknown>; seq?: number }): void {
    if (frame.event === 'connect.challenge') {
      const nonce = frame.payload && typeof frame.payload.nonce === 'string' ? frame.payload.nonce.trim() : '';
      if (!nonce) {
        getDebugLogger().error({
          domain: 'gateway',
          event: 'gateway.challenge.invalid',
          gatewayId: this.gatewayId,
          data: { payload: summarizePayload(frame.payload) },
        });
        this.ws?.close(WS_CLOSE_POLICY_VIOLATION, 'connect challenge missing nonce');
        return;
      }
      this.connectNonce = nonce;
      getDebugLogger().info({
        domain: 'gateway',
        event: 'gateway.challenge.received',
        gatewayId: this.gatewayId,
        seq: frame.seq,
      });
      this.handleChallenge(nonce);
      return;
    }

    if (frame.event === 'tick') {
      getDebugLogger().debug({
        domain: 'gateway',
        event: 'gateway.tick.received',
        gatewayId: this.gatewayId,
        seq: frame.seq,
      });
      return;
    }

    const sessionKey = typeof frame.payload.sessionKey === 'string' ? frame.payload.sessionKey : undefined;
    const taskId = sessionKey ? (parseTaskIdFromSessionKey(sessionKey) ?? undefined) : undefined;
    getDebugLogger().debug({
      domain: 'gateway',
      event: `gateway.${frame.event.replace(/[^a-z0-9]+/gi, '.').toLowerCase()}`,
      gatewayId: this.gatewayId,
      sessionKey,
      taskId,
      seq: frame.seq,
      data: { payload: summarizePayload(frame.payload) },
    });

    sendToWindow(getMainWindow(), 'gateway-event', {
      gatewayId: this.gatewayId,
      event: frame.event,
      payload: frame.payload,
      seq: frame.seq,
    });
  }

  private buildAuthWithDeviceToken(): GatewayAuth {
    const storedToken = loadDeviceToken(this.gatewayId);
    if (storedToken) {
      return { ...this.auth, deviceToken: storedToken };
    }
    return this.auth;
  }

  private handleChallenge(nonce: string): void {
    const signatureToken =
      'token' in this.auth ? this.auth.token : 'bootstrapToken' in this.auth ? this.auth.bootstrapToken : null;
    const scopes = ['operator.admin', 'operator.write', 'operator.read', 'operator.approvals', 'operator.pairing'];

    const device = buildDeviceConnectPayload(this.deviceIdentity, {
      clientId: 'gateway-client',
      clientMode: 'backend',
      role: 'operator',
      scopes,
      nonce,
      token: signatureToken,
      platform: process.platform,
      deviceFamily: null,
    });

    const params: GatewayConnectParams = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'gateway-client',
        displayName: 'ClawWork Desktop',
        version: app.getVersion(),
        platform: process.platform,
        mode: 'backend',
      },
      caps: ['tool-events'],
      auth: this.buildAuthWithDeviceToken(),
      role: 'operator',
      scopes,
      device,
    };

    this.sendReq('connect', params as unknown as Record<string, unknown>, { requestId: 'connect-handshake' })
      .then((payload) => {
        const pType = payload['type'] as string | undefined;
        if (pType === 'hello-ok') {
          getDebugLogger().info({
            domain: 'gateway',
            event: 'gateway.connect.res.ok',
            gatewayId: this.gatewayId,
            requestId: 'connect-handshake',
          });
          this.authenticated = true;
          this.reconnectAttempts = 0;
          this.lastError = null;
          this.lastErrorCode = null;
          const server = payload['server'] as Record<string, unknown> | undefined;
          const rawVersion = server?.['version'];
          this.serverVersion = typeof rawVersion === 'string' ? rawVersion : undefined;
          this.storeDeviceTokenFromPayload(payload);
          this.startHeartbeat();
          sendToWindow(getMainWindow(), 'gateway-status', {
            gatewayId: this.gatewayId,
            connected: true,
            serverVersion: this.serverVersion,
          });
        } else {
          getDebugLogger().error({
            domain: 'gateway',
            event: 'gateway.connect.res.unexpected',
            gatewayId: this.gatewayId,
            requestId: 'connect-handshake',
            data: { payload: summarizePayload(payload) },
          });
        }
      })
      .catch((err: Error & { details?: Record<string, unknown> }) => {
        this.lastError = err.message;
        this.lastErrorCode = (err.details?.code as string) ?? null;
        getDebugLogger().error({
          domain: 'gateway',
          event: 'gateway.connect.failed',
          gatewayId: this.gatewayId,
          requestId: 'connect-handshake',
          error: { name: err.name, message: err.message, stack: err.stack },
          data: { errorCode: this.lastErrorCode },
        });
        this.ws?.close(WS_CLOSE_POLICY_VIOLATION, 'auth failed');
      });
  }

  private storeDeviceTokenFromPayload(payload: Record<string, unknown>): void {
    const auth = payload['auth'] as Record<string, unknown> | undefined;
    if (!auth) return;
    const token = auth['deviceToken'];
    const role = auth['role'];
    const issuedAtMs = auth['issuedAtMs'];
    if (typeof token === 'string' && token) {
      saveDeviceToken(
        this.gatewayId,
        token,
        typeof role === 'string' ? role : 'operator',
        typeof issuedAtMs === 'number' ? issuedAtMs : Date.now(),
      );
      getDebugLogger().info({
        domain: 'gateway',
        event: 'gateway.auth.device-token.saved',
        gatewayId: this.gatewayId,
        data: { role: typeof role === 'string' ? role : 'operator' },
      });
      this.onPairingSuccess?.(this.gatewayId);
    }
  }

  private handleResponse(frame: GatewayResFrame): void {
    const pending = this.pendingRequests.get(frame.id);
    if (!pending) {
      getDebugLogger().warn({
        domain: 'gateway',
        event: 'gateway.res.unmatched',
        gatewayId: this.gatewayId,
        wsFrameId: frame.id,
        data: { ok: frame.ok },
      });
      return;
    }
    this.pendingRequests.delete(frame.id);
    clearTimeout(pending.timer);
    const durationMs = Date.now() - pending.startedAt;

    if (frame.ok && frame.payload) {
      getDebugLogger().info({
        domain: 'gateway',
        event: 'gateway.res.received',
        gatewayId: this.gatewayId,
        requestId: pending.requestId,
        wsFrameId: frame.id,
        sessionKey: pending.sessionKey,
        taskId: pending.taskId,
        durationMs,
        ok: true,
        data: {
          method: pending.method,
          payload: summarizePayload(frame.payload),
        },
      });
      pending.resolve(frame.payload);
    } else {
      const errMsg = frame.error?.message ?? 'request failed';
      getDebugLogger().error({
        domain: 'gateway',
        event: 'gateway.res.error',
        gatewayId: this.gatewayId,
        requestId: pending.requestId,
        wsFrameId: frame.id,
        sessionKey: pending.sessionKey,
        taskId: pending.taskId,
        durationMs,
        ok: false,
        error: { message: errMsg, code: frame.error?.code },
        data: { method: pending.method },
      });
      const err = new Error(errMsg) as Error & { code?: string; details?: Record<string, unknown> };
      err.code = frame.error?.code;
      if (frame.error?.details) {
        err.details = frame.error.details;
      }
      pending.reject(err);
    }
  }

  sendReq(
    method: string,
    params: Record<string, unknown>,
    meta?: { requestId?: string; sessionKey?: string; taskId?: string },
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        getDebugLogger().error({
          domain: 'gateway',
          event: 'gateway.req.rejected.not-connected',
          gatewayId: this.gatewayId,
          requestId: meta?.requestId,
          sessionKey: meta?.sessionKey,
          taskId: meta?.taskId,
          data: { method },
          error: { message: 'not connected' },
        });
        const notConnErr = new Error('not connected') as Error & { code?: string };
        notConnErr.code = 'GATEWAY_NOT_CONNECTED';
        reject(notConnErr);
        return;
      }

      const id = randomUUID();
      const requestId = meta?.requestId ?? randomUUID();
      const frame: GatewayReqFrame = { type: 'req', id, method, params };
      const startedAt = Date.now();

      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        getDebugLogger().error({
          domain: 'gateway',
          event: 'gateway.req.timeout',
          gatewayId: this.gatewayId,
          requestId,
          wsFrameId: id,
          sessionKey: meta?.sessionKey,
          taskId: meta?.taskId,
          durationMs: Date.now() - startedAt,
          data: { method },
          error: { message: `request timeout: ${method}` },
        });
        const timeoutErr = new Error(`request timeout: ${method}`) as Error & { code?: string };
        timeoutErr.code = 'TIMEOUT';
        reject(timeoutErr);
      }, REQ_TIMEOUT_MS);

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timer,
        method,
        startedAt,
        requestId,
        sessionKey: meta?.sessionKey,
        taskId: meta?.taskId,
      });
      getDebugLogger().debug({
        domain: 'gateway',
        event: 'gateway.req.sent',
        gatewayId: this.gatewayId,
        requestId,
        wsFrameId: id,
        sessionKey: meta?.sessionKey,
        taskId: meta?.taskId,
        data: {
          method,
          params: summarizePayload(params),
        },
      });
      this.ws.send(JSON.stringify(frame));
    });
  }

  private sessionMeta(sessionKey: string) {
    return {
      requestId: randomUUID(),
      sessionKey,
      taskId: parseTaskIdFromSessionKey(sessionKey) ?? undefined,
    };
  }

  async sendChatMessage(
    sessionKey: string,
    message: string,
    attachments?: ChatAttachment[],
  ): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = {
      sessionKey,
      message,
      idempotencyKey: randomUUID(),
      deliver: false,
    };
    if (attachments?.length) {
      params.attachments = attachments;
    }
    return this.sendReq('chat.send', params, this.sessionMeta(sessionKey));
  }

  async abortChat(sessionKey: string): Promise<Record<string, unknown>> {
    return this.sendReq('chat.abort', { sessionKey }, this.sessionMeta(sessionKey));
  }

  async getChatHistory(sessionKey: string, limit = 50): Promise<Record<string, unknown>> {
    return this.sendReq('chat.history', { sessionKey, limit }, this.sessionMeta(sessionKey));
  }

  async listSessions(): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.list', {}, { requestId: randomUUID() });
  }

  async listSessionsBySpawner(spawnedBy: string): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.list', { spawnedBy }, { requestId: randomUUID() });
  }

  async createSession(params: { key: string; agentId: string; message?: string }): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.create', params, { requestId: randomUUID() });
  }

  async listModels(): Promise<Record<string, unknown>> {
    return this.sendReq('models.list', {});
  }

  async listAgents(): Promise<Record<string, unknown>> {
    return this.sendReq('agents.list', {});
  }

  async createAgent(params: {
    name: string;
    workspace: string;
    emoji?: string;
    avatar?: string;
  }): Promise<Record<string, unknown>> {
    return this.sendReq('agents.create', params);
  }

  async updateAgent(params: {
    agentId: string;
    name?: string;
    workspace?: string;
    model?: string;
    avatar?: string;
  }): Promise<Record<string, unknown>> {
    return this.sendReq('agents.update', params);
  }

  async deleteAgent(params: { agentId: string; deleteFiles?: boolean }): Promise<Record<string, unknown>> {
    return this.sendReq('agents.delete', params);
  }

  async listAgentFiles(agentId: string): Promise<Record<string, unknown>> {
    return this.sendReq('agents.files.list', { agentId });
  }

  async getAgentFile(agentId: string, name: string): Promise<Record<string, unknown>> {
    return this.sendReq('agents.files.get', { agentId, name });
  }

  async setAgentFile(agentId: string, name: string, content: string): Promise<Record<string, unknown>> {
    return this.sendReq('agents.files.set', { agentId, name, content });
  }

  async patchSession(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.patch', params);
  }

  async resetSession(sessionKey: string, reason: 'new' | 'reset' = 'reset'): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.reset', { key: sessionKey, reason }, this.sessionMeta(sessionKey));
  }

  async deleteSession(sessionKey: string, deleteTranscript = true): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.delete', { key: sessionKey, deleteTranscript }, this.sessionMeta(sessionKey));
  }

  async compactSession(sessionKey: string, maxLines?: number): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = { key: sessionKey };
    if (maxLines !== undefined) params.maxLines = maxLines;
    return this.sendReq('sessions.compact', params, this.sessionMeta(sessionKey));
  }

  async getToolsCatalog(agentId?: string): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = { includePlugins: true };
    if (agentId) params.agentId = agentId;
    return this.sendReq('tools.catalog', params);
  }

  async getSkillsStatus(agentId?: string): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = {};
    if (agentId) params.agentId = agentId;
    return this.sendReq('skills.status', params);
  }

  async installSkill(
    params:
      | { name: string; installId: string; dangerouslyForceUnsafeInstall?: boolean; timeoutMs?: number }
      | { source: 'clawhub'; slug: string; version?: string; force?: boolean; timeoutMs?: number },
  ): Promise<Record<string, unknown>> {
    return this.sendReq('skills.install', params);
  }

  async updateSkill(
    params:
      | { skillKey: string; enabled?: boolean; apiKey?: string; env?: Record<string, string> }
      | { source: 'clawhub'; slug?: string; all?: boolean },
  ): Promise<Record<string, unknown>> {
    return this.sendReq('skills.update', params);
  }

  async getSkillBins(): Promise<Record<string, unknown>> {
    return this.sendReq('skills.bins', {});
  }

  async getConfig(): Promise<Record<string, unknown>> {
    return this.sendReq('config.get', {});
  }

  async setConfig(params: { raw: string; baseHash?: string }): Promise<Record<string, unknown>> {
    return this.sendReq('config.set', params);
  }

  async patchConfig(params: {
    raw: string;
    baseHash?: string;
    sessionKey?: string;
    note?: string;
    restartDelayMs?: number;
  }): Promise<Record<string, unknown>> {
    return this.sendReq('config.patch', params);
  }

  async getConfigSchema(): Promise<Record<string, unknown>> {
    return this.sendReq('config.schema', {});
  }

  async lookupConfigSchema(path: string): Promise<Record<string, unknown>> {
    return this.sendReq('config.schema.lookup', { path });
  }

  async getUsageStatus(): Promise<Record<string, unknown>> {
    return this.sendReq('usage.status', {});
  }

  async getUsageCost(params?: {
    startDate?: string;
    endDate?: string;
    days?: number;
  }): Promise<Record<string, unknown>> {
    return this.sendReq('usage.cost', (params as Record<string, unknown>) ?? {});
  }

  async getSessionUsage(params: {
    key: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.usage', params as unknown as Record<string, unknown>);
  }

  async listCronJobs(params?: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.sendReq('cron.list', params ?? {});
  }

  async getCronStatus(): Promise<Record<string, unknown>> {
    return this.sendReq('cron.status', {});
  }

  async addCronJob(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.sendReq('cron.add', params);
  }

  async updateCronJob(jobId: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.sendReq('cron.update', { jobId, patch });
  }

  async removeCronJob(jobId: string): Promise<Record<string, unknown>> {
    return this.sendReq('cron.remove', { jobId });
  }

  async runCronJob(jobId: string, mode?: string): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = { jobId };
    if (mode) params.mode = mode;
    return this.sendReq('cron.run', params);
  }

  async listCronRuns(params?: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.sendReq('cron.runs', params ?? {});
  }

  get isConnected(): boolean {
    return this.authenticated && this.ws?.readyState === WebSocket.OPEN;
  }

  get lastConnectionError(): string | null {
    return this.lastError;
  }

  get lastConnectionErrorCode(): string | null {
    return this.lastErrorCode;
  }

  get version(): string | undefined {
    return this.serverVersion;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    getDebugLogger().info({
      domain: 'gateway',
      event: 'gateway.heartbeat.start',
      gatewayId: this.gatewayId,
    });
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendReq('health', {}, { requestId: `heartbeat-${Date.now()}` }).catch((err) => {
          getDebugLogger().warn({
            domain: 'gateway',
            event: 'gateway.heartbeat.failed',
            gatewayId: this.gatewayId,
            error: { message: err instanceof Error ? err.message : 'heartbeat failed' },
          });
        });
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.noReconnect) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      getDebugLogger().error({
        domain: 'gateway',
        event: 'gateway.reconnect.give-up',
        gatewayId: this.gatewayId,
        attempt: this.reconnectAttempts,
        error: { message: 'max reconnect attempts reached' },
      });
      sendToWindow(getMainWindow(), 'gateway-status', {
        gatewayId: this.gatewayId,
        connected: false,
        error: 'max reconnect attempts',
        reconnectAttempt: this.reconnectAttempts,
        maxAttempts: MAX_RECONNECT_ATTEMPTS,
        gaveUp: true,
      });
      return;
    }

    const delay = RECONNECT_DELAY_MS * Math.pow(2, Math.min(this.reconnectAttempts, 5));
    this.reconnectAttempts++;
    getDebugLogger().warn({
      domain: 'gateway',
      event: 'gateway.reconnect.scheduled',
      gatewayId: this.gatewayId,
      attempt: this.reconnectAttempts,
      data: { delay },
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private cleanup(): void {
    this.stopHeartbeat();
    this.connectNonce = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      getDebugLogger().warn({
        domain: 'gateway',
        event: 'gateway.req.cancelled.connection-closed',
        gatewayId: this.gatewayId,
        requestId: pending.requestId,
        wsFrameId: id,
        sessionKey: pending.sessionKey,
        taskId: pending.taskId,
        data: { method: pending.method },
        error: { message: 'connection closed' },
      });
      const closeErr = new Error('connection closed') as Error & { code?: string };
      closeErr.code = 'GATEWAY_CONNECTION_CLOSED';
      pending.reject(closeErr);
      this.pendingRequests.delete(id);
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.on('error', () => {});
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch {}
      this.ws = null;
    }
    this.authenticated = false;
  }

  reconnect(): void {
    this.reconnectAttempts = 0;
    this.connect();
  }

  destroy(): void {
    this.destroyed = true;
    this.cleanup();
  }
}
