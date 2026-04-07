import { motion } from 'framer-motion';
import { Download, Check, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TeamHubEntry } from '@clawwork/shared';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';

interface TeamHubCardProps {
  entry: TeamHubEntry;
  installed: boolean;
  onSelect: () => void;
  onInstall: () => void;
}

export default function TeamHubCard({ entry, installed, onSelect, onInstall }: TeamHubCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      {...motionPresets.listItem}
      onClick={onSelect}
      className={cn(
        'surface-card flex w-full cursor-pointer flex-col items-start gap-3 rounded-xl p-5',
        'border border-[var(--border)] transition-colors',
        'hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]',
      )}
    >
      <div className="flex w-full items-center gap-3 min-w-0">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
          <span className="emoji-lg">{entry.emoji}</span>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="type-section-title text-[var(--text-primary)] truncate">{entry.name}</h3>
          {entry.category && <span className="type-meta text-[var(--text-muted)]">{entry.category}</span>}
        </div>
      </div>
      {entry.description && <p className="type-body text-[var(--text-secondary)] line-clamp-2">{entry.description}</p>}
      <div className="flex w-full items-center justify-between">
        <div className="type-meta flex items-center gap-1.5 text-[var(--text-muted)]">
          <Users size={13} className="opacity-60" />
          <span>{t('teams.memberCount', { count: entry.agentCount })}</span>
        </div>
        {installed ? (
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
        )}
      </div>
    </motion.div>
  );
}
