import type { DebugEvent } from '@clawwork/shared';

const IS_DEV = import.meta.env.DEV;

const MAX_LOG_ENTRIES = 200;

export interface DebugLogEntry {
  ts: string;
  level: string;
  domain: string;
  event: string;
  data?: Record<string, unknown>;
  error?: { message: string };
}

const logBuffer: DebugLogEntry[] = [];
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const fn of listeners) fn();
}

export function getDebugLog(): readonly DebugLogEntry[] {
  return logBuffer;
}

export function subscribeDebugLog(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearDebugLog(): void {
  logBuffer.length = 0;
  notifyListeners();
}

export function reportDebugEvent(event: Partial<DebugEvent>): void {
  const full: DebugEvent = {
    ts: event.ts ?? new Date().toISOString(),
    level: event.level ?? 'debug',
    domain: event.domain ?? 'app',
    event: event.event ?? 'unknown',
    message: event.message,
    gatewayId: event.gatewayId,
    sessionKey: event.sessionKey,
    taskId: event.taskId,
    traceId: event.traceId,
    feature: event.feature,
    durationMs: event.durationMs,
    ok: event.ok,
    error: event.error,
    data: event.data,
    runId: event.runId,
    requestId: event.requestId,
    wsFrameId: event.wsFrameId,
    seq: event.seq,
    attempt: event.attempt,
  };

  const prefix = `[${full.domain}] ${full.event}`;

  if (full.level === 'error') {
    console.error(prefix, full.data ?? full.error ?? '');
  } else if (full.level === 'warn') {
    console.warn(prefix, full.data ?? full.error ?? '');
  } else if (IS_DEV) {
    console.debug(prefix, full.data ?? '');
  }

  const entry: DebugLogEntry = {
    ts: full.ts,
    level: full.level,
    domain: full.domain,
    event: full.event,
  };
  if (full.data && Object.keys(full.data).length > 0) entry.data = full.data;
  if (full.error) entry.error = full.error;

  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  notifyListeners();
}
