import type { DebugEvent } from '@clawwork/shared';

const IS_DEV = import.meta.env.DEV;

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
}
