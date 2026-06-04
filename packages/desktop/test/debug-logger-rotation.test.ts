import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDebugLogger } from '../src/main/debug/logger';

describe('debug logger size rotation', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'clawwork-debug-rotation-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('rotates to .1.ndjson when file exceeds maxFileSize', async () => {
    const logger = createDebugLogger({
      debugDir: dir,
      maxEvents: 1000,
      console: false,
      maxFileSize: 100, // tiny — rotate after ~100 bytes
    });

    // Write enough events to trigger rotation
    for (let i = 0; i < 50; i++) {
      logger.info({
        domain: 'gateway',
        event: `test-event-${i}`,
        message: 'x'.repeat(40), // each event ~60-100 bytes
      });
    }

    await logger.flush();

    const files = readdirSync(dir).filter((f) => f.endsWith('.ndjson'));
    // Should have at least 2 files (rotated + current)
    expect(files.length).toBeGreaterThanOrEqual(2);

    // The rotated file should exist
    const rotatedFiles = files.filter((f) => f.includes('.1.ndjson'));
    expect(rotatedFiles.length).toBeGreaterThanOrEqual(1);

    // The current (active) file should be under the size limit
    // current is debug-YYYY-MM-DD.ndjson, rotated are .1, .2, etc.
    // The "current" active file has no suffix
    const activeFile = files.find((f) => /^debug-\d{4}-\d{2}-\d{2}\.ndjson$/.test(f) && !/\.\d+\.ndjson$/.test(f));
    if (activeFile) {
      const size = statSync(join(dir, activeFile)).size;
      expect(size).toBeLessThan(200); // well within the limit
    }

    // Verify rotated files are named correctly
    for (const f of rotatedFiles) {
      expect(f).toMatch(/^debug-\d{4}-\d{2}-\d{2}\.\d+\.ndjson$/);
    }
  });

  it('creates multiple rotation files .1, .2, .3 when needed', async () => {
    const logger = createDebugLogger({
      debugDir: dir,
      maxEvents: 5000,
      console: false,
      maxFileSize: 80, // very tiny — rotate frequently
    });

    // Write many big events to trigger multiple rotations
    for (let i = 0; i < 100; i++) {
      logger.info({
        domain: 'gateway',
        event: `big-event-${i}`,
        message: 'z'.repeat(60),
      });
    }

    await logger.flush();

    // Find all rotation files
    const files = readdirSync(dir).filter((f) => f.endsWith('.ndjson'));
    const rotNums = files
      .map((f) => {
        const m = f.match(/\.(\d+)\.ndjson$/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => n > 0);

    // Expect at least 2 distinct rotation indices
    expect(rotNums.length).toBeGreaterThanOrEqual(2);

    // The highest rotation index should exist
    const maxRot = Math.max(...rotNums);
    expect(existsSync(join(dir, `debug-${new Date().toISOString().slice(0, 10)}.${maxRot}.ndjson`))).toBe(true);
  });
});

describe('debug logger retention cleanup', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'clawwork-debug-retention-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('deletes log files older than retentionDays on init', () => {
    const today = new Date().toISOString().slice(0, 10);

    // Create old log files (15 days ago)
    const oldDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const oldDateStr = oldDate.toISOString().slice(0, 10);

    writeFileSync(join(dir, `debug-${oldDateStr}.ndjson`), 'old log data\n');
    writeFileSync(join(dir, `debug-${oldDateStr}.1.ndjson`), 'old rotated log data\n');

    // Create recent log files (today)
    writeFileSync(join(dir, `debug-${today}.ndjson`), 'current log data\n');

    // Create unrelated files that should not be touched
    writeFileSync(join(dir, 'other-file.txt'), 'not a log\n');

    expect(existsSync(join(dir, `debug-${oldDateStr}.ndjson`))).toBe(true);
    expect(existsSync(join(dir, `debug-${oldDateStr}.1.ndjson`))).toBe(true);
    expect(existsSync(join(dir, `debug-${today}.ndjson`))).toBe(true);

    // Create logger with 7-day retention — this triggers cleanup
    createDebugLogger({
      debugDir: dir,
      maxEvents: 100,
      console: false,
      retentionDays: 7,
    });

    // Old files should be deleted
    expect(existsSync(join(dir, `debug-${oldDateStr}.ndjson`))).toBe(false);
    expect(existsSync(join(dir, `debug-${oldDateStr}.1.ndjson`))).toBe(false);

    // Recent file should remain
    expect(existsSync(join(dir, `debug-${today}.ndjson`))).toBe(true);

    // Non-log files should be untouched
    expect(existsSync(join(dir, 'other-file.txt'))).toBe(true);
  });

  it('does not delete recent files within retentionDays', () => {
    const today = new Date().toISOString().slice(0, 10);

    // Create file from 3 days ago
    const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recentDateStr = recentDate.toISOString().slice(0, 10);

    writeFileSync(join(dir, `debug-${recentDateStr}.ndjson`), 'recent log\n');
    writeFileSync(join(dir, `debug-${today}.ndjson`), 'current log\n');

    // Create logger with 7-day retention
    createDebugLogger({
      debugDir: dir,
      maxEvents: 100,
      console: false,
      retentionDays: 7,
    });

    // Both files should survive (3 days < 7 days)
    expect(existsSync(join(dir, `debug-${recentDateStr}.ndjson`))).toBe(true);
    expect(existsSync(join(dir, `debug-${today}.ndjson`))).toBe(true);
  });

  it('disables cleanup when retentionDays is 0', () => {
    const today = new Date().toISOString().slice(0, 10);

    // Create very old files
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const oldDateStr = oldDate.toISOString().slice(0, 10);

    writeFileSync(join(dir, `debug-${oldDateStr}.ndjson`), 'very old log\n');
    writeFileSync(join(dir, `debug-${today}.ndjson`), 'current log\n');

    // Create logger with retentionDays=0 (disabled)
    createDebugLogger({
      debugDir: dir,
      maxEvents: 100,
      console: false,
      retentionDays: 0,
    });

    // Old file should still exist
    expect(existsSync(join(dir, `debug-${oldDateStr}.ndjson`))).toBe(true);
    expect(existsSync(join(dir, `debug-${today}.ndjson`))).toBe(true);
  });
});

describe('debug logger file size boundaries', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'clawwork-debug-boundary-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('keeps active file within size limit across rotations', async () => {
    // Create a logger with a moderate size limit
    const maxFileSize = 500;
    const logger = createDebugLogger({
      debugDir: dir,
      maxEvents: 5000,
      console: false,
      maxFileSize,
    });

    // Write events in batches with flush
    for (let batch = 0; batch < 5; batch++) {
      for (let i = 0; i < 10; i++) {
        logger.info({
          domain: 'gateway',
          event: `batch-${batch}-event-${i}`,
          message: 'a'.repeat(50),
        });
      }
      await logger.flush();
    }

    await logger.flush();

    // The active file should be well within the size limit
    const files = readdirSync(dir).filter((f) => f.endsWith('.ndjson'));
    const activeFile = files.find((f) => /^debug-\d{4}-\d{2}-\d{2}\.ndjson$/.test(f) && !/\.\d+\.ndjson$/.test(f));
    expect(activeFile).toBeTruthy();
    const activeSize = statSync(join(dir, activeFile!)).size;

    // Active file should not exceed maxFileSize
    expect(activeSize).toBeLessThan(maxFileSize);

    // All rotated files should also stay within limits
    for (const f of files) {
      if (f === activeFile) continue;
      const size = statSync(join(dir, f)).size;
      // Rotated files may exceed maxFileSize slightly since they're renamed when the limit is hit
      // but they shouldn't be wildly larger
      expect(size).toBeLessThan(maxFileSize * 2);
    }
  });
});
