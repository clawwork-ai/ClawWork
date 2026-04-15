import { app, ipcMain } from 'electron';
import { join } from 'node:path';
import { exportDebugBundle } from '../debug/export.js';
import { getDebugLogger } from '../debug/index.js';
import { getAllGatewayClients } from '../ws/index.js';
import { readConfig } from '../workspace/config.js';
import { createRateLimiter } from './debug-rate-limiter.js';

// ---------------------------------------------------------------------------
// Constants for debug:renderer-event hardening (issue #413)
// ---------------------------------------------------------------------------

/** Max serialized payload size in bytes — reject oversized events before processing */
const MAX_PAYLOAD_BYTES = 16 * 1024; // 16 KB

/** Per-(domain, event) rate limiter: 100 events/sec */
const debugRateLimiter = createRateLimiter({
  maxEventsPerWindow: 100,
  windowMs: 1000,
  maxTrackedKeys: 256,
});

// ---------------------------------------------------------------------------
// IPC handler registration
// ---------------------------------------------------------------------------

export function registerDebugHandlers(): void {
  ipcMain.on(
    'debug:renderer-event',
    (
      _event,
      payload: {
        event: string;
        traceId?: string;
        feature?: string;
        data?: Record<string, unknown>;
      },
    ) => {
      // 1. Payload size guard — reject oversized payloads before any processing
      const payloadSize = JSON.stringify(payload).length;
      if (payloadSize > MAX_PAYLOAD_BYTES) {
        const logger = getDebugLogger();
        logger.warn({
          domain: 'renderer' as 'renderer',
          event: 'renderer.payload-oversize',
          data: {
            payloadSize,
            maxBytes: MAX_PAYLOAD_BYTES,
            domain: payload?.domain,
            event: payload?.event,
          },
        });
        return;
      }

      // 2. Rate limit per (domain, event) tuple
      const result = debugRateLimiter.check(payload.domain, payload.event);
      if (result.evictedKey) {
        const logger = getDebugLogger();
        logger.warn({
          domain: 'renderer' as 'renderer',
          event: 'renderer.throttled',
          data: {
            key: result.evictedKey,
            dropped: result.evictedDrops,
            reason: 'rate-limit',
          },
        });
      }
      if (!result.allowed) {
        return; // dropped — counted and will be summarized on next window flip
      }

      // 3. Normal logging path
      const logger = getDebugLogger();
      logger.info({
        domain: 'renderer',
        event: payload.event,
        traceId: payload.traceId,
        feature: payload.feature,
        data: payload.data,
      });
    },
  );

  ipcMain.handle(
    'debug:export-bundle',
    async (
      _event,
      payload?: {
        gatewayId?: string;
        sessionKey?: string;
        taskId?: string;
        limit?: number;
      },
    ) => {
      const clients = getAllGatewayClients();
      const gatewayStatus: Record<string, { connected: boolean; name: string }> = {};
      for (const [id, client] of clients) {
        gatewayStatus[id] = { connected: client.isConnected, name: client.name };
      }

      const result = exportDebugBundle({
        outputDir: join(app.getPath('userData'), 'debug-bundles'),
        logger: getDebugLogger(),
        meta: {
          gatewayStatus,
          config: readConfig() as unknown as Record<string, unknown> | undefined,
          environment: {
            platform: process.platform,
            arch: process.arch,
            node: process.version,
            electron: process.versions.electron,
          },
        },
        filter: payload,
      });

      return { ok: true, path: result.bundlePath, eventCount: result.events.length };
    },
  );
}
