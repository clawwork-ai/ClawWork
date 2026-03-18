import { AlertTriangle, XCircle, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../stores/uiStore';
import { Button } from '@/components/ui/button';

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
      <div
        className="titlebar-no-drag bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-amber-500/20 transition-colors"
        onClick={() => setSettingsOpen(true)}
      >
        <Server size={15} className="flex-shrink-0 text-amber-400" />
        <span className="flex-1 text-xs text-amber-200 font-medium">{t('connection.noGateway')}</span>
        <Button
          size="sm"
          variant="outline"
          className="titlebar-no-drag h-7 text-xs px-3 border-amber-500/50 text-amber-300 hover:bg-amber-500/20 hover:text-amber-100 flex-shrink-0"
        >
          {t('connection.addGateway')}
        </Button>
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
      <div className="titlebar-no-drag bg-[var(--danger)]/10 border-b border-[var(--danger)]/20 px-4 py-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <XCircle size={13} className="text-[var(--danger)] flex-shrink-0" />
        <span className="flex-1">{t('connection.unreachableBanner', { name: gwName })}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.clawwork.reconnectGateway(defaultGatewayId)}
          className="titlebar-no-drag h-6 text-xs px-2"
        >
          {t('connection.retryNow')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSettingsOpen(true)}
          className="titlebar-no-drag h-6 text-xs px-2"
        >
          {t('connection.openSettings')}
        </Button>
      </div>
    );
  }

  if (status === 'connecting' || (status === 'disconnected' && reconnectInfo && !reconnectInfo.gaveUp)) {
    return (
      <div className="titlebar-no-drag bg-[var(--warning)]/10 border-b border-[var(--warning)]/20 px-4 py-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <AlertTriangle size={13} className="text-[var(--warning)] flex-shrink-0" />
        <span>
          {t('connection.reconnectingBanner', { name: gwName })}
          {reconnectInfo && ` (${reconnectInfo.attempt}/${reconnectInfo.max})`}
        </span>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="titlebar-no-drag bg-[var(--danger)]/10 border-b border-[var(--danger)]/20 px-4 py-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <XCircle size={13} className="text-[var(--danger)] flex-shrink-0" />
        <span className="flex-1">{t('connection.disconnectedBanner', { name: gwName })}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSettingsOpen(true)}
          className="titlebar-no-drag h-6 text-xs px-2"
        >
          {t('connection.openSettings')}
        </Button>
      </div>
    );
  }

  return null;
}
