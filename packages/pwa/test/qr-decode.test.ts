import { describe, it, expect } from 'vitest';
import { parseQrPayload } from '../src/lib/qr-decode';

describe('parseQrPayload', () => {
  it('parses valid payload with scope ID', () => {
    const raw = JSON.stringify({
      v: 1,
      s: 'abc123',
      g: [{ u: 'wss://server:18789', t: 'token-abc', n: 'Home OC' }],
    });
    const result = parseQrPayload(raw);
    expect(result.v).toBe(1);
    expect(result.s).toBe('abc123');
    expect(result.g).toHaveLength(1);
    expect(result.g[0].n).toBe('Home OC');
  });

  it('allows missing scope ID', () => {
    const raw = JSON.stringify({
      v: 1,
      g: [{ u: 'wss://server:18789', t: 'tok', n: 'Test' }],
    });
    const result = parseQrPayload(raw);
    expect(result.s).toBeUndefined();
    expect(result.g).toHaveLength(1);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseQrPayload('not json')).toThrow('not valid JSON');
  });

  it('rejects unsupported version', () => {
    expect(() => parseQrPayload(JSON.stringify({ v: 99, g: [] }))).toThrow('Unsupported QR version');
  });

  it('rejects missing gateways', () => {
    expect(() => parseQrPayload(JSON.stringify({ v: 1, s: 'abc123', g: [] }))).toThrow('no gateways');
  });

  it('rejects invalid gateway URL scheme', () => {
    const raw = JSON.stringify({
      v: 1,
      s: 'abc123',
      g: [{ u: 'http://bad', t: 'tok', n: 'Bad' }],
    });
    expect(() => parseQrPayload(raw)).toThrow('ws:// or wss://');
  });

  it('parses multiple gateways', () => {
    const raw = JSON.stringify({
      v: 1,
      s: 'abc123',
      g: [
        { u: 'wss://a:18789', t: 't1', n: 'A' },
        { u: 'ws://b:18789', t: 't2', n: 'B' },
      ],
    });
    const result = parseQrPayload(raw);
    expect(result.g).toHaveLength(2);
  });

  it('parses password-mode gateways', () => {
    const raw = JSON.stringify({
      v: 1,
      s: 'abc123',
      g: [{ u: 'wss://server:18789', p: 'pw', m: 'password', n: 'Home' }],
    });
    const result = parseQrPayload(raw);
    expect(result.g[0].m).toBe('password');
    expect(result.g[0].p).toBe('pw');
  });
});
