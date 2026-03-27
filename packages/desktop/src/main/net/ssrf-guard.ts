import { isIP } from 'node:net';
import { resolve4, resolve6 } from 'node:dns/promises';

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => n < 0 || n > 255 || !Number.isInteger(n))) return false;
  const [a, b] = p;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 127 ||
    (a === 169 && b === 254) ||
    a === 0 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 240
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  const first = parseInt(lower.split(':')[0], 16);
  if ((first & 0xfe00) === 0xfc00) return true;
  if ((first & 0xffc0) === 0xfe80) return true;
  const v4Match = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Match) return isPrivateIPv4(v4Match[1]);
  const hexMatch = lower.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMatch) {
    const hi = parseInt(hexMatch[1], 16);
    const lo = parseInt(hexMatch[2], 16);
    return isPrivateIPv4(`${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`);
  }
  return false;
}

export function isPrivateIP(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isPrivateIPv4(ip);
  if (v === 6) return isPrivateIPv6(ip);
  return false;
}

export function isPrivateHost(hostname: string): boolean {
  return hostname === 'localhost' || isPrivateIP(hostname);
}

export async function assertNotPrivateHost(hostname: string): Promise<void> {
  if (isPrivateHost(hostname)) throw new Error('SSRF blocked: private host');
  if (isIP(hostname)) return;
  const results = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const ip of r.value) {
      if (isPrivateIP(ip)) throw new Error('SSRF blocked: resolves to private IP');
    }
  }
}
