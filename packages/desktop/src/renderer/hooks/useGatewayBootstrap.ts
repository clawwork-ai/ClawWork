import { useEnsembleSync } from './useEnsembleSync';
import { useGatewayDispatcherSetup } from './useGatewayDispatcherSetup';
import { useGatewayEventListeners } from './useGatewayEventListeners';

export { fetchAgentsForGateway } from './useGatewayDispatcherSetup';

export function useGatewayBootstrap(): void {
  const dispatcher = useGatewayDispatcherSetup();
  useGatewayEventListeners(dispatcher);
  useEnsembleSync();
}
