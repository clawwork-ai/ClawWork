import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m, useDragControls } from 'framer-motion';
import type { AgentInfo } from '@clawwork/shared';
import { useUiStore } from '../stores/hooks';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { X } from 'lucide-react';

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
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = 'agent-selector-title';
  const dragControls = useDragControls();

  useFocusTrap(sheetRef, open, onClose, 'button:nth-of-type(2)');

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 surface-overlay"
            onClick={onClose}
            aria-hidden="true"
          />
          <m.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl"
            style={{ backgroundColor: 'var(--bg-secondary)', maxHeight: '60vh' }}
          >
            <div
              className="flex justify-center pt-2 pb-1"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: 'none' }}
            >
              <div className="h-1 w-9 rounded-full" style={{ backgroundColor: 'var(--text-muted)', opacity: 0.4 }} />
            </div>
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
            <div className="safe-area-bottom" />
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
