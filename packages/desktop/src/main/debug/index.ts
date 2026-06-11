import { BrowserWindow } from 'electron';
import { sanitizeForLog, type DebugEvent } from '@clawwork/shared';
import type { DebugLogger, LogEventInput } from './logger.js';
import { createDebugLogger } from './logger.js';

const PRE_INIT_BUFFER_LIMIT = 256;
const preInitBuffer: DebugEvent[] = [];
let isInitialized = false;

function record(level: DebugEvent['level'], input: LogEventInput): DebugEvent {
  const event = sanitizeForLog({
    ...input,
    ts: new Date().toISOString(),
    level,
  });

  preInitBuffer.push(event);
  if (preInitBuffer.length > PRE_INIT_BUFFER_LIMIT) {
    preInitBuffer.shift();
  }

  console.warn(
    `[debug] Logger not initialized yet (pre-init event captured, buffer size: ${preInitBuffer.length}/${PRE_INIT_BUFFER_LIMIT}):`,
    `[${event.level}] [${event.domain}] ${event.event}`,
  );
  return event;
}

let debugLogger: DebugLogger = {
  debug: (input) => record('debug', input),
  info: (input) => record('info', input),
  warn: (input) => record('warn', input),
  error: (input) => record('error', input),
  log: (input) => record(input.level, input),
  getRecentEvents: () => [...preInitBuffer],
  currentFilePath: () => '',
  flush: () => Promise.resolve(),
};

export function initDebugLogger(debugDir: string): DebugLogger {
  debugLogger = createDebugLogger({
    debugDir,
    console: true,
    onEvent: broadcastDebugEvent,
  });
  for (const event of preInitBuffer) {
    debugLogger.log(event, { silent: true });
  }
  preInitBuffer.length = 0;
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
