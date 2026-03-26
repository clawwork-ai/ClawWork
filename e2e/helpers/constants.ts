import { randomUUID } from 'crypto';

export const GATEWAY_TOKEN = 'e2e-test-token-123';
export const GATEWAY_ID = 'e2e-gateway';
const GATEWAY_PORT = 28789;
export const GATEWAY_WS_URL = `ws://127.0.0.1:${GATEWAY_PORT}`;
export const GATEWAY_HTTP_URL = `http://127.0.0.1:${GATEWAY_PORT}`;
export const HEALTH_TIMEOUT_MS = 30_000;
export const POLL_INTERVAL_MS = 500;
export const CONNECTION_TIMEOUT_MS = 15_000;

export function buildSessionKey(taskId?: string): string {
  const id = taskId ?? randomUUID();
  return `agent:main:clawwork:task:${id}`;
}
