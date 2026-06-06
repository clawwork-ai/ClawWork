import { BrowserWindow } from 'electron';
import { sanitizeForLog } from '@clawwork/shared';
import type { DebugEvent } from '@clawwork/shared';
import type { DebugLogger, LogEventInput } from './logger.js';
import { createDebugLogger } from './logger.js';

const MAX_PRE_INIT_BUFFER = 256;

let debugLogger: DebugLogger;
let isInitialized = false;

function createNoopLogger(): DebugLogger {
  const preInitBuffer: DebugEvent[] = [];

  const flushToLogger = (logger: DebugLogger): void => {
    for (const event of preInitBuffer) {
      logger.log(event);
    }
    preInitBuffer.length = 0;
  };

  const makeBufferedLog =
    (level: 'debug' | 'info' | 'warn' | 'error') =>
    (input: LogEventInput): DebugEvent => {
      const event = sanitizeForLog({
        ...input,
        ts: new Date().toISOString(),
        level,
      } as DebugEvent);

      preInitBuffer.push(event);
      if (preInitBuffer.length > MAX_PRE_INIT_BUFFER) {
        preInitBuffer.shift();
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
