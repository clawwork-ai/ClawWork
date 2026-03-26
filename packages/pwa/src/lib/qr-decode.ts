interface QrGatewayEntry {
  u: string;
  t: string;
  n: string;
  p?: string;
  c?: string;
  m?: 'token' | 'password' | 'pairingCode';
}

interface QrPayload {
  v: number;
  s?: string;
  g: QrGatewayEntry[];
}

export function parseQrPayload(raw: string): QrPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid QR code: not valid JSON');
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Invalid QR code: expected object');
  }

  if (obj.v !== 1) {
    throw new Error(`Unsupported QR version: ${obj.v}`);
  }

  const scopeId = typeof obj.s === 'string' ? obj.s : undefined;

  const gateways = obj.g;
  if (!Array.isArray(gateways) || gateways.length === 0) {
    throw new Error('Invalid QR code: no gateways');
  }

  for (const gw of gateways) {
    if (typeof gw.u !== 'string' || typeof gw.n !== 'string') {
      throw new Error('Invalid QR code: malformed gateway entry');
    }
    if (!gw.u.startsWith('ws://') && !gw.u.startsWith('wss://')) {
      throw new Error('Invalid QR code: gateway URL must use ws:// or wss://');
    }
    if (gw.m !== undefined && gw.m !== 'token' && gw.m !== 'password' && gw.m !== 'pairingCode') {
      throw new Error('Invalid QR code: unsupported gateway auth mode');
    }
    if (gw.t !== undefined && typeof gw.t !== 'string') {
      throw new Error('Invalid QR code: malformed gateway token');
    }
    if (gw.p !== undefined && typeof gw.p !== 'string') {
      throw new Error('Invalid QR code: malformed gateway password');
    }
    if (gw.c !== undefined && typeof gw.c !== 'string') {
      throw new Error('Invalid QR code: malformed gateway pairing code');
    }
    const mode = gw.m ?? 'token';
    if (mode === 'token' && !gw.t) {
      throw new Error('Invalid QR code: missing gateway token');
    }
    if (mode === 'password' && !gw.p) {
      throw new Error('Invalid QR code: missing gateway password');
    }
    if (mode === 'pairingCode' && !gw.c) {
      throw new Error('Invalid QR code: missing gateway pairing code');
    }
  }

  return {
    v: 1,
    s: scopeId,
    g: gateways as QrGatewayEntry[],
  };
}
