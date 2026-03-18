import { describe, expect, it } from 'vitest';
import { inferGatewayAuthMode, parseGatewaySetupCode, validateGatewayForm } from '../src/renderer/lib/gateway-auth.js';
import { buildGatewayAuth } from '../src/main/workspace/config.js';

describe('gateway auth helpers', () => {
  it('parses setup codes that omit base64 padding', () => {
    const payload = JSON.stringify({
      url: 'wss://gateway.example.com/ws',
      bootstrapToken: 'bootstrap-123',
    });
    const setupCode = Buffer.from(payload, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    expect(parseGatewaySetupCode(setupCode)).toEqual({
      url: 'wss://gateway.example.com/ws',
      pairingCode: 'bootstrap-123',
    });
  });

  it('rejects setup codes with empty bootstrap tokens', () => {
    const payload = JSON.stringify({
      url: 'wss://gateway.example.com/ws',
      bootstrapToken: '',
    });
    const setupCode = Buffer.from(payload, 'utf8').toString('base64');

    expect(parseGatewaySetupCode(setupCode)).toBeNull();
  });

  it('defaults auth mode to token and preserves explicit credential precedence', () => {
    expect(inferGatewayAuthMode({})).toBe('token');
    expect(inferGatewayAuthMode({ token: 'secret', password: 'pw', pairingCode: 'pair' })).toBe('token');
    expect(inferGatewayAuthMode({ password: 'pw', pairingCode: 'pair' })).toBe('password');
    expect(inferGatewayAuthMode({ pairingCode: 'pair' })).toBe('pairingCode');
  });

  it('requires token and password fields for their respective auth modes', () => {
    expect(
      validateGatewayForm({
        mode: 'token',
        name: 'Remote',
        url: '',
        token: '',
        password: '',
        pairingCode: '',
      }),
    ).toBe('invalidUrl');

    expect(
      validateGatewayForm({
        mode: 'token',
        name: 'Remote',
        url: 'wss://gateway.example.com/ws',
        token: '',
        password: '',
        pairingCode: '',
      }),
    ).toBe('tokenRequired');

    expect(
      validateGatewayForm({
        mode: 'password',
        name: 'Remote',
        url: 'wss://gateway.example.com/ws',
        token: '',
        password: '',
        pairingCode: '',
      }),
    ).toBe('passwordRequired');

    expect(
      validateGatewayForm({
        mode: 'pairingCode',
        name: 'Remote',
        url: '',
        token: '',
        password: '',
        pairingCode: '',
      }),
    ).toBe('pairingCodeRequired');

    expect(
      validateGatewayForm({
        mode: 'pairingCode',
        name: 'Remote',
        url: '',
        token: '',
        password: '',
        pairingCode: 'pair-123',
      }),
    ).toBe('setupCodeInvalid');
  });

  it('does not silently fall through to another credential when auth mode is explicit', () => {
    expect(
      buildGatewayAuth({
        id: 'gw-1',
        name: 'Gateway',
        url: 'wss://gateway.example.com/ws',
        authMode: 'pairingCode',
        token: 'shared-token',
      }),
    ).toEqual({ bootstrapToken: '' });
  });
});
