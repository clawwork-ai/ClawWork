import { createRequire } from 'node:module';
import { getDebugLogger } from '../debug/index.js';

type WinCaModule = {
  inject?: (mode: '+' | boolean) => void;
};

let windowsSystemTrustAttempted = false;

export function ensureGatewayWindowsSystemTrust(): void {
  if (process.platform !== 'win32' || windowsSystemTrustAttempted) {
    return;
  }

  windowsSystemTrustAttempted = true;

  try {
    const require = createRequire(import.meta.url);
    const winCa = require('win-ca') as WinCaModule;

    if (typeof winCa.inject !== 'function') {
      throw new Error('win-ca inject is unavailable');
    }

    winCa.inject('+');

    getDebugLogger().info({
      domain: 'gateway',
      event: 'gateway.tls.system-trust.enabled',
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    getDebugLogger().warn({
      domain: 'gateway',
      event: 'gateway.tls.system-trust.failed',
      error: { name: err.name, message: err.message, stack: err.stack },
    });
  }
}
