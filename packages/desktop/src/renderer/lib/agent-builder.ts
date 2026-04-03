interface AgentMutationResult {
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
  errorCode?: string;
  errorDetails?: Record<string, unknown>;
}

interface AgentBuilderApi {
  createAgent: (
    gatewayId: string,
    params: { name: string; workspace: string; avatar?: string },
  ) => Promise<AgentMutationResult>;
  updateAgent: (gatewayId: string, params: { agentId: string; model?: string }) => Promise<AgentMutationResult>;
  deleteAgent: (gatewayId: string, params: { agentId: string; deleteFiles?: boolean }) => Promise<AgentMutationResult>;
}

export async function createAgentWithRollback(
  api: AgentBuilderApi,
  params: {
    gatewayId: string;
    name: string;
    workspace: string;
    avatar?: string;
    model?: string;
  },
): Promise<AgentMutationResult> {
  const createRes = await api.createAgent(params.gatewayId, {
    name: params.name,
    workspace: params.workspace,
    avatar: params.avatar,
  });
  if (!createRes.ok) return createRes;

  const created = createRes.result;
  const agentId = typeof created?.agentId === 'string' ? created.agentId : '';
  const model = params.model?.trim();
  if (!model || !agentId) return createRes;

  const updateRes = await api.updateAgent(params.gatewayId, {
    agentId,
    model,
  });
  if (updateRes.ok) return createRes;

  const rollbackRes = await api.deleteAgent(params.gatewayId, {
    agentId,
    deleteFiles: true,
  });
  if (rollbackRes.ok) return updateRes;

  return {
    ...updateRes,
    error: `${updateRes.error ?? 'agent update failed'} (rollback failed: ${rollbackRes.error ?? 'unknown error'})`,
  };
}
