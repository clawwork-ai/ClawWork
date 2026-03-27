import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:dns/promises', () => ({
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}));

import { isPrivateIP, isPrivateHost, assertNotPrivateHost } from '../src/main/net/ssrf-guard.js';
import { resolve4, resolve6 } from 'node:dns/promises';

const mockResolve4 = vi.mocked(resolve4);
const mockResolve6 = vi.mocked(resolve6);

beforeEach(() => {
  mockResolve4.mockReset();
  mockResolve6.mockReset();
});

describe('isPrivateIP', () => {
  const privateCases: [string, string][] = [
    ['127.0.0.1', 'loopback'],
    ['127.255.255.255', 'loopback high'],
    ['10.0.0.1', '10/8'],
    ['10.255.255.255', '10/8 high'],
    ['172.16.0.1', '172.16/12 low'],
    ['172.31.255.255', '172.16/12 high'],
    ['192.168.0.1', '192.168/16'],
    ['192.168.255.255', '192.168/16 high'],
    ['169.254.1.1', 'link-local'],
    ['0.0.0.0', 'unspecified'],
    ['0.1.2.3', '0/8'],
    ['100.64.0.1', 'CGNAT low'],
    ['100.127.255.255', 'CGNAT high'],
    ['198.18.0.1', 'benchmark low'],
    ['198.19.255.255', 'benchmark high'],
    ['240.0.0.1', 'reserved class E'],
    ['255.255.255.255', 'broadcast'],
  ];

  for (const [ip, label] of privateCases) {
    it(`blocks ${ip} (${label})`, () => {
      expect(isPrivateIP(ip)).toBe(true);
    });
  }

  const publicCases: [string, string][] = [
    ['8.8.8.8', 'Google DNS'],
    ['1.1.1.1', 'Cloudflare DNS'],
    ['172.15.255.255', 'just below 172.16/12'],
    ['172.32.0.0', 'just above 172.16/12'],
    ['100.63.255.255', 'just below CGNAT'],
    ['100.128.0.0', 'just above CGNAT'],
    ['198.17.255.255', 'just below benchmark'],
    ['198.20.0.0', 'just above benchmark'],
    ['239.255.255.255', 'just below class E'],
    ['11.0.0.1', 'public 11.x'],
  ];

  for (const [ip, label] of publicCases) {
    it(`allows ${ip} (${label})`, () => {
      expect(isPrivateIP(ip)).toBe(false);
    });
  }

  it('blocks IPv6 loopback ::1', () => {
    expect(isPrivateIP('::1')).toBe(true);
  });

  it('blocks IPv6 unspecified ::', () => {
    expect(isPrivateIP('::')).toBe(true);
  });

  it('blocks IPv6 ULA fd12:3456::1', () => {
    expect(isPrivateIP('fd12:3456::1')).toBe(true);
  });

  it('blocks IPv6 ULA fc00::1', () => {
    expect(isPrivateIP('fc00::1')).toBe(true);
  });

  it('blocks IPv6 link-local fe80::1', () => {
    expect(isPrivateIP('fe80::1')).toBe(true);
  });

  it('allows public IPv6 2001:4860:4860::8888', () => {
    expect(isPrivateIP('2001:4860:4860::8888')).toBe(false);
  });

  it('blocks IPv4-mapped IPv6 ::ffff:10.0.0.1', () => {
    expect(isPrivateIP('::ffff:10.0.0.1')).toBe(true);
  });

  it('blocks IPv4-mapped IPv6 hex form ::ffff:a00:1', () => {
    expect(isPrivateIP('::ffff:a00:1')).toBe(true);
  });

  it('allows IPv4-mapped IPv6 public ::ffff:8.8.8.8', () => {
    expect(isPrivateIP('::ffff:8.8.8.8')).toBe(false);
  });

  it('returns false for non-IP strings', () => {
    expect(isPrivateIP('example.com')).toBe(false);
    expect(isPrivateIP('10.cdn.example.com')).toBe(false);
    expect(isPrivateIP('fc-assets.cloudfront.net')).toBe(false);
  });
});

describe('isPrivateHost', () => {
  it('blocks localhost', () => {
    expect(isPrivateHost('localhost')).toBe(true);
  });

  it('blocks private IPs', () => {
    expect(isPrivateHost('10.0.0.1')).toBe(true);
  });

  it('allows public domains', () => {
    expect(isPrivateHost('example.com')).toBe(false);
  });

  it('does NOT false-positive on domains starting with private-looking prefixes', () => {
    expect(isPrivateHost('10.cdn.example.com')).toBe(false);
    expect(isPrivateHost('192.168.example.com')).toBe(false);
    expect(isPrivateHost('fc-assets.cloudfront.net')).toBe(false);
  });
});

describe('assertNotPrivateHost', () => {
  it('rejects private IP immediately without DNS', async () => {
    await expect(assertNotPrivateHost('10.0.0.1')).rejects.toThrow('SSRF blocked');
    expect(mockResolve4).not.toHaveBeenCalled();
  });

  it('rejects localhost immediately without DNS', async () => {
    await expect(assertNotPrivateHost('localhost')).rejects.toThrow('SSRF blocked');
  });

  it('allows public IP without DNS', async () => {
    await expect(assertNotPrivateHost('8.8.8.8')).resolves.toBeUndefined();
    expect(mockResolve4).not.toHaveBeenCalled();
  });

  it('resolves domain and blocks if DNS points to private IP', async () => {
    mockResolve4.mockResolvedValue(['10.0.0.1']);
    mockResolve6.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertNotPrivateHost('evil.example.com')).rejects.toThrow('SSRF blocked');
  });

  it('allows domain that resolves to public IP', async () => {
    mockResolve4.mockResolvedValue(['93.184.216.34']);
    mockResolve6.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertNotPrivateHost('example.com')).resolves.toBeUndefined();
  });

  it('blocks if any resolved address is private', async () => {
    mockResolve4.mockResolvedValue(['93.184.216.34', '10.0.0.1']);
    mockResolve6.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertNotPrivateHost('mixed.example.com')).rejects.toThrow('SSRF blocked');
  });

  it('blocks if IPv6 resolution returns private address', async () => {
    mockResolve4.mockRejectedValue(new Error('ENOTFOUND'));
    mockResolve6.mockResolvedValue(['fd12::1']);
    await expect(assertNotPrivateHost('v6only.example.com')).rejects.toThrow('SSRF blocked');
  });

  it('allows domain when DNS fails entirely', async () => {
    mockResolve4.mockRejectedValue(new Error('ENOTFOUND'));
    mockResolve6.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertNotPrivateHost('broken-dns.example.com')).resolves.toBeUndefined();
  });
});
