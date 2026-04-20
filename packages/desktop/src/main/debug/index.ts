import { BrowserWindow } from 'electron';
import type { DebugEvent, LogEventInput } from '@clawwork/shared';
import type { DebugLogger } from './logger.js';
import { createDebugLogger } from './logger.js';

const MAX_PRE_INIT_BUFFER = 256;

let debugLogger: DebugLogger;
let isInitialized = false;

function createNoopLogger(): DebugLogger {
  const preInitBuffer: DebugEvent[] = [];

  const flushToLogger = (logger: DebugLogger): void => {
    for (const event of preInitBuffer) {
      logger.log({ ...event, level: event.level as LogEventInput['level'] });
    }
    preInitBuffer.length = 0;
  };

  const makeBufferedLog =
    (level: 'debug' | 'info' | 'warn' | 'error') =>
    (input: LogEventInput): DebugEvent => {
      const event: DebugEvent = {
        ts: new Date().toISOString(),
        level,
        domain: input.domain,
        event: input.event,
        traceId: input.traceId,
        feature: input.feature,
        message: input.message,
        gatewayId: input.gatewayId,
        sessionKey: input.sessionKey,
        taskId: input.taskId,
        runId: input.runId,
        requestId: input.requestId,
        wsFrameId: input.wsFrameId,
        seq: input.seq,
        attempt: input.attempt,
        durationMs: input.durationMs,
        ok: input.ok,
        error: input.error,
        data: input.data,
      };

      if (preInitBuffer.length < MAX_PRE_INIT_BUFFER) {
        preInitBuffer.push(event);
      }

      console.warn(
        `[debug] Logger not initialized yet (pre-init event captured, buffer size: ${preInitBuffer.length}/${MAX_PRE_INIT_BUFFER}):`,
        `[${level}] [${input.domain}] ${input.event}`,
        input,
      );
      return event;
    };

  const noopLogger: DebugLogger = {
    debug: makeBufferedLog('debug'),
    info: makeBufferedLog('info'),
    warn: makeBufferedLog('warn'),
    error: makeBufferedLog('error'),
    log: (input) => makeBufferedLog(input.level ?? 'debug')(input),
    getRecentEvents: () => [...preInitBuffer],
    currentFilePath: () => '',
  };

  Object.defineProperty(noopLogger, '__flush', {
    value: flushToLogger,
    writable: false,
    enumerable: false,
  });

  return noopLogger;
}

debugLogger = createNoopLogger();

export function initDebugLogger(debugDir: string): DebugLogger {
  const realLogger = createDebugLogger({
    debugDir,
    console: true,
    onEvent: broadcastDebugEvent,
  });

  const noop = debugLogger as DebugLogger & { __flush?: (logger: DebugLogger) => void };
  if (noop.__flush) {
    noop.__flush(realLogger);
  }

  debugLogger = realLogger;
  isInitialized = true;
  return debugLogger;
}

export function getDebugLogger(): DebugLogger {
  return debugLogger;
}

export function isDebugLoggerInitialized(): boolean {
  return isInitialized;
}

function broadcastDebugEvent(event: DebugEvent): void {
  for (const win of BrowserWindow.getAllWindows()) {
    try {
      win.webContents.send('debug-event', event);
    } catch {}
  }
}
