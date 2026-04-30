import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: () => [] },
}));

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
    const beforeInit = logger.error({
      domain: 'app',
      event: 'pre-init-error',
      traceId: 'trace-1',
      error: { message: 'boom' },
      data: { token: 'secret-token', ok: true },
    });

    expect(beforeInit.event).toBe('pre-init-error');
    expect(beforeInit.level).toBe('error');
    expect(beforeInit.traceId).toBe('trace-1');
    expect(beforeInit.data).toEqual({ token: '***redacted***', ok: true });

    const os = await import('node:os');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-debug-'));

    const realLogger = initDebugLogger(tmp);
    const recent = realLogger.getRecentEvents();
    const replayed = recent.find((e) => e.event === 'pre-init-error');
    expect(replayed).toMatchObject({
      ts: beforeInit.ts,
      level: 'error',
      traceId: 'trace-1',
      data: { token: '***redacted***', ok: true },
      error: { message: 'boom' },
    });

    realLogger.info({ domain: 'app', event: 'post-init-info' });
    expect(realLogger.getRecentEvents().some((e) => e.event === 'post-init-info')).toBe(true);
  });

  it('stops buffering past PRE_INIT_BUFFER_LIMIT and warns once', async () => {
    const { getDebugLogger, initDebugLogger } = await loadDebugModule();
    const logger = getDebugLogger();

    for (let i = 0; i < 300; i++) {
      logger.debug({ domain: 'app', event: `evt-${i}` });
    }

    const warnCalls = consoleWarnSpy.mock.calls.filter((c) => String(c[0]).includes('pre-init buffer cap'));
    expect(warnCalls).toHaveLength(1);

    const os = await import('node:os');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-debug-'));
    const realLogger = initDebugLogger(tmp);
    const replayedBuffered = realLogger.getRecentEvents().filter((e) => /^evt-\d+$/.test(e.event));
    expect(replayedBuffered.length).toBe(256);
  });
});
