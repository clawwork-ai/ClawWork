import type { DeviceIdentity } from './device-identity.js';
import { publicKeyRawBase64Url, signPayload } from './device-identity.js';

interface DeviceConnectPayload {
  id: string;
  publicKey: string;
  signature: string;
  signedAt: number;
  nonce: string;
}

export async function buildDeviceConnectPayload(
  identity: DeviceIdentity,
  nonce: string,
  token?: string,
  params?: {
    clientId?: string;
    clientMode?: string;
    role?: string;
    scopes?: string[];
    platform?: string;
    deviceFamily?: string;
  },
): Promise<DeviceConnectPayload> {
  const signedAtMs = Date.now();
  const clientId = params?.clientId ?? 'clawwork-pwa';
  const clientMode = params?.clientMode ?? 'backend';
  const role = params?.role ?? 'operator';
  const scopes = (
    params?.scopes ?? ['operator.admin', 'operator.write', 'operator.read', 'operator.approvals', 'operator.pairing']
  ).join(',');
  const platform = params?.platform ?? 'pwa';
  const deviceFamily = params?.deviceFamily ?? 'mobile';

  const payloadString = [
    'v3',
    identity.id,
    clientId,
    clientMode,
    role,
    scopes,
    String(signedAtMs),
    token ?? '',
    nonce,
    platform,
    deviceFamily,
  ].join('|');

  const [pubKey, signature] = await Promise.all([
    publicKeyRawBase64Url(identity.publicKey),
    signPayload(identity.privateKey, payloadString),
  ]);

  return {
    id: identity.id,
    publicKey: pubKey,
    signature,
    signedAt: signedAtMs,
    nonce,
  };
}
