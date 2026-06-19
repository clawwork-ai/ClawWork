import { describe, expect, it } from 'vitest';
import { createUiStore } from '../src/stores/ui-store.js';

describe('gateway registry', () => {
  it('updateGateway keeps registry and legacy maps in sync', () => {
    const store = createUiStore({
      updateSettings: async () => ({}),
      changeLanguage: () => {},
      storage: { get: () => null, set: () => {} },
    });

    store.getState().updateGateway('gw-1', {
      status: 'connected',
      version: '1.2.3',
      info: { id: 'gw-1', name: 'Home' },
      models: [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }],
      agents: { agents: [], defaultId: 'main' },
    });

    const s = store.getState();
    expect(s.gatewayRegistry['gw-1']?.status).toBe('connected');
    expect(s.gatewayStatusMap['gw-1']).toBe('connected');
    expect(s.gatewayVersionMap['gw-1']).toBe('1.2.3');
    expect(s.gatewayInfoMap['gw-1']?.name).toBe('Home');
    expect(s.modelCatalogByGateway['gw-1']).toHaveLength(1);
    expect(s.getGatewayState('gw-1').status).toBe('connected');
  });

  it('setGatewayStatusByGateway updates registry entry', () => {
    const store = createUiStore({
      updateSettings: async () => ({}),
      changeLanguage: () => {},
      storage: { get: () => null, set: () => {} },
    });

    store.getState().setGatewayStatusByGateway('gw-2', 'connecting');
    expect(store.getState().gatewayRegistry['gw-2']?.status).toBe('connecting');
    expect(store.getState().gatewayStatusMap['gw-2']).toBe('connecting');
  });
});
