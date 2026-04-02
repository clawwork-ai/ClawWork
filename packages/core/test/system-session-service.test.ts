import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSystemSessionStore } from '../src/stores/system-session-store';
import { createSystemSessionService } from '../src/services/system-session-service';
import type { GatewayEvent } from '../src/ports/gateway-transport';

type EventCallback = (data: GatewayEvent) => void;

function setup() {
  const storeApi = createSystemSessionStore();
  const listeners = new Set<EventCallback>();

  const gateway = {
    createSession: vi.fn().mockResolvedValue({ ok: true }),
    deleteSession: vi.fn().mockResolvedValue({ ok: true }),
    sendMessage: vi.fn().mockResolvedValue({ ok: true }),
    onGatewayEvent: vi.fn((cb: EventCallback) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    }),
  };

  const service = createSystemSessionService({
    gateway,
    getStore: () => storeApi.getState(),
  });

  function emitGatewayEvent(data: GatewayEvent) {
    for (const cb of listeners) cb(data);
  }

  return { storeApi, gateway, service, emitGatewayEvent, listeners };
}

describe('system session service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('start() creates a session and registers a listener', async () => {
    const { service, gateway, storeApi, listeners } = setup();

    const res = await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });

    expect(res.ok).toBe(true);
    expect(gateway.createSession).toHaveBeenCalledOnce();
    const createArgs = gateway.createSession.mock.calls[0];
    expect(createArgs[0]).toBe('gw-1');
    expect(createArgs[1].key).toMatch(/^agent:main:clawwork:system:test:/);
    expect(createArgs[1].agentId).toBe('main');
    expect(listeners.size).toBe(1);

    const s = storeApi.getState();
    expect(s.status).toBe('active');
    expect(s.sessionKey).toBe(createArgs[1].key);
  });

  it('start() with initialMessage sends the message immediately', async () => {
    const { service, gateway, storeApi } = setup();

    await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test', initialMessage: 'hello' });

    expect(gateway.sendMessage).toHaveBeenCalledOnce();
    const s = storeApi.getState();
    expect(s.messages).toHaveLength(2);
    expect(s.messages[0]).toMatchObject({ role: 'user', content: 'hello' });
    expect(s.messages[1]).toMatchObject({ role: 'assistant', content: '' });
    expect(s.status).toBe('streaming');
  });

  it('start() cleans up on gateway createSession failure', async () => {
    const { service, gateway, storeApi, listeners } = setup();
    gateway.createSession.mockResolvedValue({ ok: false, error: 'refused' });

    const res = await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });

    expect(res.ok).toBe(false);
    expect(res.error).toBe('refused');
    expect(storeApi.getState().status).toBe('idle');
    expect(storeApi.getState().sessionKey).toBeNull();
    expect(listeners.size).toBe(0);
  });

  it('start() rejects when a session is already active', async () => {
    const { service } = setup();
    await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });

    const res = await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'other' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('system session already active');
  });

  it('send() appends user + assistant placeholder and calls gateway', async () => {
    const { service, gateway, storeApi } = setup();
    await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });

    const res = await service.send('question');

    expect(res.ok).toBe(true);
    expect(gateway.sendMessage).toHaveBeenCalledOnce();
    const msgs = storeApi.getState().messages;
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toMatchObject({ role: 'user', content: 'question' });
    expect(msgs[1]).toMatchObject({ role: 'assistant', content: '' });
    expect(storeApi.getState().status).toBe('streaming');
  });

  it('send() rejects when no session is active', async () => {
    const { service } = setup();
    const res = await service.send('hello');
    expect(res.ok).toBe(false);
  });

  describe('gateway event handling', () => {
    it('delta events update the assistant message and set streaming', async () => {
      const { service, storeApi, emitGatewayEvent } = setup();
      await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });
      await service.send('go');

      const sessionKey = storeApi.getState().sessionKey!;
      emitGatewayEvent({
        event: 'chat',
        gatewayId: 'gw-1',
        payload: { sessionKey, state: 'delta', text: 'Hel' } as unknown as Record<string, unknown>,
      });

      expect(storeApi.getState().messages[1].content).toBe('Hel');
      expect(storeApi.getState().status).toBe('streaming');

      emitGatewayEvent({
        event: 'chat',
        gatewayId: 'gw-1',
        payload: { sessionKey, state: 'delta', text: 'Hello world' } as unknown as Record<string, unknown>,
      });

      expect(storeApi.getState().messages[1].content).toBe('Hello world');
    });

    it('final event finalizes the assistant message and sets active', async () => {
      const { service, storeApi, emitGatewayEvent } = setup();
      await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });
      await service.send('go');

      const sessionKey = storeApi.getState().sessionKey!;
      emitGatewayEvent({
        event: 'chat',
        gatewayId: 'gw-1',
        payload: { sessionKey, state: 'delta', text: 'partial ' } as unknown as Record<string, unknown>,
      });
      emitGatewayEvent({
        event: 'chat',
        gatewayId: 'gw-1',
        payload: { sessionKey, state: 'final', text: 'partial answer complete' } as unknown as Record<string, unknown>,
      });

      expect(storeApi.getState().messages[1].content).toBe('partial answer complete');
      expect(storeApi.getState().status).toBe('active');
    });

    it('error event sets error status', async () => {
      const { service, storeApi, emitGatewayEvent } = setup();
      await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });
      await service.send('go');

      const sessionKey = storeApi.getState().sessionKey!;
      emitGatewayEvent({
        event: 'chat',
        gatewayId: 'gw-1',
        payload: { sessionKey, state: 'error', errorMessage: 'model overloaded' } as unknown as Record<string, unknown>,
      });

      expect(storeApi.getState().status).toBe('error');
      expect(storeApi.getState().error).toBe('model overloaded');
    });

    it('ignores events for other session keys', async () => {
      const { service, storeApi, emitGatewayEvent } = setup();
      await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });
      await service.send('go');

      emitGatewayEvent({
        event: 'chat',
        gatewayId: 'gw-1',
        payload: {
          sessionKey: 'agent:main:clawwork:task:task-1',
          state: 'delta',
          text: 'leaked',
        } as unknown as Record<string, unknown>,
      });

      expect(storeApi.getState().messages[1].content).toBe('');
    });

    it('ignores non-chat events', async () => {
      const { service, storeApi, emitGatewayEvent } = setup();
      await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });
      await service.send('go');

      const sessionKey = storeApi.getState().sessionKey!;
      emitGatewayEvent({
        event: 'agent',
        gatewayId: 'gw-1',
        payload: { sessionKey, state: 'delta', text: 'ignored' } as unknown as Record<string, unknown>,
      });

      expect(storeApi.getState().messages[1].content).toBe('');
    });
  });

  it('end() removes listener, deletes session on gateway, and resets store', async () => {
    const { service, gateway, storeApi, listeners } = setup();
    await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });
    const sessionKey = storeApi.getState().sessionKey!;

    await service.end();

    expect(gateway.deleteSession).toHaveBeenCalledWith('gw-1', sessionKey);
    expect(listeners.size).toBe(0);
    expect(storeApi.getState().status).toBe('idle');
    expect(storeApi.getState().sessionKey).toBeNull();
    expect(storeApi.getState().messages).toEqual([]);
  });

  it('abort() cleans up without calling deleteSession', () => {
    const { service, gateway, storeApi, listeners } = setup();
    service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'test' });

    service.abort();

    expect(gateway.deleteSession).not.toHaveBeenCalled();
    expect(listeners.size).toBe(0);
    expect(storeApi.getState().status).toBe('idle');
  });

  it('full lifecycle: start → send → receive → end', async () => {
    const { service, storeApi, emitGatewayEvent } = setup();

    await service.start({ gatewayId: 'gw-1', agentId: 'main', purpose: 'agent-scaffold' });
    expect(storeApi.getState().purpose).toBe('agent-scaffold');

    await service.send('Create a Python assistant');
    const sessionKey = storeApi.getState().sessionKey!;

    emitGatewayEvent({
      event: 'chat',
      gatewayId: 'gw-1',
      payload: { sessionKey, state: 'delta', text: 'Creating' } as unknown as Record<string, unknown>,
    });
    emitGatewayEvent({
      event: 'chat',
      gatewayId: 'gw-1',
      payload: {
        sessionKey,
        state: 'final',
        text: 'Creating your Python assistant...',
      } as unknown as Record<string, unknown>,
    });

    expect(storeApi.getState().messages[1].content).toBe('Creating your Python assistant...');
    expect(storeApi.getState().status).toBe('active');

    await service.end();
    expect(storeApi.getState().status).toBe('idle');
    expect(storeApi.getState().messages).toEqual([]);
  });
});
