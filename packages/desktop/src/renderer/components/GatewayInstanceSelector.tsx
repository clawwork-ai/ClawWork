import { Check, ChevronDown, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GatewayInfo } from '@clawwork/core';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface GatewayInstanceSelectorProps {
  gateways: GatewayInfo[];
  selectedGatewayId: string;
  onSelectGateway: (id: string) => void;
  className?: string;
  buttonClassName?: string;
  showLabel?: boolean;
  align?: 'start' | 'center' | 'end';
}

export default function GatewayInstanceSelector({
  gateways,
  selectedGatewayId,
  onSelectGateway,
  className,
  buttonClassName,
  showLabel = true,
  align = 'center',
}: GatewayInstanceSelectorProps) {
  const { t } = useTranslation();
  const selectedGateway = gateways.find((gateway) => gateway.id === selectedGatewayId);

  if (gateways.length <= 1 || !selectedGateway) return null;

  const triggerClass = cn(
    'type-label inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]',
    buttonClassName,
  );

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {showLabel && <span className="type-support text-[var(--text-muted)]">{t('common.gateway')}</span>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label={t('settings.selectGateway')} className={triggerClass}>
            <Server size={13} />
            <span className="max-w-32 truncate">{selectedGateway.name}</span>
            <ChevronDown size={12} className="opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          {gateways.map((gateway) => (
            <DropdownMenuItem
              key={gateway.id}
              onClick={() => onSelectGateway(gateway.id)}
              className={cn(gateway.id === selectedGatewayId && 'text-[var(--accent)]')}
            >
              <Server size={13} />
              <span className="max-w-32 truncate">{gateway.name}</span>
              {gateway.id === selectedGatewayId && <Check size={13} className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
