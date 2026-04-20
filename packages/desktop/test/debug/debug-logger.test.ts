import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: () => [],
  },
}));

describe('debug logger pre-init behavior', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('buffers events before initDebugLogger runs', async () => {
    const { getDebugLogger, isDebugLoggerInitialized } = await import(
      '../../src/main/debug/index.js'
    );

    const logger = getDebugLogger();
    const event1 = logger.info({ domain: 'app', event: 'test-event-1' });
    const event2 = logger.error({ domain: 'gateway', event: 'test-event-2' });

    expect(event1.level).toBe('info');
    expect(event1.domain).toBe('app');
    expect(event1.event).toBe('test-event-1');
    expect(event2.level).toBe('error');
    expect(event2.domain).toBe('gateway');

    expect(getDebugLogger().getRecentEvents()).toHaveLength(2);
    expect(isDebugLoggerInitialized()).toBe(false);
  });

  it('flushes buffered events to real logger after init', async () => {
    const { getDebugLogger, initDebugLogger, isDebugLoggerInitialized } = await import(
      '../../src/main/debug/index.js'
    );

    const logger = getDebugLogger();

    logger.info({ domain: 'app', event: 'pre-init-event' });
    logger.warn({ domain: 'gateway', event: 'pre-init-warn' });

    expect(isDebugLoggerInitialized()).toBe(false);

    const tempDir = `/tmp/test-debug-${Date.now()}`;
    const realLogger = initDebugLogger(tempDir);
    expect(isDebugLoggerInitialized()).toBe(true);

    const recentEvents = realLogger.getRecentEvents();
    expect(recentEvents.some((e) => e.event === 'pre-init-event')).toBe(true);
    expect(recentEvents.some((e) => e.event === 'pre-init-warn')).toBe(true);
  });

  it('warns via console when logging before init', async () => {
    const { getDebugLogger, isDebugLoggerInitialized } = await import(
      '../../src/main/debug/index.js'
    );

    if (isDebugLoggerInitialized()) {
      return;
    }

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const logger = getDebugLogger();
    logger.error({ domain: 'app', event: 'pre-init-warning-test' });

    expect(warnSpy).toHaveBeenCalled();
    const warningCall = warnSpy.mock.calls[0][0] as string;
    expect(warningCall).toContain('[debug] Logger not initialized yet');

    warnSpy.mockRestore();
  });
});
