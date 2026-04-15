/**
 * Per-(domain, event) sliding-window rate limiter for IPC handlers.
 *
 * Prevents a buggy or malicious renderer from:
 * - flooding the logger with thousands of events per second
 * - growing the limiter's memory indefinitely (bounded to MAX_TRACKED_KEYS)
 */

export interface RateLimiterConfig {
  /** Max events allowed per window per key. Default: 100 */
  maxEventsPerWindow?: number;
  /** Window duration in ms. Default: 1000 */
  windowMs?: number;
  /** Max unique (domain:event) keys tracked. Oldest evicted when full. Default: 256 */
  maxTrackedKeys?: number;
}

interface WindowEntry {
  count: number;
  windowStart: number;
  dropped: number;
}

export interface RateLimitResult {
  /** true = allowed, false = dropped */
  allowed: boolean;
  /** If an evicted key had drops, returns it for summary logging */
  evictedKey?: string;
  evictedDrops?: number;
}

export function createRateLimiter(config: RateLimiterConfig = {}) {
  const maxEvents = config.maxEventsPerWindow ?? 100;
  const windowMs = config.windowMs ?? 1000;
  const maxKeys = config.maxTrackedKeys ?? 256;

  const map = new Map<string, WindowEntry>();

  /**
   * Check whether an event for (domain, event) should be allowed.
   * Returns a result indicating if the event passes and any evicted summary info.
   */
  function check(domain: string, event: string, now: number = Date.now()): RateLimitResult {
    const key = `${domain}:${event}`;
    let evictedKey: string | undefined;
    let evictedDrops: number | undefined;

    // Evict oldest key if we've hit the cap
    if (!map.has(key) && map.size >= maxKeys) {
      const oldestKey = map.keys().next().value;
      if (oldestKey) {
        const evicted = map.get(oldestKey);
        if (evicted && evicted.dropped > 0) {
          evictedKey = oldestKey;
          evictedDrops = evicted.dropped;
        }
        map.delete(oldestKey);
      }
    }

    let entry = map.get(key);

    // New or expired window
    if (!entry || now - entry.windowStart >= windowMs) {
      const prevDrops = entry?.dropped ?? 0;
      entry = { count: 1, windowStart: now, dropped: 0 };
      map.set(key, entry);
      return {
        allowed: true,
        evictedKey: prevDrops > 0 ? key : evictedKey,
        evictedDrops: prevDrops > 0 ? prevDrops : evictedDrops,
      };
    }

    // Within the same window
    if (entry.count < maxEvents) {
      entry.count++;
      return { allowed: true, evictedKey, evictedDrops };
    }

    // Over limit
    entry.dropped++;
    return { allowed: false, evictedKey, evictedDrops };
  }

  /** Reset all state (for testing) */
  function reset(): void {
    map.clear();
  }

  /** Get current tracked key count (for testing) */
  function size(): number {
    return map.size;
  }

  return { check, reset, size };
}
