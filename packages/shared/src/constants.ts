// ============================================================
// Shared Constants
// ============================================================

/** Default OpenClaw Gateway WebSocket port */
export const GATEWAY_WS_PORT = 18789;

/** ClawWork session key prefix (default agent=main, kept for backward compat) */
export const SESSION_KEY_PREFIX = 'agent:main:clawwork:task:';
const CLAWWORK_DEVICE_SESSION_RE = /^agent:([^:]+):clawwork:([^:]+):task:(.+)$/;
const CLAWWORK_SESSION_RE = /^agent:([^:]+):clawwork:task:(.+)$/;
const LEGACY_SESSION_KEY_RE = /^agent:[^:]+:task-(.+)$/;

export function buildSessionKey(taskId: string, agentId: string = 'main', deviceId?: string): string {
  if (deviceId) return `agent:${agentId}:clawwork:${deviceId}:task:${taskId}`;
  return `agent:${agentId}:clawwork:task:${taskId}`;
}

export function parseTaskIdFromSessionKey(sessionKey: string): string | null {
  const dm = sessionKey.match(CLAWWORK_DEVICE_SESSION_RE);
  if (dm) return dm[3] || null;

  const m = sessionKey.match(CLAWWORK_SESSION_RE);
  if (m) return m[2] || null;

  const legacyMatch = sessionKey.match(LEGACY_SESSION_KEY_RE);
  return legacyMatch ? legacyMatch[1] : null;
}

export function parseAgentIdFromSessionKey(sessionKey: string): string {
  const dm = sessionKey.match(CLAWWORK_DEVICE_SESSION_RE);
  if (dm) return dm[1];
  const m = sessionKey.match(CLAWWORK_SESSION_RE);
  return m ? m[1] : 'main';
}

export function mergeGatewayStreamText(previous: string, incoming: string): string {
  if (!incoming) return previous;
  if (incoming === previous) return previous;
  if (incoming.startsWith(previous)) return incoming;
  if (previous.startsWith(incoming)) return previous;
  return previous + incoming;
}

export function isClawWorkSession(sessionKey: string, deviceId?: string): boolean {
  if (deviceId) {
    const dm = sessionKey.match(CLAWWORK_DEVICE_SESSION_RE);
    return dm !== null && dm[2] === deviceId;
  }
  return CLAWWORK_DEVICE_SESSION_RE.test(sessionKey) || CLAWWORK_SESSION_RE.test(sessionKey);
}

/** Heartbeat interval in milliseconds */
export const HEARTBEAT_INTERVAL_MS = 30_000;

/** Reconnect delay in milliseconds */
export const RECONNECT_DELAY_MS = 3_000;

/** Max reconnect attempts before giving up */
export const MAX_RECONNECT_ATTEMPTS = 10;

/** Default workspace directory name (under user home) */
export const DEFAULT_WORKSPACE_DIR = 'ClawWork-Workspace';

/** Config file name stored in Electron userData */
export const CONFIG_FILE_NAME = 'clawwork-config.json';

/** SQLite database file name within workspace */
export const DB_FILE_NAME = '.clawwork.db';

export const RETRYABLE_ERROR_CODES = new Set([
  'RATE_LIMIT',
  'RATE_LIMITED',
  'TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'MODEL_UNAVAILABLE',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'OVERLOADED',
]);

export const NON_RETRYABLE_ERROR_CODES = new Set([
  'AUTH_INVALID',
  'AUTH_FAILED',
  'GATEWAY_AUTH_FAILED',
  'QUOTA_EXHAUSTED',
  'CONTENT_POLICY',
  'CONTENT_FILTERED',
  'CONTEXT_LENGTH_EXCEEDED',
  'INVALID_REQUEST',
  'SESSION_NOT_FOUND',
  'AGENT_NOT_FOUND',
  'PERMISSION_DENIED',
  'METHOD_NOT_SUPPORTED',
]);
