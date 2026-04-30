import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock electron BrowserWindow up-front so importing the module under test doesn't
// hit the real electron native binding.
vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: () => [] },
}));

// The debug module is module-level singleton state, so we re-import via dynamic
// import inside each test to get a fresh copy of the buffer.
async function loadDebugModule() {
  vi.resetModules();
  return await import('../src/main/debug/index.js');
}

describe('debug logger pre-init buffer (#412)', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('captures events before initDebugLogger and replays them on init', async () => {
    const debugModule = await loadDebugModule();
    const { getDebugLogger, initDebugLogger } = debugModule;

    const logger = getDebugLogger();
    const beforeInit = logger.error({ domain: 'app', event: 'pre-init-error' });

    expect(beforeInit.event).toBe('pre-init-error');
    expect(beforeInit.level).toBe('error');

    // Init with a temp dir; the real logger writes ndjson to a file there.
    const os = await import('node:os');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-debug-'));

    const realLogger = initDebugLogger(tmp);
    const recent = realLogger.getRecentEvents();
    expect(recent.some((e) => e.event === 'pre-init-error' && e.level === 'error')).toBe(true);

    // Subsequent calls go directly to the real logger.
    realLogger.info({ domain: 'app', event: 'post-init-info' });
    expect(realLogger.getRecentEvents().some((e) => e.event === 'post-init-info')).toBe(true);
  });

  it('stops buffering past PRE_INIT_BUFFER_LIMIT and warns once', async () => {
    const { getDebugLogger, initDebugLogger } = await loadDebugModule();
    const logger = getDebugLogger();

    // Slam in more than 256 events to trip the cap.
    for (let i = 0; i < 300; i++) {
      logger.debug({ domain: 'app', event: `evt-${i}` });
    }

    // Warn fires exactly once even though many events overflowed.
    const warnCalls = consoleWarnSpy.mock.calls.filter((c) =>
      String(c[0]).includes('pre-init buffer cap'),
    );
    expect(warnCalls).toHaveLength(1);

    // Init flushes only the first 256.
    const os = await import('node:os');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-debug-'));
    const realLogger = initDebugLogger(tmp);
    const replayedBuffered = realLogger
      .getRecentEvents()
      .filter((e) => /^evt-\d+$/.test(e.event));
    expect(replayedBuffered.length).toBe(256);
  });
});
