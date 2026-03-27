import { useTranslation } from 'react-i18next';
import type { AgentInfo } from '@clawwork/shared';
import { useUiStore } from '../stores/hooks';
import { X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface AgentSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (agentId: string) => void;
}

export function AgentSelector({ open, onClose, onSelect }: AgentSelectorProps) {
  const { t } = useTranslation();
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const catalog = useUiStore((s) => (defaultGatewayId ? s.agentCatalogByGateway[defaultGatewayId] : undefined));
  const agents: AgentInfo[] = catalog?.agents ?? [];
  const titleId = 'agent-selector-title';

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy={titleId}>
      <div className="flex items-center justify-between px-4 py-2" style={{ touchAction: 'manipulation' }}>
        <span id={titleId} className="type-label" style={{ color: 'var(--text-primary)' }}>
          {t('agents.selectTitle')}
        </span>
        <button
          onClick={onClose}
          aria-label={t('drawer.closeButton')}
          className="p-2"
          style={{ color: 'var(--text-muted)', minHeight: 44, minWidth: 44 }}
        >
          <X size={18} />
        </button>
      </div>
      <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(60vh - 72px)', touchAction: 'pan-y' }}>
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => {
              onSelect(agent.id);
              onClose();
            }}
            aria-label={agent.name || agent.id}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            <span className="type-body">{agent.identity?.emoji || '\uD83E\uDD16'}</span>
            <div className="flex-1">
              <div className="type-label">{agent.name || agent.id}</div>
              {agent.identity?.theme && (
                <div className="type-support" style={{ color: 'var(--text-muted)' }}>
                  {agent.identity.theme}
                </div>
              )}
            </div>
          </button>
        ))}
        {agents.length === 0 && (
          <div className="py-8 text-center type-body" style={{ color: 'var(--text-muted)' }}>
            {t('agents.empty')}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
