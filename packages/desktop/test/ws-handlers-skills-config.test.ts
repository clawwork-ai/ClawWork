import { beforeEach, describe, expect, it, vi } from 'vitest';

const handleMap = new Map<string, (...args: unknown[]) => unknown>();

const installSkillMock = vi.fn();
const updateSkillMock = vi.fn();
const getSkillBinsMock = vi.fn();
const getConfigMock = vi.fn();
const setConfigMock = vi.fn();
const patchConfigMock = vi.fn();
const getConfigSchemaMock = vi.fn();
const lookupConfigSchemaMock = vi.fn();

const fakeGatewayClient = {
  isConnected: true,
  installSkill: installSkillMock,
  updateSkill: updateSkillMock,
  getSkillBins: getSkillBinsMock,
  getConfig: getConfigMock,
  setConfig: setConfigMock,
  patchConfig: patchConfigMock,
  getConfigSchema: getConfigSchemaMock,
  lookupConfigSchema: lookupConfigSchemaMock,
};

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: vi.fn(() => []) },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handleMap.set(channel, handler);
    }),
  },
}));

vi.mock('../src/main/ws/index.js', () => ({
  getGatewayClient: vi.fn((id: string) => (id === 'gw-1' ? fakeGatewayClient : null)),
  getAllGatewayClients: vi.fn(() => new Map([['gw-1', fakeGatewayClient]])),
  reconnectGateway: vi.fn(),
}));

vi.mock('../src/main/workspace/config.js', () => ({
  readConfig: vi.fn(() => null),
  ensureDeviceId: vi.fn(() => 'test-device'),
}));

vi.mock('../src/main/debug/index.js', () => ({
  getDebugLogger: vi.fn(() => ({ emit: vi.fn() })),
}));

vi.mock('@clawwork/shared', () => ({
  isClawWorkSession: vi.fn(() => true),
  parseTaskIdFromSessionKey: vi.fn(() => 'task-1'),
  parseAgentIdFromSessionKey: vi.fn(() => 'main'),
}));

vi.mock('@clawwork/core', () => ({
  parseToolArgs: vi.fn(() => ({})),
}));

async function invoke(channel: string, payload: unknown): Promise<unknown> {
  const handler = handleMap.get(channel);
  if (!handler) throw new Error(`no handler registered for ${channel}`);
  return handler({}, payload);
}

describe('ws-handlers: skills + config IPC channels', () => {
  beforeEach(async () => {
    handleMap.clear();
    vi.clearAllMocks();
    fakeGatewayClient.isConnected = true;

    vi.resetModules();
    const { registerWsHandlers } = await import('../src/main/ipc/ws-handlers.js');
    registerWsHandlers();
  });

  it('registers all expected channels', () => {
    const expected = [
      'ws:skills-install',
      'ws:skills-update',
      'ws:skills-bins',
      'ws:config-get',
      'ws:config-set',
      'ws:config-patch',
      'ws:config-schema',
      'ws:config-schema-lookup',
    ];
    for (const ch of expected) {
      expect(handleMap.has(ch), `missing handler for ${ch}`).toBe(true);
    }
  });

  describe('gateway error handling', () => {
    it('returns GATEWAY_NOT_CONNECTED when gateway is disconnected', async () => {
      fakeGatewayClient.isConnected = false;

      const result = await invoke('ws:skills-install', { gatewayId: 'gw-1', source: 'clawhub', slug: 'test' });

      expect(result).toEqual({ ok: false, error: 'gateway not connected', errorCode: 'GATEWAY_NOT_CONNECTED' });
      expect(installSkillMock).not.toHaveBeenCalled();
    });

    it('returns GATEWAY_NOT_CONNECTED when gateway id is unknown', async () => {
      const result = await invoke('ws:config-get', { gatewayId: 'nonexistent' });

      expect(result).toEqual({ ok: false, error: 'gateway not connected', errorCode: 'GATEWAY_NOT_CONNECTED' });
      expect(getConfigMock).not.toHaveBeenCalled();
    });

    it('surfaces gateway error code and details on RPC failure', async () => {
      const err = Object.assign(new Error('install failed'), {
        code: 'INSTALL_ERROR',
        details: { bin: 'npm', reason: 'not found' },
      });
      installSkillMock.mockRejectedValue(err);

      const result = await invoke('ws:skills-install', { gatewayId: 'gw-1', source: 'clawhub', slug: 'broken' });

      expect(result).toEqual({
        ok: false,
        error: 'install failed',
        errorCode: 'INSTALL_ERROR',
        errorDetails: { bin: 'npm', reason: 'not found' },
      });
    });
  });

  describe('ws:skills-install', () => {
    it('forwards clawhub install params without gatewayId', async () => {
      installSkillMock.mockResolvedValue({ ok: true, message: 'installed', stdout: '', stderr: '', code: 0 });

      const result = await invoke('ws:skills-install', {
        gatewayId: 'gw-1',
        source: 'clawhub',
        slug: 'web-search',
        version: '1.0.0',
      });

      const args = installSkillMock.mock.calls[0][0];
      expect(args).toEqual({ source: 'clawhub', slug: 'web-search', version: '1.0.0' });
      expect(args).not.toHaveProperty('gatewayId');
      expect(result).toEqual({
        ok: true,
        result: { ok: true, message: 'installed', stdout: '', stderr: '', code: 0 },
      });
    });

    it('forwards direct install params without gatewayId', async () => {
      installSkillMock.mockResolvedValue({ ok: true, message: 'done', stdout: '', stderr: '', code: 0 });

      await invoke('ws:skills-install', {
        gatewayId: 'gw-1',
        name: 'my-skill',
        installId: 'brew',
        timeoutMs: 30_000,
      });

      const args = installSkillMock.mock.calls[0][0];
      expect(args).toEqual({ name: 'my-skill', installId: 'brew', timeoutMs: 30_000 });
      expect(args).not.toHaveProperty('gatewayId');
    });

    it('forwards dangerouslyForceUnsafeInstall flag', async () => {
      installSkillMock.mockResolvedValue({ ok: true, message: 'forced', stdout: '', stderr: '', code: 0 });

      await invoke('ws:skills-install', {
        gatewayId: 'gw-1',
        name: 'risky-skill',
        installId: 'npm',
        dangerouslyForceUnsafeInstall: true,
      });

      expect(installSkillMock.mock.calls[0][0]).toMatchObject({ dangerouslyForceUnsafeInstall: true });
    });
  });

  describe('ws:skills-update', () => {
    it('forwards config update params without gatewayId', async () => {
      updateSkillMock.mockResolvedValue({ ok: true, skillKey: 'web-search', config: { enabled: true } });

      await invoke('ws:skills-update', {
        gatewayId: 'gw-1',
        skillKey: 'web-search',
        enabled: true,
        apiKey: 'sk-xxx',
        env: { NODE_ENV: 'production' },
      });

      const args = updateSkillMock.mock.calls[0][0];
      expect(args).toEqual({
        skillKey: 'web-search',
        enabled: true,
        apiKey: 'sk-xxx',
        env: { NODE_ENV: 'production' },
      });
      expect(args).not.toHaveProperty('gatewayId');
    });

    it('forwards clawhub update-all params without gatewayId', async () => {
      updateSkillMock.mockResolvedValue({ ok: true });

      await invoke('ws:skills-update', { gatewayId: 'gw-1', source: 'clawhub', all: true });

      const args = updateSkillMock.mock.calls[0][0];
      expect(args).toEqual({ source: 'clawhub', all: true });
      expect(args).not.toHaveProperty('gatewayId');
    });
  });

  describe('ws:skills-bins', () => {
    it('calls getSkillBins with no arguments', async () => {
      getSkillBinsMock.mockResolvedValue({ bins: ['node', 'python3', 'brew'] });

      const result = await invoke('ws:skills-bins', { gatewayId: 'gw-1' });

      expect(getSkillBinsMock).toHaveBeenCalledWith();
      expect(result).toEqual({ ok: true, result: { bins: ['node', 'python3', 'brew'] } });
    });
  });

  describe('ws:config-get', () => {
    it('calls getConfig with no arguments', async () => {
      const snapshot = { raw: '{}', hash: 'abc123', config: { model: 'claude' }, path: '/etc/openclaw.json5' };
      getConfigMock.mockResolvedValue(snapshot);

      const result = await invoke('ws:config-get', { gatewayId: 'gw-1' });

      expect(getConfigMock).toHaveBeenCalledWith();
      expect(result).toEqual({ ok: true, result: snapshot });
    });
  });

  describe('ws:config-set', () => {
    it('passes raw and baseHash without gatewayId', async () => {
      setConfigMock.mockResolvedValue({ ok: true, path: '/etc/openclaw.json5', config: {} });

      await invoke('ws:config-set', {
        gatewayId: 'gw-1',
        raw: '{ model: "claude" }',
        baseHash: 'abc123',
      });

      const args = setConfigMock.mock.calls[0][0];
      expect(args).toEqual({ raw: '{ model: "claude" }', baseHash: 'abc123' });
      expect(args).not.toHaveProperty('gatewayId');
    });

    it('passes undefined baseHash when omitted', async () => {
      setConfigMock.mockResolvedValue({ ok: true, path: '/etc/openclaw.json5', config: {} });

      await invoke('ws:config-set', { gatewayId: 'gw-1', raw: '{}' });

      expect(setConfigMock.mock.calls[0][0]).toEqual({ raw: '{}', baseHash: undefined });
    });
  });

  describe('ws:config-patch', () => {
    it('passes all fields explicitly without gatewayId', async () => {
      patchConfigMock.mockResolvedValue({ ok: true, noop: false, path: '/etc/openclaw.json5', config: {} });

      await invoke('ws:config-patch', {
        gatewayId: 'gw-1',
        raw: '{ model: "claude" }',
        baseHash: 'abc123',
        sessionKey: 'agent:main:clawwork:task:t1',
        note: 'enable skill',
        restartDelayMs: 2000,
      });

      const args = patchConfigMock.mock.calls[0][0];
      expect(args).toEqual({
        raw: '{ model: "claude" }',
        baseHash: 'abc123',
        sessionKey: 'agent:main:clawwork:task:t1',
        note: 'enable skill',
        restartDelayMs: 2000,
      });
      expect(args).not.toHaveProperty('gatewayId');
    });

    it('passes undefined for omitted optional fields', async () => {
      patchConfigMock.mockResolvedValue({ ok: true, noop: true, path: '/etc/openclaw.json5', config: {} });

      await invoke('ws:config-patch', { gatewayId: 'gw-1', raw: '{}' });

      expect(patchConfigMock.mock.calls[0][0]).toEqual({
        raw: '{}',
        baseHash: undefined,
        sessionKey: undefined,
        note: undefined,
        restartDelayMs: undefined,
      });
    });
  });

  describe('ws:config-schema', () => {
    it('calls getConfigSchema with no arguments', async () => {
      const schema = { schema: { type: 'object' }, uiHints: {}, version: '1.0', generatedAt: '2026-04-02' };
      getConfigSchemaMock.mockResolvedValue(schema);

      const result = await invoke('ws:config-schema', { gatewayId: 'gw-1' });

      expect(getConfigSchemaMock).toHaveBeenCalledWith();
      expect(result).toEqual({ ok: true, result: schema });
    });
  });

  describe('ws:config-schema-lookup', () => {
    it('passes path to lookupConfigSchema without gatewayId', async () => {
      const lookupResult = {
        path: 'model',
        schema: { type: 'string' },
        hint: { widget: 'select' },
        children: [],
      };
      lookupConfigSchemaMock.mockResolvedValue(lookupResult);

      const result = await invoke('ws:config-schema-lookup', { gatewayId: 'gw-1', path: 'model' });

      expect(lookupConfigSchemaMock).toHaveBeenCalledWith('model');
      expect(result).toEqual({ ok: true, result: lookupResult });
    });
  });
});
