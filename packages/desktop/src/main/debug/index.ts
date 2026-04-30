import { BrowserWindow } from 'electron';
import type { DebugEvent } from '@clawwork/shared';
import type { DebugLogger, LogEventInput } from './logger.js';
import { createDebugLogger } from './logger.js';

// Pre-init buffer: 50+ getDebugLogger() call sites can fire during early
// boot before initDebugLogger runs; the previous noop fallback dropped
// those events silently, hiding the exact errors that matter most. Cache
// up to PRE_INIT_BUFFER_LIMIT events and replay them through the real
// logger when init lands. Cap protects against unbounded allocation if
// init is delayed or never happens.
const PRE_INIT_BUFFER_LIMIT = 256;
type PreInitCall =
  | { kind: 'debug' | 'info' | 'warn' | 'error'; input: LogEventInput }
  | { kind: 'log'; input: LogEventInput & { level: DebugEvent['level'] } };
const preInitBuffer: PreInitCall[] = [];
let preInitOverflowed = false;

function record(call: PreInitCall): DebugEvent {
  if (preInitBuffer.length < PRE_INIT_BUFFER_LIMIT) {
    preInitBuffer.push(call);
  } else if (!preInitOverflowed) {
    preInitOverflowed = true;
    console.warn(
      `[debug] pre-init buffer cap (${PRE_INIT_BUFFER_LIMIT}) reached; ` +
        'further events before initDebugLogger will be dropped.',
    );
  }
  return {
    ts: new Date().toISOString(),
    level: call.kind === 'log' ? call.input.level : call.kind,
    domain: call.input.domain,
    event: call.input.event,
  } as DebugEvent;
}

let debugLogger: DebugLogger = {
  debug: (input) => record({ kind: 'debug', input }),
  info: (input) => record({ kind: 'info', input }),
  warn: (input) => record({ kind: 'warn', input }),
  error: (input) => record({ kind: 'error', input }),
  log: (input) => record({ kind: 'log', input }),
  getRecentEvents: () => [],
  currentFilePath: () => '',
};

export function initDebugLogger(debugDir: string): DebugLogger {
  debugLogger = createDebugLogger({
    debugDir,
    console: true,
    onEvent: broadcastDebugEvent,
  });
  // Replay any events that were captured before init landed.
  for (const call of preInitBuffer) {
    if (call.kind === 'log') {
      debugLogger.log(call.input);
    } else {
      debugLogger[call.kind](call.input);
    }
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
