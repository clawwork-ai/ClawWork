import { Download, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TeamHubEntry } from '@clawwork/shared';
import { Button } from '@/components/ui/button';
import { TeamCardShell } from './TeamCardShell';

interface TeamHubCardProps {
  entry: TeamHubEntry;
  installed: boolean;
  onSelect: () => void;
  onInstall: () => void;
}

export default function TeamHubCard({ entry, installed, onSelect, onInstall }: TeamHubCardProps) {
  const { t } = useTranslation();

  return (
    <TeamCardShell
      emoji={entry.emoji}
      name={entry.name}
      description={entry.description}
      memberCount={entry.agentCount}
      onClick={onSelect}
      subtitle={
        entry.category ? <span className="type-meta text-[var(--text-muted)]">{entry.category}</span> : undefined
      }
      actions={
        installed ? (
          <span className="type-meta flex items-center gap-1 text-[var(--accent)]">
            <Check size={13} />
            {t('teamshub.installed')}
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onInstall();
            }}
          >
            <Download size={14} />
            {t('teamshub.install')}
          </Button>
        )
      }
    />
  );
}
