import { useTranslation } from 'react-i18next';
import { useUiStore } from '../stores/hooks';

export function GatewayStatus() {
  const { t } = useTranslation();
  const statusMap = useUiStore((s) => s.gatewayStatusMap);
  const infoMap = useUiStore((s) => s.gatewayInfoMap);

  const entries = Object.entries(statusMap);
  if (entries.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="status"
      aria-label={t('gateway.statusLabel', { defaultValue: 'Gateway connection status' })}
    >
      {entries.map(([gwId, status]) => {
        const info = infoMap[gwId];
        const color =
          status === 'connected' ? 'var(--accent)' : status === 'connecting' ? 'var(--warning)' : 'var(--danger)';
        const displayName = info?.name || gwId.slice(0, 8);
        const statusLabel =
          status === 'connected'
            ? t('gateway.connected')
            : status === 'connecting'
              ? t('gateway.connecting')
              : t('gateway.disconnected');
        return (
          <div
            key={gwId}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1"
            style={{ borderColor: 'var(--border)' }}
            aria-label={`${displayName}: ${statusLabel}`}
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            <span className="type-meta" style={{ color: 'var(--text-secondary)' }}>
              {displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
}
