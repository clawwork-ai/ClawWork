import { describe, expect, it, vi } from 'vitest';
import { createAgentWithRollback } from '../src/renderer/lib/agent-builder';

describe('createAgentWithRollback', () => {
  it('rolls back the created agent when model update fails', async () => {
    const api = {
      createAgent: vi.fn(async () => ({ ok: true, result: { agentId: 'agent-1' } })),
      updateAgent: vi.fn(async () => ({ ok: false, error: 'invalid model' })),
      deleteAgent: vi.fn(async () => ({ ok: true })),
    };

    const result = await createAgentWithRollback(api, {
      gatewayId: 'gw-1',
      name: 'Writer',
      workspace: 'agents/writer',
      avatar: 'avatar-data',
      model: 'bad-model',
    });

    expect(result).toEqual({ ok: false, error: 'invalid model' });
    expect(api.createAgent).toHaveBeenCalledWith('gw-1', {
      name: 'Writer',
      workspace: 'agents/writer',
      avatar: 'avatar-data',
    });
    expect(api.updateAgent).toHaveBeenCalledWith('gw-1', {
      agentId: 'agent-1',
      model: 'bad-model',
    });
    expect(api.deleteAgent).toHaveBeenCalledWith('gw-1', {
      agentId: 'agent-1',
      deleteFiles: true,
    });
  });

  it('includes rollback failure in the surfaced error', async () => {
    const api = {
      createAgent: vi.fn(async () => ({ ok: true, result: { agentId: 'agent-1' } })),
      updateAgent: vi.fn(async () => ({ ok: false, error: 'invalid model' })),
      deleteAgent: vi.fn(async () => ({ ok: false, error: 'permission denied' })),
    };

    const result = await createAgentWithRollback(api, {
      gatewayId: 'gw-1',
      name: 'Writer',
      workspace: 'agents/writer',
      model: 'bad-model',
    });

    expect(result).toEqual({
      ok: false,
      error: 'invalid model (rollback failed: permission denied)',
    });
  });
});
