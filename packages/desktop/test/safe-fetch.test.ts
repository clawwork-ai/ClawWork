import { describe, it, expect, vi, beforeEach } from 'vitest';

const { assertNotPrivateHostMock, netFetchMock } = vi.hoisted(() => ({
  assertNotPrivateHostMock: vi.fn(),
  netFetchMock: vi.fn(),
}));

vi.mock('../src/main/net/ssrf-guard.js', () => ({
  assertNotPrivateHost: assertNotPrivateHostMock,
}));

// Track the URL net.fetch was called with so tests can verify IP pinning.
let lastFetchUrl: string | undefined;
let lastFetchOpts: Record<string, unknown> | undefined;

vi.mock('electron', () => ({
  net: { fetch: netFetchMock },
}));

import { safeFetch } from '../src/main/net/safe-fetch.js';

// Wrapper that always captures fetch arguments regardless of mockResolvedValue
function mockFetchWithTracking() {
  netFetchMock.mockImplementation((url: string, opts?: Record<string, unknown>) => {
    lastFetchUrl = url;
    lastFetchOpts = opts;
    return Promise.resolve(mockResponse(new ArrayBuffer(4)));
  });
}

beforeEach(() => {
  assertNotPrivateHostMock.mockReset();
  assertNotPrivateHostMock.mockResolvedValue(null); // default: no pinning
  netFetchMock.mockReset();
  mockFetchWithTracking();
  lastFetchUrl = undefined;
  lastFetchOpts = undefined;
});

function streamReaderFrom(
  body: ArrayBuffer,
  chunkSize = 1024,
  cancel = vi.fn(async () => {}),
): ReadableStreamDefaultReader<Uint8Array> {
  const u8 = new Uint8Array(body);
  let offset = 0;
  return {
    read: async () => {
      if (offset >= u8.length) return { done: true as const, value: undefined };
      const end = Math.min(offset + chunkSize, u8.length);
      const value = u8.slice(offset, end);
      offset = end;
      return { done: false as const, value };
    },
    cancel,
    releaseLock: () => {},
    closed: Promise.resolve(undefined),
  } as ReadableStreamDefaultReader<Uint8Array>;
}

function mockResponse(
  body: ArrayBuffer,
  status = 200,
  headers: Record<string, string> = {},
  cancel = vi.fn(async () => {}),
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    body: {
      getReader: () => streamReaderFrom(body, 1024, cancel),
    },
  } as unknown as Response;
}

describe('safeFetch', () => {
  it('rejects non-HTTPS URLs before any network call', async () => {
    await expect(safeFetch('http://example.com/img.png')).rejects.toThrow('HTTPS required');
    expect(assertNotPrivateHostMock).not.toHaveBeenCalled();
    expect(netFetchMock).not.toHaveBeenCalled();
  });

  it('allows HTTP only for the configured trusted origin', async () => {
    const body = new ArrayBuffer(4);
    netFetchMock.mockResolvedValue(mockResponse(body));

    await safeFetch('http://127.0.0.1:18789/media/test.png', { trustedOrigin: 'http://127.0.0.1:18789/' });
    expect(assertNotPrivateHostMock).not.toHaveBeenCalled();
    expect(netFetchMock).toHaveBeenCalled();
  });

  it('treats malformed trusted origins as untrusted', async () => {
    await expect(
      safeFetch('http://127.0.0.1:18789/media/test.png', { trustedOrigin: 'http://[invalid' }),
    ).rejects.toThrow('HTTPS required');
    expect(assertNotPrivateHostMock).not.toHaveBeenCalled();
    expect(netFetchMock).not.toHaveBeenCalled();
  });

  it('calls assertNotPrivateHost with parsed hostname', async () => {
    assertNotPrivateHostMock.mockResolvedValue(undefined);
    const body = new ArrayBuffer(4);
    netFetchMock.mockResolvedValue(mockResponse(body));

    await safeFetch('https://cdn.example.com/img.png');
    expect(assertNotPrivateHostMock).toHaveBeenCalledWith('cdn.example.com');
  });

  it('rejects when assertNotPrivateHost throws', async () => {
    assertNotPrivateHostMock.mockRejectedValue(new Error('SSRF blocked: private host'));
    await expect(safeFetch('https://10.0.0.1/secret')).rejects.toThrow('SSRF blocked');
    expect(netFetchMock).not.toHaveBeenCalled();
  });

  it('rejects hostnames when DNS pinning fails', async () => {
    assertNotPrivateHostMock.mockRejectedValue(new Error('SSRF blocked: DNS resolution failed'));
    await expect(safeFetch('https://cdn.example.com/img.png')).rejects.toThrow('SSRF blocked');
    expect(netFetchMock).not.toHaveBeenCalled();
  });

  it('returns buffer on success', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    netFetchMock.mockResolvedValue(mockResponse(data.buffer));

    const buf = await safeFetch('https://cdn.example.com/img.png');
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBe(4);
  });

  it('rewrites URL with pinned IP and preserves Host header', async () => {
    assertNotPrivateHostMock.mockResolvedValue('93.184.216.34');
    mockFetchWithTracking();

    await safeFetch('https://cdn.example.com/img.png');
    // The IP must be pinned in the actual fetch URL
    expect(lastFetchUrl).toBe('https://93.184.216.34/img.png');
    // The original hostname must be preserved as the Host header
    expect(lastFetchOpts).toBeDefined();
    expect((lastFetchOpts as Record<string, unknown>).headers).toEqual({ Host: 'cdn.example.com' });
  });

  it('rewrites URL with pinned IPv6 and preserves Host header', async () => {
    assertNotPrivateHostMock.mockResolvedValue('2001:4860:4860::8888');
    mockFetchWithTracking();

    await safeFetch('https://cdn.example.com/img.png');
    expect(lastFetchUrl).toBe('https://[2001:4860:4860::8888]/img.png');
    expect((lastFetchOpts as Record<string, unknown>).headers).toEqual({ Host: 'cdn.example.com' });
  });

  it('does not rewrite for trusted origin', async () => {
    mockFetchWithTracking();

    await safeFetch('http://127.0.0.1:18789/media/test.png', { trustedOrigin: 'http://127.0.0.1:18789/' });
    // Trusted origin should bypass both DNS check and IP rewrite
    expect(assertNotPrivateHostMock).not.toHaveBeenCalled();
    expect(lastFetchUrl).toBe('http://127.0.0.1:18789/media/test.png');
  });

  it('does not rewrite when pinnedIP is null (IP literal)', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    mockFetchWithTracking();

    await safeFetch('https://1.1.1.1/path');
    expect(lastFetchUrl).toBe('https://1.1.1.1/path');
  });

  it('rejects when content-length exceeds maxSize', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    netFetchMock.mockResolvedValue(mockResponse(new ArrayBuffer(0), 200, { 'content-length': '999999999' }));

    await expect(safeFetch('https://cdn.example.com/huge.bin', { maxSize: 1024 })).rejects.toThrow('too large');
  });

  it('rejects when actual body exceeds maxSize', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    const big = new ArrayBuffer(2048);
    netFetchMock.mockResolvedValue(mockResponse(big));

    await expect(safeFetch('https://cdn.example.com/big.bin', { maxSize: 1024 })).rejects.toThrow('too large');
  });

  it('rejects on non-ok HTTP status', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    netFetchMock.mockResolvedValue(mockResponse(new ArrayBuffer(0), 404));

    await expect(safeFetch('https://cdn.example.com/missing.png')).rejects.toThrow('404');
  });

  it('passes redirect:error to net.fetch to prevent SSRF bypass via 3xx', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    mockFetchWithTracking();

    await safeFetch('https://cdn.example.com/img.png');
    expect(lastFetchOpts).toEqual(expect.objectContaining({ redirect: 'error' }));
  });

  it('rejects redirect response pointing to private host without following Location', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    netFetchMock.mockResolvedValue(mockResponse(new ArrayBuffer(0), 302, { Location: 'http://127.0.0.1/admin' }));

    await expect(safeFetch('https://cdn.example.com/img.png')).rejects.toThrow('302');
    expect(assertNotPrivateHostMock).toHaveBeenCalledTimes(1);
    expect(assertNotPrivateHostMock).toHaveBeenCalledWith('cdn.example.com');
  });

  it('rejects redirect response to another HTTPS URL without following Location', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    netFetchMock.mockResolvedValue(
      mockResponse(new ArrayBuffer(0), 302, { Location: 'https://other.example.com/img.png' }),
    );

    await expect(safeFetch('https://cdn.example.com/img.png')).rejects.toThrow('302');
    expect(assertNotPrivateHostMock).toHaveBeenCalledTimes(1);
  });

  it('propagates fetch error when redirect:error blocks a 3xx before response', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    netFetchMock.mockRejectedValue(new TypeError('redirected'));

    await expect(safeFetch('https://cdn.example.com/img.png')).rejects.toThrow('redirected');
    expect(assertNotPrivateHostMock).toHaveBeenCalledWith('cdn.example.com');
  });

  it('enforces maxSize incrementally during streaming — no content-length', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    const big = new ArrayBuffer(10 * 1024 * 1024 + 1);
    netFetchMock.mockResolvedValue(mockResponse(big, 200, {}));

    await expect(safeFetch('https://cdn.example.com/streaming.bin')).rejects.toThrow('too large');
  });

  it('handles empty response body', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    netFetchMock.mockResolvedValue(mockResponse(new ArrayBuffer(0)));

    const buf = await safeFetch('https://cdn.example.com/empty.bin');
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBe(0);
  });

  it('reads multi-chunk body correctly', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    const data = new TextEncoder().encode('hello world').buffer;
    netFetchMock.mockResolvedValue(mockResponse(data, 200, {}));

    const buf = await safeFetch('https://cdn.example.com/hello.bin');
    expect(buf.toString()).toBe('hello world');
  });

  it('cancels the body reader when streaming past maxSize', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    const cancel = vi.fn(async () => {});
    const big = new ArrayBuffer(2048);
    netFetchMock.mockResolvedValue(mockResponse(big, 200, {}, cancel));

    await expect(safeFetch('https://cdn.example.com/big.bin', { maxSize: 1024 })).rejects.toThrow('too large');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('rejects when a single chunk exceeds maxSize', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    const cancel = vi.fn(async () => {});
    const big = new ArrayBuffer(2048);
    netFetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      body: {
        getReader: () => streamReaderFrom(big, 2048, cancel),
      },
    } as unknown as Response);

    await expect(safeFetch('https://cdn.example.com/one-chunk.bin', { maxSize: 1024 })).rejects.toThrow('too large');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('aborts the fetch signal when streaming past maxSize', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    const cancel = vi.fn(async () => {});
    let abortSignal: AbortSignal | undefined;
    netFetchMock.mockImplementation((_url: string, opts?: Record<string, unknown>) => {
      abortSignal = opts?.signal as AbortSignal;
      return Promise.resolve(mockResponse(new ArrayBuffer(2048), 200, {}, cancel));
    });

    await expect(safeFetch('https://cdn.example.com/big.bin', { maxSize: 1024 })).rejects.toThrow('too large');
    expect(cancel).toHaveBeenCalledOnce();
    expect(abortSignal?.aborted).toBe(true);
  });

  it('does not read the entire oversized body before rejecting — bounded streaming (#408)', async () => {
    assertNotPrivateHostMock.mockResolvedValue(null);
    const chunkSize = 256;
    const maxSize = 1024;
    const bodySize = 10 * 1024;
    const cancel = vi.fn(async () => {});
    const reader = streamReaderFrom(new ArrayBuffer(bodySize), chunkSize, cancel);
    const readSpy = vi.spyOn(reader, 'read');
    netFetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      body: {
        getReader: () => reader,
      },
    } as unknown as Response);

    await expect(safeFetch('https://cdn.example.com/huge-stream.bin', { maxSize })).rejects.toThrow('too large');

    // 5 chunks (1280 bytes) exceed maxSize; must not drain the full 10 KiB body.
    expect(readSpy.mock.calls.length).toBeLessThan(bodySize / chunkSize);
    expect(readSpy.mock.calls.length).toBeLessThanOrEqual(Math.ceil(maxSize / chunkSize) + 1);
    expect(cancel).toHaveBeenCalledOnce();
  });
});
