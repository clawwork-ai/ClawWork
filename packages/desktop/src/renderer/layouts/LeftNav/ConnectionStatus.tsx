import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUiStore } from '@/stores/uiStore';
import { motionDuration } from '@/styles/design-tokens';

type Status = 'connected' | 'connecting' | 'disconnected';

interface StatusConfig {
  color: string;
  labelKey: string;
  hintKey?: string;
  pulse?: boolean;
}

interface ConnectionStatusProps {
  gatewayStatus: Status;
  className?: string;
  collapsed?: boolean;
}

function computeConfig(status: Status): StatusConfig {
  switch (status) {
    case 'connected':
      return { color: 'bg-[var(--accent)]', labelKey: 'connection.connected' };
    case 'connecting':
      return { color: 'bg-[var(--warning)]', labelKey: 'connection.connecting', pulse: true };
    case 'disconnected':
      return { color: 'bg-[var(--danger)]', labelKey: 'connection.disconnected', hintKey: 'connection.gatewayDown' };
  }
}

export default function ConnectionStatus({ gatewayStatus, className, collapsed }: ConnectionStatusProps) {
  const { t } = useTranslation();
  const cfg = computeConfig(gatewayStatus);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const isClickable = gatewayStatus === 'disconnected';

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full flex-shrink-0',
              cfg.color,
              cfg.pulse && 'animate-pulse',
              isClickable && 'cursor-pointer',
            )}
            onClick={isClickable ? () => setSettingsOpen(true) : undefined}
          />
        </TooltipTrigger>
        <TooltipContent side="right">{t(cfg.labelKey)}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={gatewayStatus}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: motionDuration.normal }}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-xs',
          isClickable && 'cursor-pointer hover:text-[var(--text-secondary)] transition-colors',
          className,
        )}
        onClick={isClickable ? () => setSettingsOpen(true) : undefined}
      >
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.color, cfg.pulse && 'animate-pulse')} />
        <span className="text-[var(--text-muted)]">
          {t(cfg.labelKey)}
          {cfg.hintKey && <span className="ml-1 text-[var(--text-muted)] opacity-60">({t(cfg.hintKey)})</span>}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
