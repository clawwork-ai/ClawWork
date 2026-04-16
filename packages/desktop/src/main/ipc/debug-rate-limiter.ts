interface RateLimiterConfig {
  maxEventsPerWindow?: number;
  windowMs?: number;
  maxTrackedKeys?: number;
}

interface WindowEntry {
  count: number;
  windowStart: number;
  dropped: number;
}

interface RateLimitResult {
  allowed: boolean;
  evictedKey?: string;
  evictedDrops?: number;
}

export function createRateLimiter(config: RateLimiterConfig = {}) {
  const maxEvents = config.maxEventsPerWindow ?? 100;
  const windowMs = config.windowMs ?? 1000;
  const maxKeys = config.maxTrackedKeys ?? 256;

  const map = new Map<string, WindowEntry>();

  function check(domain: string, event: string, now: number = Date.now()): RateLimitResult {
    const key = `${domain}:${event}`;
    let evictedKey: string | undefined;
    let evictedDrops: number | undefined;

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

    if (entry.count < maxEvents) {
      entry.count++;
      return { allowed: true, evictedKey, evictedDrops };
    }

    entry.dropped++;
    return { allowed: false, evictedKey, evictedDrops };
  }

  function reset(): void {
    map.clear();
  }

  function size(): number {
    return map.size;
  }

  return { check, reset, size };
}
