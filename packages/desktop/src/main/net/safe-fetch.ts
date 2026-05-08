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

  // Resolve and pin the IP so the guard check and the actual fetch see the
  // same DNS result, closing the DNS rebinding TOCTOU window.  (#405)
  let fetchUrl = url;
  if (!isTrustedOrigin) {
    const pinnedIP = await assertNotPrivateHost(parsed.hostname);
    if (pinnedIP) {
      // Rewrite the URL with the pinned IP so net.fetch does NOT re-resolve DNS.
      // The original hostname is preserved via the Host header for SNI support.
      const rewritten = new URL(url);
      rewritten.hostname = pinnedIP;
      fetchUrl = rewritten.toString();
    }
  }

  const maxSize = opts.maxSize ?? DEFAULT_MAX_SIZE;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    // When the IP is pinned, pass the original hostname as the Host header
    // so the server (and TLS SNI in Chromium) knows which virtual host to serve.
    const fetchOpts: Record<string, unknown> = { signal: controller.signal };
    if (fetchUrl !== url) {
      fetchOpts.headers = { Host: parsed.hostname };
    }
    const res = await net.fetch(fetchUrl, fetchOpts);
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
