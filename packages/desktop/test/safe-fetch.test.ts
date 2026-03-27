import { describe, it, expect, vi, beforeEach } from 'vitest';

const { assertNotPrivateHostMock, netFetchMock } = vi.hoisted(() => ({
  assertNotPrivateHostMock: vi.fn(),
  netFetchMock: vi.fn(),
}));

vi.mock('../src/main/net/ssrf-guard.js', () => ({
  assertNotPrivateHost: assertNotPrivateHostMock,
}));

vi.mock('electron', () => ({
  net: { fetch: netFetchMock },
}));

import { safeFetch } from '../src/main/net/safe-fetch.js';

beforeEach(() => {
  assertNotPrivateHostMock.mockReset();
  netFetchMock.mockReset();
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
    assertNotPrivateHostMock.mockResolvedValue(undefined);
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    netFetchMock.mockResolvedValue(mockResponse(data.buffer));

    const buf = await safeFetch('https://cdn.example.com/img.png');
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBe(4);
  });

  it('rejects when content-length exceeds maxSize', async () => {
    assertNotPrivateHostMock.mockResolvedValue(undefined);
    netFetchMock.mockResolvedValue(mockResponse(new ArrayBuffer(0), 200, { 'content-length': '999999999' }));

    await expect(safeFetch('https://cdn.example.com/huge.bin', { maxSize: 1024 })).rejects.toThrow('too large');
  });

  it('rejects when actual body exceeds maxSize', async () => {
    assertNotPrivateHostMock.mockResolvedValue(undefined);
    const big = new ArrayBuffer(2048);
    netFetchMock.mockResolvedValue(mockResponse(big));

    await expect(safeFetch('https://cdn.example.com/big.bin', { maxSize: 1024 })).rejects.toThrow('too large');
  });

  it('rejects on non-ok HTTP status', async () => {
    assertNotPrivateHostMock.mockResolvedValue(undefined);
    netFetchMock.mockResolvedValue(mockResponse(new ArrayBuffer(0), 404));

    await expect(safeFetch('https://cdn.example.com/missing.png')).rejects.toThrow('404');
  });
});
