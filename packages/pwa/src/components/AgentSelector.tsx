import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'framer-motion';
import type { AgentInfo } from '@clawwork/shared';
import { useUiStore } from '../stores/hooks';
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
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const titleId = 'agent-selector-title';

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => {
      const firstAgent = sheetRef.current?.querySelector<HTMLElement>('[role="dialog"] button:nth-of-type(2)');
      const fallback = sheetRef.current?.querySelector<HTMLElement>('button');
      (firstAgent ?? fallback)?.focus();
    });
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevFocusRef.current?.focus();
    };
  }, [open, handleKeyDown]);

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
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl"
            style={{ backgroundColor: 'var(--bg-secondary)', maxHeight: '60vh' }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
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
            <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(60vh - 52px)' }}>
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelect(agent.id);
                    onClose();
                  }}
                  aria-label={agent.name || agent.id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 text-left transition-colors"
                  style={{ color: 'var(--text-primary)', minHeight: 44 }}
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
