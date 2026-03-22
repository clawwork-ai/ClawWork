import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const injectMock = vi.hoisted(() => vi.fn());
const requireMock = vi.hoisted(() => vi.fn(() => ({ inject: injectMock })));

vi.mock('node:module', () => ({
  createRequire: vi.fn(() => requireMock),
}));

describe('ensureGatewayWindowsSystemTrust', () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');

  beforeEach(() => {
    vi.resetModules();
    requireMock.mockClear();
    injectMock.mockClear();
  });

  afterEach(() => {
    if (platformDescriptor) {
      Object.defineProperty(process, 'platform', platformDescriptor);
    }
  });

  it('loads win-ca once on Windows and enables secure context injection', async () => {
    Object.defineProperty(process, 'platform', { configurable: true, value: 'win32' });

    const { ensureGatewayWindowsSystemTrust } = await import('../src/main/ws/tls-trust.js');

    ensureGatewayWindowsSystemTrust();
    ensureGatewayWindowsSystemTrust();

    expect(requireMock).toHaveBeenCalledTimes(1);
    expect(requireMock).toHaveBeenCalledWith('win-ca');
    expect(injectMock).toHaveBeenCalledTimes(1);
    expect(injectMock).toHaveBeenCalledWith('+');
  });

  it('skips win-ca outside Windows', async () => {
    Object.defineProperty(process, 'platform', { configurable: true, value: 'darwin' });

    const { ensureGatewayWindowsSystemTrust } = await import('../src/main/ws/tls-trust.js');

    ensureGatewayWindowsSystemTrust();

    expect(requireMock).not.toHaveBeenCalled();
    expect(injectMock).not.toHaveBeenCalled();
  });
});
