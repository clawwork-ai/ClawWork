import { describe, expect, it, beforeEach } from 'vitest';
import { createRateLimiter } from '../src/main/ipc/debug-rate-limiter';

describe('debug rate limiter', () => {
  let limiter: ReturnType<typeof createRateLimiter>;
  const t = (seconds: number) => 1_000_000_000 + seconds * 1000;

  beforeEach(() => {
    limiter = createRateLimiter({
      maxEventsPerWindow: 5,
      windowMs: 1000,
      maxTrackedKeys: 4,
    });
  });

  it('allows events within the rate limit', () => {
    for (let i = 0; i < 5; i++) {
      const r = limiter.check('renderer', 'test.event', t(0));
      expect(r.allowed).toBe(true);
    }
  });

  it('drops events exceeding the rate limit', () => {
    for (let i = 0; i < 5; i++) {
      limiter.check('renderer', 'test.event', t(0));
    }
    const r = limiter.check('renderer', 'test.event', t(0));
    expect(r.allowed).toBe(false);
  });

  it('starts a new window without emitting a summary when nothing was dropped', () => {
    for (let i = 0; i < 5; i++) {
      limiter.check('renderer', 'test.event', t(0));
    }
    const r = limiter.check('renderer', 'test.event', t(1));
    expect(r.allowed).toBe(true);
    expect(r.evictedKey).toBeUndefined();
  });

  it('reports dropped events when a throttled window rolls over', () => {
    for (let i = 0; i < 5; i++) {
      limiter.check('renderer', 'test.event', t(0));
    }
    limiter.check('renderer', 'test.event', t(0));
    limiter.check('renderer', 'test.event', t(0));

    const r = limiter.check('renderer', 'test.event', t(1));
    expect(r.allowed).toBe(true);
    expect(r.evictedKey).toBe('renderer:test.event');
    expect(r.evictedDrops).toBe(2);
  });

  it('tracks different (domain, event) tuples independently', () => {
    for (let i = 0; i < 5; i++) {
      limiter.check('renderer', 'event-a', t(0));
    }
    expect(limiter.check('renderer', 'event-a', t(0)).allowed).toBe(false);
    expect(limiter.check('renderer', 'event-b', t(0)).allowed).toBe(true);
  });

  it('evicts the oldest key when max tracked keys is reached', () => {
    limiter.check('renderer', 'e1', t(0));
    limiter.check('renderer', 'e2', t(0));
    limiter.check('renderer', 'e3', t(0));
    limiter.check('renderer', 'e4', t(0));
    expect(limiter.size()).toBe(4);

    limiter.check('renderer', 'e5', t(0));
    expect(limiter.size()).toBe(4);
  });

  it('reports evicted drops in the result', () => {
    for (let i = 0; i < 5; i++) {
      limiter.check('renderer', 'spam', t(0));
    }
    limiter.check('renderer', 'spam', t(0));
    limiter.check('renderer', 'spam', t(0));

    limiter.check('renderer', 'a', t(0));
    limiter.check('renderer', 'b', t(0));
    limiter.check('renderer', 'c', t(0));

    const r = limiter.check('renderer', 'd', t(0));
    expect(r.evictedKey).toBe('renderer:spam');
    expect(r.evictedDrops).toBe(2);
  });

  it('resets state with reset()', () => {
    limiter.check('renderer', 'test', t(0));
    expect(limiter.size()).toBe(1);
    limiter.reset();
    expect(limiter.size()).toBe(0);
  });
});
