import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

function isPrivateIPv4(ip: string): boolean {
  const p = parseIPv4(ip);
  if (!p) return false;
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
  const zoneIndex = lower.indexOf('%');
  const addr = zoneIndex === -1 ? lower : lower.slice(0, zoneIndex);
  const v4Match = addr.match(/^(?:[0:]*|::)ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Match) return isPrivateIPv4(v4Match[1]);
  const groups = parseIPv6Groups(addr);
  if (!groups) return false;
  if (groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff) {
    return isPrivateIPv4(groupsToIPv4(groups));
  }
  if (groups.slice(0, 6).every((g) => g === 0)) {
    return isPrivateIPv4(groupsToIPv4(groups));
  }
  const first = groups[0];
  if (groups.every((group) => group === 0)) return true;
  if (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) return true;
  if ((first & 0xfe00) === 0xfc00) return true;
  if ((first & 0xffc0) === 0xfe80) return true;
  return false;
}

function parseIPv4(ip: string): number[] | null {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => n < 0 || n > 255 || !Number.isInteger(n))) return null;
  return p;
}

function groupsToIPv4(groups: number[]): string {
  const hi = groups[6];
  const lo = groups[7];
  return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;
}

function parseIPv6Groups(ip: string): number[] | null {
  if (ip.includes('::')) {
    const sections = ip.split('::');
    if (sections.length !== 2) return null;
    const head = parseIPv6Section(sections[0]);
    const tail = parseIPv6Section(sections[1]);
    if (!head || !tail || head.length + tail.length > 8) return null;
    return [...head, ...Array(8 - head.length - tail.length).fill(0), ...tail];
  }
  const groups = parseIPv6Section(ip);
  return groups?.length === 8 ? groups : null;
}

function parseIPv6Section(section: string): number[] | null {
  if (section === '') return [];
  const parts = section.split(':');
  const groups = parts.flatMap((group, index) => {
    if (group.includes('.')) {
      const p = index === parts.length - 1 ? parseIPv4(group) : null;
      if (!p) return [Number.NaN];
      return [(p[0] << 8) | p[1], (p[2] << 8) | p[3]];
    }
    if (!/^[0-9a-f]{1,4}$/.test(group)) return Number.NaN;
    return parseInt(group, 16);
  });
  return groups.some(Number.isNaN) ? null : groups;
}

function normalizeHostname(hostname: string): string {
  if (hostname.startsWith('[') && hostname.endsWith(']')) return hostname.slice(1, -1);
  return hostname;
}

export function isPrivateIP(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isPrivateIPv4(ip);
  if (v === 6) return isPrivateIPv6(ip);
  return false;
}

export function isPrivateHost(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return normalized === 'localhost' || isPrivateIP(normalized);
}

export async function assertNotPrivateHost(hostname: string): Promise<string | null> {
  const normalized = normalizeHostname(hostname);
  if (isPrivateHost(normalized)) throw new Error('SSRF blocked: private host');
  if (isIP(normalized)) return null;
  const results = await Promise.allSettled([lookup(normalized, { all: true, verbatim: true })]);
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const entry of r.value) {
      if (isPrivateIP(entry.address)) throw new Error('SSRF blocked: resolves to private IP');
    }
  }
  // Return the first resolved public IP so the caller can PIN it in the
  // actual fetch, closing the DNS rebinding TOCTOU window.  (#405)
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    return r.value[0]?.address ?? null;
  }
  return null;
}
