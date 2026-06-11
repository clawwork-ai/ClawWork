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
const getChatHistoryMock = vi.fn();
const listSessionsMock = vi.fn();
const listSessionsBySpawnerMock = vi.fn();

const fakeGatewayClient = {
  isConnected: true,
  httpBase: 'http://127.0.0.1:18789',
  installSkill: installSkillMock,
  updateSkill: updateSkillMock,
  getSkillBins: getSkillBinsMock,
  getConfig: getConfigMock,
  setConfig: setConfigMock,
  patchConfig: patchConfigMock,
  getConfigSchema: getConfigSchemaMock,
  lookupConfigSchema: lookupConfigSchemaMock,
  getChatHistory: getChatHistoryMock,
  listSessions: listSessionsMock,
  listSessionsBySpawner: listSessionsBySpawnerMock,
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
  getDebugLogger: vi.fn(() => ({ emit: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
}));

vi.mock('@clawwork/shared', () => ({
  isClawWorkSession: vi.fn(() => true),
  isSubagentSession: vi.fn((key: string) => key.includes(':subagent:')),
  isSystemSession: vi.fn((key: string) => key.includes(':system:')),
  parseTaskIdFromSessionKey: vi.fn((key: string) => (key.includes('clawwork:task:') ? 'task-1' : null)),
  parseAgentIdFromSessionKey: vi.fn(() => 'main'),
}));

vi.mock('@clawwork/core', () => ({
  normalizeContentBlocks: vi.fn((blocks) => ({
    content: blocks
      .filter((block: { type?: string; text?: string }) => block.type === 'text' && block.text)
      .map((block: { text: string }) => block.text)
      .join(''),
  })),
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
    getChatHistoryMock.mockReset();
    listSessionsMock.mockReset();
    listSessionsBySpawnerMock.mockReset();
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

  describe('ws:chat-history', () => {
    it('resolves only OpenClaw media paths against the gateway origin', async () => {
      getChatHistoryMock.mockResolvedValue({
        messages: [
          {
            role: 'assistant',
            content: [
              { type: 'image', url: '/media/out.png', openUrl: '/api/chat/media/outgoing/open.png' },
              { type: 'image', url: '/Users/x/out.png', openUrl: '/tmp/open.png' },
              { type: 'image', url: '/__openclaw__/media/screenshot.png' },
            ],
          },
        ],
      });

      const response = (await invoke('ws:chat-history', {
        gatewayId: 'gw-1',
        sessionKey: 'agent:main:clawwork:task:t1',
      })) as { ok: boolean; result: { messages: { content: Record<string, unknown>[] }[] } };

      expect(response.ok).toBe(true);
      const content = response.result.messages[0].content;
      expect(content[0]).toMatchObject({
        url: 'http://127.0.0.1:18789/media/out.png',
        openUrl: 'http://127.0.0.1:18789/api/chat/media/outgoing/open.png',
      });
      expect(content[1]).toMatchObject({ url: '/Users/x/out.png', openUrl: '/tmp/open.png' });
      expect(content[2]).toMatchObject({ url: 'http://127.0.0.1:18789/__openclaw__/media/screenshot.png' });
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

  describe('ws:sync-sessions', () => {
    it('passes selected agent list parameters and imports native OpenClaw sessions', async () => {
      listSessionsMock.mockResolvedValue({
        sessions: [
          {
            key: 'openclaw:session:abc',
            agentId: 'agent-a',
            workspace: '/mnt/c/remote/work',
            updatedAt: Date.parse('2026-04-02T10:00:00.000Z'),
            label: 'Native OpenClaw session',
          },
        ],
      });
      getChatHistoryMock.mockResolvedValue({
        messages: [
          {
            role: 'user',
            timestamp: Date.parse('2026-04-02T09:59:00.000Z'),
            content: [{ type: 'text', text: 'hello from openclaw' }],
          },
        ],
      });

      const result = (await invoke('ws:sync-sessions', {
        gatewayId: 'gw-1',
        agentId: 'agent-a',
        workspace: 'C:\\work',
      })) as {
        ok: boolean;
        discovered?: Array<{ taskId: string; sessionKey: string; agentId: string; title: string }>;
      };

      expect(listSessionsMock).toHaveBeenCalledWith({ agentId: 'agent-a' });
      expect(getChatHistoryMock).toHaveBeenCalledWith('openclaw:session:abc', 200);
      expect(result.ok).toBe(true);
      expect(result.discovered).toEqual([
        expect.objectContaining({
          taskId: expect.stringMatching(/^native-[a-f0-9]{24}$/),
          sessionKey: 'openclaw:session:abc',
          agentId: 'agent-a',
          title: 'Native OpenClaw session',
        }),
      ]);
    });

    it('imports sessions when the gateway returns a bare array payload', async () => {
      listSessionsMock.mockResolvedValue([
        {
          sessionKey: 'agent:agent-b:main',
          title: 'Bare array session',
          updatedAt: 1_775_120_400,
        },
      ]);
      getChatHistoryMock.mockResolvedValue({
        messages: [
          {
            role: 'user',
            ts: 1_775_120_399,
            content: 'string chat history content',
          },
        ],
      });

      const result = (await invoke('ws:sync-sessions', { gatewayId: 'gw-1', agentId: 'agent-b' })) as {
        ok: boolean;
        discovered?: Array<{ sessionKey: string; agentId: string; title: string; messages: Array<{ content: string }> }>;
      };

      expect(listSessionsMock).toHaveBeenCalledWith({ agentId: 'agent-b' });
      expect(getChatHistoryMock).toHaveBeenCalledWith('agent:agent-b:main', 200);
      expect(result.ok).toBe(true);
      expect(result.discovered).toEqual([
        expect.objectContaining({
          sessionKey: 'agent:agent-b:main',
          agentId: 'agent-b',
          title: 'Bare array session',
          messages: [expect.objectContaining({ content: 'string chat history content' })],
        }),
      ]);
    });

    it('imports sessions when the gateway returns an object keyed by session id', async () => {
      listSessionsMock.mockResolvedValue({
        'agent:agent-c:main': {
          displayName: 'Mapped session',
          updatedAt: Date.parse('2026-04-02T10:00:00.000Z'),
        },
        count: 1,
        path: '/tmp/openclaw-sessions.json',
      });
      getChatHistoryMock.mockResolvedValue({ messages: [] });

      const result = (await invoke('ws:sync-sessions', { gatewayId: 'gw-1', agentId: 'agent-c' })) as {
        ok: boolean;
        discovered?: Array<{ sessionKey: string; agentId: string; title: string }>;
      };

      expect(getChatHistoryMock).toHaveBeenCalledWith('agent:agent-c:main', 200);
      expect(result.ok).toBe(true);
      expect(result.discovered).toEqual([
        expect.objectContaining({
          sessionKey: 'agent:agent-c:main',
          agentId: 'agent-c',
          title: 'Mapped session',
        }),
      ]);
    });

    it('does not import spawned, system, or subagent sessions', async () => {
      listSessionsMock.mockResolvedValue({
        sessions: [
          {
            key: 'openclaw:session:spawned',
            spawnedBy: 'openclaw:session:parent',
            updatedAt: Date.parse('2026-04-02T10:00:00.000Z'),
          },
          {
            key: 'agent:agent-a:clawwork:system:setup:1',
            updatedAt: Date.parse('2026-04-02T10:00:00.000Z'),
          },
          {
            key: 'agent:agent-a:clawwork:subagent:child',
            updatedAt: Date.parse('2026-04-02T10:00:00.000Z'),
          },
        ],
      });

      const result = (await invoke('ws:sync-sessions', { gatewayId: 'gw-1', agentId: 'agent-a' })) as {
        ok: boolean;
        discovered?: unknown[];
      };

      expect(listSessionsMock).toHaveBeenCalledWith({ agentId: 'agent-a' });
      expect(getChatHistoryMock).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true, discovered: [] });
    });
  });

  describe('ws:list-sessions-by-spawner', () => {
    it('rejects missing spawnedBy before contacting the gateway', async () => {
      const result = await invoke('ws:list-sessions-by-spawner', { gatewayId: 'gw-1', spawnedBy: '' });

      expect(result).toEqual({ ok: false, error: 'invalid spawnedBy parameter' });
      expect(listSessionsBySpawnerMock).not.toHaveBeenCalled();
    });

    it('rejects non-string spawnedBy before contacting the gateway', async () => {
      const result = await invoke('ws:list-sessions-by-spawner', {
        gatewayId: 'gw-1',
        spawnedBy: 123 as unknown as string,
      });

      expect(result).toEqual({ ok: false, error: 'invalid spawnedBy parameter' });
      expect(listSessionsBySpawnerMock).not.toHaveBeenCalled();
    });

    it('forwards valid spawnedBy to listSessionsBySpawner', async () => {
      listSessionsBySpawnerMock.mockResolvedValue({ sessions: [] });

      const result = await invoke('ws:list-sessions-by-spawner', {
        gatewayId: 'gw-1',
        spawnedBy: 'agent:main:clawwork:task:task-1',
      });

      expect(listSessionsBySpawnerMock).toHaveBeenCalledWith('agent:main:clawwork:task:task-1');
      expect(result).toEqual({ ok: true, result: { sessions: [] } });
    });
  });
});
