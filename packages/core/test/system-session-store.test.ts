import { describe, it, expect } from 'vitest';
import { createSystemSessionStore } from '../src/stores/system-session-store';

function setup() {
  const store = createSystemSessionStore();
  return store;
}

describe('system session store', () => {
  it('starts in idle state with no session', () => {
    const store = setup();
    const s = store.getState();
    expect(s.status).toBe('idle');
    expect(s.sessionKey).toBeNull();
    expect(s.messages).toEqual([]);
  });

  it('open() transitions to active with session metadata', () => {
    const store = setup();
    store.getState().open({
      sessionKey: 'clawwork:system:test:abc-123',
      gatewayId: 'gw-1',
      agentId: 'main',
      purpose: 'test',
    });
    const s = store.getState();
    expect(s.status).toBe('active');
    expect(s.sessionKey).toBe('clawwork:system:test:abc-123');
    expect(s.gatewayId).toBe('gw-1');
    expect(s.agentId).toBe('main');
    expect(s.purpose).toBe('test');
    expect(s.error).toBeNull();
  });

  it('appendMessage() adds messages in order', () => {
    const store = setup();
    store.getState().open({
      sessionKey: 'k',
      gatewayId: 'gw',
      agentId: 'main',
      purpose: 'test',
    });
    store.getState().appendMessage({ role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00Z' });
    store.getState().appendMessage({ role: 'assistant', content: '', timestamp: '2026-01-01T00:00:01Z' });
    expect(store.getState().messages).toHaveLength(2);
    expect(store.getState().messages[0].role).toBe('user');
    expect(store.getState().messages[1].role).toBe('assistant');
  });

  it('updateLastAssistant() updates the last assistant message content', () => {
    const store = setup();
    store.getState().open({ sessionKey: 'k', gatewayId: 'gw', agentId: 'main', purpose: 'test' });
    store.getState().appendMessage({ role: 'user', content: 'q', timestamp: 't1' });
    store.getState().appendMessage({ role: 'assistant', content: '', timestamp: 't2' });
    store.getState().updateLastAssistant('streaming...');
    expect(store.getState().messages[1].content).toBe('streaming...');
    store.getState().updateLastAssistant('streaming... done');
    expect(store.getState().messages[1].content).toBe('streaming... done');
  });

  it('updateLastAssistant() is a no-op when no assistant message exists', () => {
    const store = setup();
    store.getState().open({ sessionKey: 'k', gatewayId: 'gw', agentId: 'main', purpose: 'test' });
    store.getState().appendMessage({ role: 'user', content: 'q', timestamp: 't1' });
    store.getState().updateLastAssistant('oops');
    expect(store.getState().messages).toHaveLength(1);
    expect(store.getState().messages[0].content).toBe('q');
  });

  it('setError() sets error and transitions status to error', () => {
    const store = setup();
    store.getState().open({ sessionKey: 'k', gatewayId: 'gw', agentId: 'main', purpose: 'test' });
    store.getState().setError('something broke');
    expect(store.getState().status).toBe('error');
    expect(store.getState().error).toBe('something broke');
  });

  it('close() resets everything to initial state', () => {
    const store = setup();
    store.getState().open({ sessionKey: 'k', gatewayId: 'gw', agentId: 'main', purpose: 'test' });
    store.getState().appendMessage({ role: 'user', content: 'hi', timestamp: 't1' });
    store.getState().setStatus('streaming');
    store.getState().close();
    const s = store.getState();
    expect(s.status).toBe('idle');
    expect(s.sessionKey).toBeNull();
    expect(s.gatewayId).toBeNull();
    expect(s.messages).toEqual([]);
    expect(s.error).toBeNull();
  });
});
