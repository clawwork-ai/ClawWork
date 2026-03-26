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
): Promise<DeviceConnectPayload> {
  const signedAtMs = Date.now();
  const scopes = 'user,chat';

  const payloadString = [
    'v3',
    identity.id,
    'clawwork-pwa',
    'pwa',
    'user',
    scopes,
    String(signedAtMs),
    token ?? '',
    nonce,
    'pwa',
    'mobile',
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
