import { app, ipcMain } from 'electron';
import { join } from 'node:path';
import { exportDebugBundle } from '../debug/export.js';
import { getDebugLogger } from '../debug/index.js';
import { getAllGatewayClients } from '../ws/index.js';
import { readConfig } from '../workspace/config.js';
import { createRateLimiter } from './debug-rate-limiter.js';

const MAX_PAYLOAD_BYTES = 16 * 1024;
const RENDERER_DOMAIN = 'renderer' as const;
const UNKNOWN_EVENT = 'unknown';

const debugRateLimiter = createRateLimiter({
  maxEventsPerWindow: 100,
  windowMs: 1000,
  maxTrackedKeys: 256,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getSerializedPayloadSize(payload: unknown): number | null {
  try {
    const serialized = JSON.stringify(payload);
    return typeof serialized === 'string' ? serialized.length : 0;
  } catch {
    return null;
  }
}

export function registerDebugHandlers(): void {
  ipcMain.on('debug:renderer-event', (_event, payload: unknown) => {
    if (!isRecord(payload)) return;

    const event = typeof payload.event === 'string' && payload.event ? payload.event : UNKNOWN_EVENT;
    const result = debugRateLimiter.check(RENDERER_DOMAIN, event);
    if (result.evictedKey) {
      const logger = getDebugLogger();
      logger.warn({
        domain: RENDERER_DOMAIN,
        event: 'renderer.throttled',
        data: {
          key: result.evictedKey,
          dropped: result.evictedDrops,
          reason: 'rate-limit',
        },
      });
    }
    if (!result.allowed) {
      return;
    }

    const payloadSize = getSerializedPayloadSize(payload);
    if (payloadSize === null) return;

    if (payloadSize > MAX_PAYLOAD_BYTES) {
      const logger = getDebugLogger();
      logger.warn({
        domain: RENDERER_DOMAIN,
        event: 'renderer.payload-oversize',
        data: {
          payloadSize,
          maxBytes: MAX_PAYLOAD_BYTES,
          event,
        },
      });
      return;
    }

    const traceId = typeof payload.traceId === 'string' ? payload.traceId : undefined;
    const feature = typeof payload.feature === 'string' ? payload.feature : undefined;
    const data = isRecord(payload.data) ? payload.data : undefined;

    const logger = getDebugLogger();
    logger.info({
      domain: RENDERER_DOMAIN,
      event,
      traceId,
      feature,
      data,
    });
  });

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
