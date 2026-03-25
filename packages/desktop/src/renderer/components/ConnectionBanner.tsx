import { AlertTriangle, XCircle, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../stores/uiStore';
import InlineNotice from '@/components/semantic/InlineNotice';
import ToolbarButton from '@/components/semantic/ToolbarButton';

export default function ConnectionBanner() {
  const { t } = useTranslation();
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const gatewayStatusMap = useUiStore((s) => s.gatewayStatusMap);
  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const gatewayReconnectInfo = useUiStore((s) => s.gatewayReconnectInfo);
  const gatewaysLoaded = useUiStore((s) => s.gatewaysLoaded);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);

  if (!gatewaysLoaded) return null;

  const hasGateways = Object.keys(gatewayInfoMap).length > 0;

  if (!hasGateways) {
    return (
      <div className="px-4 pt-2">
        <InlineNotice
          tone="warning"
          action={
            <ToolbarButton size="sm" variant="outline" onClick={() => setSettingsOpen(true)}>
              {t('connection.addGateway')}
            </ToolbarButton>
          }
        >
          <span className="inline-flex items-center gap-3">
            <Server size={15} className="flex-shrink-0" />
            {t('connection.noGateway')}
          </span>
        </InlineNotice>
      </div>
    );
  }

  if (!defaultGatewayId) return null;

  const status = gatewayStatusMap[defaultGatewayId];
  const info = gatewayInfoMap[defaultGatewayId];
  const reconnectInfo = gatewayReconnectInfo[defaultGatewayId];
  const gwName = info?.name ?? defaultGatewayId;

  if (!status || status === 'connected') return null;

  if (reconnectInfo?.gaveUp) {
    return (
      <div className="px-4 pt-2">
        <InlineNotice
          tone="error"
          action={
            <div className="flex items-center gap-2">
              <ToolbarButton
                size="sm"
                variant="outline"
                onClick={() => window.clawwork.reconnectGateway(defaultGatewayId)}
              >
                {t('connection.retryNow')}
              </ToolbarButton>
              <ToolbarButton size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
                {t('connection.openSettings')}
              </ToolbarButton>
            </div>
          }
        >
          <span className="inline-flex items-center gap-2">
            <XCircle size={13} className="flex-shrink-0" />
            {t('connection.unreachableBanner', { name: gwName })}
          </span>
        </InlineNotice>
      </div>
    );
  }

  if (status === 'connecting' || (status === 'disconnected' && reconnectInfo && !reconnectInfo.gaveUp)) {
    return (
      <div className="px-4 pt-2">
        <InlineNotice tone="warning">
          <span className="inline-flex items-center gap-2">
            <AlertTriangle size={13} className="flex-shrink-0" />
            {t('connection.reconnectingBanner', { name: gwName })}
            {reconnectInfo && ` (${reconnectInfo.attempt}/${reconnectInfo.max})`}
          </span>
        </InlineNotice>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="px-4 pt-2">
        <InlineNotice
          tone="error"
          action={
            <ToolbarButton size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
              {t('connection.openSettings')}
            </ToolbarButton>
          }
        >
          <span className="inline-flex items-center gap-2">
            <XCircle size={13} className="flex-shrink-0" />
            {t('connection.disconnectedBanner', { name: gwName })}
          </span>
        </InlineNotice>
      </div>
    );
  }

  return null;
}
