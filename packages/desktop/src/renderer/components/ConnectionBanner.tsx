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
      <div className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] px-4 py-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Server size={13} className="flex-shrink-0" />
        <span className="flex-1">{t('connection.noGateway')}</span>
        <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="h-6 text-xs px-2">
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
      <div className="bg-[var(--danger)]/10 border-b border-[var(--danger)]/20 px-4 py-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <XCircle size={13} className="text-[var(--danger)] flex-shrink-0" />
        <span className="flex-1">{t('connection.unreachableBanner', { name: gwName })}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.clawwork.reconnectGateway(defaultGatewayId)}
          className="h-6 text-xs px-2"
        >
          {t('connection.retryNow')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)} className="h-6 text-xs px-2">
          {t('connection.openSettings')}
        </Button>
      </div>
    );
  }

  if (status === 'connecting' || (status === 'disconnected' && reconnectInfo && !reconnectInfo.gaveUp)) {
    return (
      <div className="bg-[var(--warning)]/10 border-b border-[var(--warning)]/20 px-4 py-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
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
      <div className="bg-[var(--danger)]/10 border-b border-[var(--danger)]/20 px-4 py-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <XCircle size={13} className="text-[var(--danger)] flex-shrink-0" />
        <span className="flex-1">{t('connection.disconnectedBanner', { name: gwName })}</span>
        <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)} className="h-6 text-xs px-2">
          {t('connection.openSettings')}
        </Button>
      </div>
    );
  }

  return null;
}
