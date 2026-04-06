import { motion } from 'framer-motion';
import { MessageSquare, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Team } from '@clawwork/shared';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamCardProps {
  team: Team;
  onSelect: () => void;
  onStartChat: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TeamCard({ team, onSelect, onStartChat, onEdit, onDelete }: TeamCardProps) {
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
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
            <span className="emoji-lg">{team.emoji}</span>
          </span>
          <h3 className="type-section-title text-[var(--text-primary)] truncate">{team.name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] cursor-pointer focus-visible:outline-none glow-focus"
            >
              <MoreHorizontal size={15} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil size={14} />
              {t('teams.editTeam')}
            </DropdownMenuItem>
            <DropdownMenuItem danger onClick={onDelete}>
              <Trash2 size={14} />
              {t('teams.deleteTeam')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {team.description && <p className="type-body text-[var(--text-secondary)] line-clamp-2">{team.description}</p>}
      <div className="flex w-full items-center justify-between">
        <div className="type-meta flex items-center gap-1.5 text-[var(--text-muted)]">
          <Users size={13} className="opacity-60" />
          <span>{t('teams.memberCount', { count: team.agents.length })}</span>
        </div>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onStartChat();
          }}
        >
          <MessageSquare size={14} />
          {t('teams.startChat')}
        </Button>
      </div>
    </motion.div>
  );
}
