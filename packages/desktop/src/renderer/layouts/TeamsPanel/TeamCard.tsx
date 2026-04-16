import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Team } from '@clawwork/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TeamCardShell } from './TeamCardShell';

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
    <TeamCardShell
      emoji={team.emoji}
      name={team.name}
      description={team.description}
      memberCount={team.agents.length}
      onClick={onSelect}
      topRight={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label={t('common.moreActions')}
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
      }
      actions={
        <Button
          size="sm"
          variant="soft"
          onClick={(e) => {
            e.stopPropagation();
            onStartChat();
          }}
        >
          <MessageSquare size={14} />
          {t('teams.startChat')}
        </Button>
      }
    />
  );
}
