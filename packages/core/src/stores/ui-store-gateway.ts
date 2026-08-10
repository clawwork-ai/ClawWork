import type { GatewayState, UiState } from './ui-store.js';

export function emptyGatewayState(gatewayId: string): GatewayState {
  return {
    status: 'disconnected',
    info: { id: gatewayId, name: '' },
    models: [],
    agents: { agents: [], defaultId: '' },
    tools: null,
    skills: null,
  };
}

/** Merge a gateway patch into registry and keep legacy per-field maps in sync. */
export function patchGatewayState(s: UiState, gatewayId: string, patch: Partial<GatewayState>): Partial<UiState> {
  const prev = s.gatewayRegistry[gatewayId] ?? emptyGatewayState(gatewayId);
  const entry: GatewayState = {
    ...prev,
    ...patch,
    info: patch.info ? { ...prev.info, ...patch.info } : prev.info,
    agents: patch.agents ? { ...prev.agents, ...patch.agents } : prev.agents,
  };

  const out: Partial<UiState> = {
    gatewayRegistry: { ...s.gatewayRegistry, [gatewayId]: entry },
    gatewayStatusMap: { ...s.gatewayStatusMap, [gatewayId]: entry.status },
  };

  if ('version' in patch) {
    if (entry.version === undefined) {
      const next = { ...s.gatewayVersionMap };
      delete next[gatewayId];
      out.gatewayVersionMap = next;
    } else {
      out.gatewayVersionMap = { ...s.gatewayVersionMap, [gatewayId]: entry.version };
    }
  }

  if ('reconnectInfo' in patch) {
    if (entry.reconnectInfo === undefined) {
      const next = { ...s.gatewayReconnectInfo };
      delete next[gatewayId];
      out.gatewayReconnectInfo = next;
    } else {
      out.gatewayReconnectInfo = { ...s.gatewayReconnectInfo, [gatewayId]: entry.reconnectInfo };
    }
  }

  if (patch.info !== undefined) {
    out.gatewayInfoMap = { ...s.gatewayInfoMap, [gatewayId]: entry.info };
  }
  if (patch.models !== undefined) {
    out.modelCatalogByGateway = { ...s.modelCatalogByGateway, [gatewayId]: entry.models };
  }
  if (patch.agents !== undefined) {
    out.agentCatalogByGateway = { ...s.agentCatalogByGateway, [gatewayId]: entry.agents };
  }
  if (patch.tools !== undefined) {
    if (entry.tools === null) {
      const next = { ...s.toolsCatalogByGateway };
      delete next[gatewayId];
      out.toolsCatalogByGateway = next;
    } else {
      out.toolsCatalogByGateway = { ...s.toolsCatalogByGateway, [gatewayId]: entry.tools };
    }
  }
  if (patch.skills !== undefined) {
    if (entry.skills === null) {
      const next = { ...s.skillsStatusByGateway };
      delete next[gatewayId];
      out.skillsStatusByGateway = next;
    } else {
      out.skillsStatusByGateway = { ...s.skillsStatusByGateway, [gatewayId]: entry.skills };
    }
  }

  return out;
}

export function applyGatewayPatch(s: UiState, gatewayId: string, patch: Partial<GatewayState>): UiState {
  return { ...s, ...patchGatewayState(s, gatewayId, patch) };
}
