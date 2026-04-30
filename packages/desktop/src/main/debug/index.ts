import { BrowserWindow } from 'electron';
import { sanitizeForLog, type DebugEvent } from '@clawwork/shared';
import type { DebugLogger, LogEventInput } from './logger.js';
import { createDebugLogger } from './logger.js';

const PRE_INIT_BUFFER_LIMIT = 256;
const preInitBuffer: DebugEvent[] = [];
let preInitOverflowed = false;

function record(level: DebugEvent['level'], input: LogEventInput): DebugEvent {
  const event = sanitizeForLog({
    ...input,
    ts: new Date().toISOString(),
    level,
  });

  if (preInitBuffer.length < PRE_INIT_BUFFER_LIMIT) {
    preInitBuffer.push(event);
  } else if (!preInitOverflowed) {
    preInitOverflowed = true;
    console.warn(
      `[debug] pre-init buffer cap (${PRE_INIT_BUFFER_LIMIT}) reached; ` +
        'further events before initDebugLogger will be dropped.',
    );
  }
  return event;
}

let debugLogger: DebugLogger = {
  debug: (input) => record('debug', input),
  info: (input) => record('info', input),
  warn: (input) => record('warn', input),
  error: (input) => record('error', input),
  log: (input) => record(input.level, input),
  getRecentEvents: () => [],
  currentFilePath: () => '',
};

export function initDebugLogger(debugDir: string): DebugLogger {
  debugLogger = createDebugLogger({
    debugDir,
    console: true,
    onEvent: broadcastDebugEvent,
  });
  for (const event of preInitBuffer) {
    debugLogger.log(event);
  }
  preInitBuffer.length = 0;
  preInitOverflowed = false;
  return debugLogger;
}

export function getDebugLogger(): DebugLogger {
  return debugLogger;
}

function broadcastDebugEvent(event: DebugEvent): void {
  for (const win of BrowserWindow.getAllWindows()) {
    try {
      win.webContents.send('debug-event', event);
    } catch {}
  }
}
