import { useEffect, useMemo, useState } from 'react';
import type { GatewayInfo } from '@clawwork/core';
import type { AgentInfo } from '@clawwork/shared';
import { useUiStore } from '@/stores/uiStore';
import { fetchAgentsForGateway } from '@/hooks/useGatewayBootstrap';

interface UseGatewaySelectorOptions {
  initialGatewayId?: string;
  initialAgentId?: string;
}

interface UseGatewaySelectorResult {
  gateways: GatewayInfo[];
  selectedGwId: string;
  setSelectedGwId: (id: string) => void;
  agentCatalog: AgentInfo[];
  defaultAgentId: string;
  effectiveAgentId: string;
  setSelectedAgentId: (id: string) => void;
  hasMultipleGw: boolean;
  hasMultipleAgents: boolean;
}

export function useGatewaySelector(options: UseGatewaySelectorOptions = {}): UseGatewaySelectorResult {
  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const agentCatalogByGateway = useUiStore((s) => s.agentCatalogByGateway);

  const gateways = useMemo(() => Object.values(gatewayInfoMap), [gatewayInfoMap]);
  const [selectedGwId, setSelectedGwId] = useState(
    options.initialGatewayId ?? defaultGatewayId ?? gateways[0]?.id ?? '',
  );

  const gwAgents = agentCatalogByGateway[selectedGwId];
  const agentCatalog = useMemo(() => gwAgents?.agents ?? [], [gwAgents]);
  const [selectedAgentId, setSelectedAgentId] = useState(
    options.initialAgentId ??
      agentCatalogByGateway[options.initialGatewayId ?? defaultGatewayId ?? '']?.defaultId ??
      '',
  );

  const defaultAgentId = gwAgents?.defaultId ?? agentCatalog[0]?.id ?? '';
  const effectiveAgentId = useMemo(
    () => (agentCatalog.some((agent) => agent.id === selectedAgentId) ? selectedAgentId : defaultAgentId),
    [agentCatalog, defaultAgentId, selectedAgentId],
  );

  useEffect(() => {
    if (!selectedGwId) {
      const fallback = defaultGatewayId ?? gateways[0]?.id ?? '';
      if (fallback) setSelectedGwId(fallback);
    }
  }, [defaultGatewayId, gateways, selectedGwId]);

  useEffect(() => {
    if (selectedGwId) fetchAgentsForGateway(selectedGwId);
  }, [selectedGwId]);

  return {
    gateways,
    selectedGwId,
    setSelectedGwId,
    agentCatalog,
    defaultAgentId,
    effectiveAgentId,
    setSelectedAgentId,
    hasMultipleGw: gateways.length > 1,
    hasMultipleAgents: agentCatalog.length > 1,
  };
}
