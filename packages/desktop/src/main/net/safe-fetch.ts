import { net } from 'electron';
import { assertNotPrivateHost } from './ssrf-guard.js';

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 10_000;

interface SafeFetchOptions {
  maxSize?: number;
  timeoutMs?: number;
  trustedOrigin?: string;
}

function isSameOrigin(parsed: URL, trustedOrigin?: string): boolean {
  if (!trustedOrigin) return false;
  try {
    return parsed.origin === new URL(trustedOrigin).origin;
  } catch {
    return false;
  }
}

export async function safeFetch(url: string, opts: SafeFetchOptions = {}): Promise<Buffer> {
  const parsed = new URL(url);
  const isTrustedOrigin = isSameOrigin(parsed, opts.trustedOrigin);
  if (parsed.protocol !== 'https:' && !isTrustedOrigin) throw new Error('HTTPS required');
  if (!isTrustedOrigin) await assertNotPrivateHost(parsed.hostname);

  const maxSize = opts.maxSize ?? DEFAULT_MAX_SIZE;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await net.fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
    const cl = Number(res.headers.get('content-length') ?? '0');
    if (cl > maxSize) throw new Error('response too large');
    const ab = await res.arrayBuffer();
    if (ab.byteLength > maxSize) throw new Error('response too large');
    return Buffer.from(ab);
  } finally {
    clearTimeout(timeout);
  }
}
