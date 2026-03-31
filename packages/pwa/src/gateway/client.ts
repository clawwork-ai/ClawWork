import type {
  GatewayReqFrame,
  GatewayResFrame,
  GatewayEventFrame,
  GatewayConnectParams,
  ChatAttachment,
  DebugEvent,
} from '@clawwork/shared';
import {
  HEARTBEAT_INTERVAL_MS,
  RECONNECT_DELAY_MS,
  MAX_RECONNECT_ATTEMPTS,
  parseTaskIdFromSessionKey,
  summarizePayload,
} from '@clawwork/shared';
import { buildDeviceConnectPayload } from './auth.js';
import type { DeviceIdentity } from './device-identity.js';
import type { GatewayAuth } from '@clawwork/shared';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'authorization_pending';

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

type BrowserGatewayClientConfig = {
  id: string;
  name: string;
  url: string;
  auth?: GatewayAuth;
  identity: DeviceIdentity;
  onEvent?: (data: { event: string; payload: Record<string, unknown>; gatewayId: string; seq?: number }) => void;
  onStatus?: (data: {
    gatewayId: string;
    connected: boolean;
    error?: string;
    serverVersion?: string;
    reconnectAttempt?: number;
    maxAttempts?: number;
    gaveUp?: boolean;
  }) => void;
  onPairingSuccess?: (gatewayId: string) => void;
  reportDebugEvent?: (event: Partial<DebugEvent>) => void;
  onTokenUpdate?: (gatewayId: string, token: string) => Promise<void>;
};

const REQ_TIMEOUT_MS = 15_000;
const WS_CLOSE_POLICY_VIOLATION = 1008;

export class BrowserGatewayClient {
  private readonly gatewayId: string;
  private readonly gatewayName: string;
  private readonly url: string;
  private readonly auth?: GatewayAuth;
  private readonly identity: DeviceIdentity;
  private readonly onEvent?: BrowserGatewayClientConfig['onEvent'];
  private readonly onStatus?: BrowserGatewayClientConfig['onStatus'];
  private readonly onPairingSuccess?: BrowserGatewayClientConfig['onPairingSuccess'];
  private readonly reportDebugEvent?: BrowserGatewayClientConfig['reportDebugEvent'];
  private readonly onTokenUpdate?: BrowserGatewayClientConfig['onTokenUpdate'];

  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pendingRequests = new Map<string, PendingReq>();
  private destroyed = false;
  private connectNonce = '';
  private _serverVersion?: string;
  private _lastError?: string;
  private reqCounter = 0;
  private deviceToken?: string;

  constructor(config: BrowserGatewayClientConfig) {
    this.gatewayId = config.id;
    this.gatewayName = config.name;
    this.url = config.url;
    this.auth = config.auth;
    this.identity = config.identity;
    this.deviceToken = config.auth?.deviceToken;
    this.onEvent = config.onEvent;
    this.onStatus = config.onStatus;
    this.onPairingSuccess = config.onPairingSuccess;
    this.reportDebugEvent = config.reportDebugEvent;
    this.onTokenUpdate = config.onTokenUpdate;
  }

  get id(): string {
    return this.gatewayId;
  }

  get name(): string {
    return this.gatewayName;
  }

  get isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  get serverVersion(): string | undefined {
    return this._serverVersion;
  }

  get lastError(): string | undefined {
    return this._lastError;
  }

  connect(): void {
    if (this.destroyed) return;
    this.cleanup();
    this._lastError = undefined;
    this.state = 'connecting';

    this.debug('gateway.connect.start', {
      wsUrl: this.url,
      attempt: this.reconnectAttempts + 1,
    });

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.handleOpen();
    };

    this.ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        this.handleMessage(event.data);
      }
    };

    this.ws.onclose = (event) => {
      this.handleClose(event.code, event.reason);
    };

    this.ws.onerror = (event) => {
      this.handleError(event);
    };
  }

  reconnect(): void {
    this.destroyed = false;
    this.reconnectAttempts = 0;
    this.connect();
  }

  destroy(): void {
    this.destroyed = true;
    this.cleanup();
  }

  sendReq(
    method: string,
    params: Record<string, unknown>,
    meta?: { requestId?: string; sessionKey?: string; taskId?: string },
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        const err = new Error('not connected') as Error & { code?: string };
        err.code = 'GATEWAY_NOT_CONNECTED';
        this.debug('gateway.req.rejected.not-connected', {
          method,
          requestId: meta?.requestId,
        });
        reject(err);
        return;
      }

      const id = this.nextReqId();
      const requestId = meta?.requestId ?? id;
      const frame: GatewayReqFrame = { type: 'req', id, method, params };
      const startedAt = Date.now();

      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        const durationMs = Date.now() - startedAt;
        this.debug('gateway.req.timeout', {
          method,
          requestId,
          wsFrameId: id,
          durationMs,
          sessionKey: meta?.sessionKey,
          taskId: meta?.taskId,
        });
        const timeoutErr = new Error(`request timeout: ${method}`) as Error & {
          code?: string;
        };
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

      this.debug('gateway.req.sent', {
        method,
        requestId,
        wsFrameId: id,
        sessionKey: meta?.sessionKey,
        taskId: meta?.taskId,
        params: summarizePayload(params),
      });

      this.ws.send(JSON.stringify(frame));
    });
  }

  private sessionMeta(sessionKey: string) {
    return {
      requestId: this.nextReqId(),
      sessionKey,
      taskId: parseTaskIdFromSessionKey(sessionKey) ?? undefined,
    };
  }

  async sendChatMessage(
    sessionKey: string,
    content: string,
    attachments?: ChatAttachment[],
  ): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = {
      sessionKey,
      message: content,
      idempotencyKey: crypto.randomUUID(),
      deliver: false,
    };
    if (attachments?.length) {
      params.attachments = attachments;
    }
    return this.sendReq('chat.send', params, this.sessionMeta(sessionKey));
  }

  async abortChat(sessionKey: string): Promise<void> {
    await this.sendReq('chat.abort', { sessionKey }, this.sessionMeta(sessionKey));
  }

  async getChatHistory(sessionKey: string, limit = 50): Promise<Record<string, unknown>> {
    return this.sendReq('chat.history', { sessionKey, limit }, this.sessionMeta(sessionKey));
  }

  async listSessions(): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.list', {}, { requestId: this.nextReqId() });
  }

  async listModels(): Promise<Record<string, unknown>> {
    return this.sendReq('models.list', {});
  }

  async listAgents(): Promise<Record<string, unknown>> {
    return this.sendReq('agents.list', {});
  }

  async patchSession(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.patch', params);
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

  async compactSession(sessionKey: string): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.compact', { key: sessionKey }, this.sessionMeta(sessionKey));
  }

  async resetSession(sessionKey: string, mode: string = 'reset'): Promise<Record<string, unknown>> {
    return this.sendReq('sessions.reset', { key: sessionKey, reason: mode }, this.sessionMeta(sessionKey));
  }

  private handleOpen(): void {
    this.debug('gateway.ws.open');
  }

  private handleMessage(data: string): void {
    let frame: GatewayReqFrame | GatewayResFrame | GatewayEventFrame;
    try {
      frame = JSON.parse(data) as GatewayReqFrame | GatewayResFrame | GatewayEventFrame;
    } catch {
      this.debug('gateway.frame.invalid-json', { raw: data.slice(0, 200) });
      return;
    }

    if (frame.type === 'event') {
      const eventFrame = frame as GatewayEventFrame;
      if (typeof eventFrame.event !== 'string' || !eventFrame.payload || typeof eventFrame.payload !== 'object') {
        this.debug('gateway.frame.invalid-shape');
        return;
      }

      if (eventFrame.event === 'connect.challenge') {
        const nonce =
          typeof (eventFrame.payload as Record<string, unknown>).nonce === 'string'
            ? ((eventFrame.payload as Record<string, unknown>).nonce as string).trim()
            : '';
        if (!nonce) {
          this.debug('gateway.challenge.invalid', {
            payload: summarizePayload(eventFrame.payload),
          });
          this.ws?.close(WS_CLOSE_POLICY_VIOLATION, 'connect challenge missing nonce');
          return;
        }
        this.connectNonce = nonce;
        this.debug('gateway.challenge.received', { seq: eventFrame.seq });
        this.handleChallenge(nonce);
        return;
      }

      if (eventFrame.event === 'tick') {
        return;
      }

      const payload = eventFrame.payload as Record<string, unknown>;
      const sessionKey = typeof payload.sessionKey === 'string' ? payload.sessionKey : undefined;

      this.debug('gateway.event.received', {
        name: eventFrame.event,
        seq: eventFrame.seq,
        sessionKey,
        payload: summarizePayload(payload),
      });

      this.onEvent?.({
        gatewayId: this.gatewayId,
        event: eventFrame.event,
        payload,
        seq: eventFrame.seq,
      });
      return;
    }

    if (frame.type === 'res') {
      this.handleResponse(frame as GatewayResFrame);
      return;
    }
  }

  private handleChallenge(nonce: string): void {
    this.state = 'authorization_pending';
    const scopes = ['operator.admin', 'operator.write', 'operator.read', 'operator.approvals', 'operator.pairing'];
    const signatureToken =
      this.auth && 'token' in this.auth
        ? this.auth.token
        : this.auth && 'bootstrapToken' in this.auth
          ? this.auth.bootstrapToken
          : null;

    buildDeviceConnectPayload(this.identity, nonce, signatureToken ?? undefined, {
      clientId: 'gateway-client',
      clientMode: 'backend',
      role: 'operator',
      scopes,
      platform: 'pwa',
      deviceFamily: 'mobile',
    })
      .then((device) => {
        const auth: Record<string, unknown> = this.auth ? { ...this.auth } : {};
        if (this.deviceToken) {
          auth.deviceToken = this.deviceToken;
        }

        const params: GatewayConnectParams = {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'gateway-client',
            displayName: 'ClawWork PWA',
            version: __APP_VERSION__,
            platform: 'pwa',
            mode: 'backend',
            deviceFamily: 'mobile',
          },
          caps: ['tool-events'],
          auth: auth as GatewayConnectParams['auth'],
          role: 'operator',
          scopes,
          device,
        };

        return this.sendReq('connect', params as unknown as Record<string, unknown>, {
          requestId: 'connect-handshake',
        });
      })
      .then((payload) => {
        this.handleConnectResponse(payload);
      })
      .catch((err: Error & { details?: Record<string, unknown> }) => {
        this._lastError = err.message;
        this.debug('gateway.connect.failed', {
          error: err.message,
          errorCode: err.details?.code,
        });
        this.ws?.close(WS_CLOSE_POLICY_VIOLATION, 'auth failed');
      });
  }

  private handleConnectResponse(payload: Record<string, unknown>): void {
    const pType = payload['type'] as string | undefined;
    if (pType === 'hello-ok') {
      this.state = 'connected';
      this.reconnectAttempts = 0;
      this._lastError = undefined;

      const server = payload['server'] as Record<string, unknown> | undefined;
      const rawVersion = server?.['version'];
      this._serverVersion = typeof rawVersion === 'string' ? rawVersion : undefined;

      this.debug('gateway.connect.res.ok', {
        serverVersion: this._serverVersion,
      });

      const auth = payload['auth'] as Record<string, unknown> | undefined;
      if (auth) {
        const token = auth['deviceToken'];
        if (typeof token === 'string' && token) {
          const hadDeviceToken = Boolean(this.deviceToken);
          this.deviceToken = token;
          this.onTokenUpdate?.(this.gatewayId, token).catch((err: unknown) => {
            this.debug('gateway.auth.device-token.persist-error', {
              error: err instanceof Error ? err.message : 'token persistence failed',
            });
          });
          if (!hadDeviceToken) {
            this.onPairingSuccess?.(this.gatewayId);
          }
        }
      }

      this.startHeartbeat();

      this.onStatus?.({
        gatewayId: this.gatewayId,
        connected: true,
        serverVersion: this._serverVersion,
      });
    } else {
      this.debug('gateway.connect.res.unexpected', {
        payload: summarizePayload(payload),
      });
    }
  }

  private handleResponse(frame: GatewayResFrame): void {
    const pending = this.pendingRequests.get(frame.id);
    if (!pending) {
      this.debug('gateway.res.unmatched', {
        wsFrameId: frame.id,
        ok: frame.ok,
      });
      return;
    }

    this.pendingRequests.delete(frame.id);
    clearTimeout(pending.timer);
    const durationMs = Date.now() - pending.startedAt;

    if (frame.ok && frame.payload) {
      this.debug('gateway.res.received', {
        method: pending.method,
        requestId: pending.requestId,
        wsFrameId: frame.id,
        sessionKey: pending.sessionKey,
        taskId: pending.taskId,
        durationMs,
        ok: true,
        payload: summarizePayload(frame.payload),
      });
      pending.resolve(frame.payload);
    } else {
      const errMsg = frame.error?.message ?? 'request failed';
      this.debug('gateway.res.error', {
        method: pending.method,
        requestId: pending.requestId,
        wsFrameId: frame.id,
        sessionKey: pending.sessionKey,
        taskId: pending.taskId,
        durationMs,
        ok: false,
        errorMessage: errMsg,
        errorCode: frame.error?.code,
      });
      const err = new Error(errMsg) as Error & {
        code?: string;
        details?: Record<string, unknown>;
      };
      err.code = frame.error?.code;
      if (frame.error?.details) {
        err.details = frame.error.details;
      }
      pending.reject(err);
    }
  }

  private handleClose(code: number, reason: string): void {
    const error = this._lastError ?? (code === WS_CLOSE_POLICY_VIOLATION ? reason || 'policy violation' : undefined);

    this.debug('gateway.ws.close', {
      code,
      reason,
      pendingRequests: this.pendingRequests.size,
    });

    this.state = 'disconnected';
    this._serverVersion = undefined;
    this.stopHeartbeat();

    this.onStatus?.({
      gatewayId: this.gatewayId,
      connected: false,
      error,
      reconnectAttempt: this.reconnectAttempts,
      maxAttempts: MAX_RECONNECT_ATTEMPTS,
    });

    if (code === WS_CLOSE_POLICY_VIOLATION) return;
    this.scheduleReconnect();
  }

  private handleError(err: Event): void {
    this._lastError = 'WebSocket error';
    this.debug('gateway.ws.error', {
      type: err.type,
    });
    this.onStatus?.({
      gatewayId: this.gatewayId,
      connected: false,
      error: 'WebSocket error',
    });
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.debug('gateway.reconnect.give-up', {
        attempts: this.reconnectAttempts,
      });
      this.onStatus?.({
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

    this.debug('gateway.reconnect.scheduled', {
      attempt: this.reconnectAttempts,
      delay,
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendReq(
          'health',
          {},
          {
            requestId: `heartbeat-${Date.now()}`,
          },
        ).catch((err: unknown) => {
          this.debug('gateway.heartbeat.failed', {
            error: err instanceof Error ? err.message : 'heartbeat failed',
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

  private cleanup(): void {
    this.stopHeartbeat();
    this.connectNonce = '';

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      this.debug('gateway.req.cancelled.connection-closed', {
        method: pending.method,
        requestId: pending.requestId,
        wsFrameId: id,
        sessionKey: pending.sessionKey,
        taskId: pending.taskId,
      });
      const closeErr = new Error('connection closed') as Error & {
        code?: string;
      };
      closeErr.code = 'GATEWAY_CONNECTION_CLOSED';
      pending.reject(closeErr);
    }
    this.pendingRequests.clear();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch {
        /* noop */
      }
      this.ws = null;
    }

    this.state = 'disconnected';
  }

  private debug(event: string, data?: Record<string, unknown>): void {
    this.reportDebugEvent?.({
      domain: 'gateway',
      event,
      gatewayId: this.gatewayId,
      data,
    });
  }

  private nextReqId(): string {
    this.reqCounter++;
    return `pwa-${this.reqCounter}-${Date.now().toString(36)}`;
  }
}
