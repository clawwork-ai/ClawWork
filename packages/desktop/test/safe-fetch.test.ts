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

function mockResponse(body: ArrayBuffer, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    arrayBuffer: () => Promise.resolve(body),
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
});
