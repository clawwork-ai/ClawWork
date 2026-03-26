const ED25519_SPKI_PREFIX_LENGTH = 12;

export interface DeviceIdentity {
  id: string;
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

interface StoredDeviceIdentityRecord {
  id: string;
  publicKeyBase64: string;
  privateKeyBase64: string;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function base64Decode(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64Encode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export async function generateDeviceIdentity(): Promise<DeviceIdentity> {
  const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const raw = new Uint8Array(spki).slice(ED25519_SPKI_PREFIX_LENGTH);
  const hash = await crypto.subtle.digest('SHA-256', raw);
  const view = new Uint8Array(hash);
  let id = '';
  for (let i = 0; i < view.byteLength; i++) {
    id += view[i]!.toString(16).padStart(2, '0');
  }
  return { id, publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
}

export async function importDeviceIdentity(record: StoredDeviceIdentityRecord): Promise<DeviceIdentity> {
  const publicKeyBytes = base64Decode(record.publicKeyBase64);
  const privateKeyBytes = base64Decode(record.privateKeyBase64);

  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBytes.buffer as ArrayBuffer,
    { name: 'Ed25519' },
    true,
    ['verify'],
  );

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes.buffer as ArrayBuffer,
    { name: 'Ed25519' },
    true,
    ['sign'],
  );

  return { id: record.id, publicKey, privateKey };
}

export async function exportDeviceIdentity(identity: DeviceIdentity): Promise<StoredDeviceIdentityRecord> {
  const spki = await crypto.subtle.exportKey('spki', identity.publicKey);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', identity.privateKey);
  return {
    id: identity.id,
    publicKeyBase64: base64Encode(spki),
    privateKeyBase64: base64Encode(pkcs8),
  };
}

export async function publicKeyRawBase64Url(publicKey: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey('spki', publicKey);
  const raw = new Uint8Array(spki).slice(ED25519_SPKI_PREFIX_LENGTH);
  return base64UrlEncode(raw.buffer as ArrayBuffer);
}

export async function signPayload(privateKey: CryptoKey, payload: string): Promise<string> {
  const encoded = new TextEncoder().encode(payload);
  const signature = await crypto.subtle.sign('Ed25519', privateKey, encoded);
  return base64UrlEncode(signature);
}
