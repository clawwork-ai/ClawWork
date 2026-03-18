export type GatewayAuthMode = 'token' | 'password' | 'pairingCode';

export interface GatewayCredentialState {
  token?: string;
  password?: string;
  pairingCode?: string;
}

export interface GatewayFormValidationInput extends GatewayCredentialState {
  mode: GatewayAuthMode;
  name: string;
  url: string;
}

export type GatewayFormErrorKey =
  | 'nameRequired'
  | 'invalidUrl'
  | 'tokenRequired'
  | 'passwordRequired'
  | 'pairingCodeRequired'
  | 'setupCodeInvalid';

export function inferGatewayAuthMode(credentials: GatewayCredentialState): GatewayAuthMode {
  if (credentials.token?.trim()) return 'token';
  if (credentials.password?.trim()) return 'password';
  if (credentials.pairingCode?.trim()) return 'pairingCode';
  return 'token';
}

export function parseGatewaySetupCode(raw: string): { url: string; pairingCode: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));

  try {
    const decoded =
      typeof atob === 'function'
        ? atob(normalized + padding)
        : Buffer.from(normalized + padding, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as { url?: string; bootstrapToken?: string };
    if (typeof parsed.url !== 'string' || typeof parsed.bootstrapToken !== 'string' || !parsed.bootstrapToken.trim()) {
      return null;
    }
    return {
      url: parsed.url,
      pairingCode: parsed.bootstrapToken,
    };
  } catch {
    return null;
  }
}

export function validateGatewayForm(input: GatewayFormValidationInput): GatewayFormErrorKey | null {
  if (!input.name.trim()) return 'nameRequired';

  if (input.mode === 'pairingCode' && !input.pairingCode?.trim()) return 'pairingCodeRequired';

  try {
    new URL(input.url.trim());
  } catch {
    return input.mode === 'pairingCode' ? 'setupCodeInvalid' : 'invalidUrl';
  }

  if (input.mode === 'token' && !input.token?.trim()) return 'tokenRequired';
  if (input.mode === 'password' && !input.password?.trim()) return 'passwordRequired';

  return null;
}
