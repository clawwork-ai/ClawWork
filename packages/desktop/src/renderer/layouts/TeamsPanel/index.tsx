import { useState, useCallback, useEffect, useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Team } from '@clawwork/shared';
import WindowTitlebar from '@/components/semantic/WindowTitlebar';
import EmptyState from '@/components/semantic/EmptyState';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeamStore } from '@/stores/teamStore';
import { useTaskStore, useUiStore } from '@/platform';
import TeamCard from './TeamCard';
import CreateTeamDialog from './CreateTeamDialog';

export default function TeamsPanel() {
  const { t } = useTranslation();
  const teamsMap = useTeamStore((s) => s.teams);
  const loadTeams = useTeamStore((s) => s.loadTeams);
  const createTeam = useTeamStore((s) => s.createTeam);
  const updateTeam = useTeamStore((s) => s.updateTeam);
  const deleteTeamAction = useTeamStore((s) => s.deleteTeam);
  const createTask = useTaskStore((s) => s.createTask);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const setMainView = useUiStore((s) => s.setMainView);
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const teams = useMemo(() => Object.values(teamsMap), [teamsMap]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreate = useCallback(
    (data: {
      name: string;
      emoji: string;
      description: string;
      gatewayId: string;
      agents: Array<{ agentId: string; role: string; isManager: boolean }>;
    }) => {
      createTeam({
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        gatewayId: data.gatewayId,
        source: 'local',
        version: '',
        agents: data.agents,
      });
    },
    [createTeam],
  );

  const handleStartChat = useCallback(
    (teamId: string) => {
      const team = teamsMap[teamId];
      if (!team || team.agents.length === 0) {
        toast.error(t('teams.noAgents'));
        return;
      }
      const manager = team.agents.find((a) => a.isManager);
      const agentId = manager?.agentId ?? team.agents[0].agentId;
      const needsEnsemble = team.agents.length >= 2;
      const task = createTask({ gatewayId: team.gatewayId, agentId, ensemble: needsEnsemble, teamId });
      setActiveTask(task.id);
      setMainView('chat');
    },
    [teamsMap, createTask, setActiveTask, setMainView, t],
  );

  const handleEdit = useCallback(
    (teamId: string) => {
      const team = teamsMap[teamId];
      if (!team) return;
      setEditingTeam(team);
    },
    [teamsMap],
  );

  const handleUpdate = useCallback(
    (data: {
      name: string;
      emoji: string;
      description: string;
      gatewayId: string;
      agents: Array<{ agentId: string; role: string; isManager: boolean }>;
    }) => {
      if (!editingTeam) return;
      updateTeam(editingTeam.id, {
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        gatewayId: data.gatewayId,
        agents: data.agents,
      });
      setEditingTeam(null);
    },
    [editingTeam, updateTeam],
  );

  const handleDelete = useCallback(
    (teamId: string) => {
      deleteTeamAction(teamId);
    },
    [deleteTeamAction],
  );

  return (
    <div className="flex flex-col h-full">
      <WindowTitlebar
        left={
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-[var(--text-muted)]" />
            <h2 className="type-section-title text-[var(--text-primary)]">{t('teams.title')}</h2>
            {teams.length > 0 && <span className="type-support text-[var(--text-muted)]">({teams.length})</span>}
          </div>
        }
        right={
          teams.length > 0 ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              {t('teams.createTeam')}
            </Button>
          ) : undefined
        }
      />

      <ScrollArea className="flex-1 px-5 py-4">
        {teams.length === 0 ? (
          <EmptyState
            icon={<Users size={24} className="text-[var(--text-muted)]" />}
            title={t('teams.emptyTitle')}
            description={t('teams.emptyDesc')}
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus size={14} />
                {t('teams.createTeam')}
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[var(--content-max-width)]">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onStartChat={() => handleStartChat(team.id)}
                onEdit={() => handleEdit(team.id)}
                onDelete={() => handleDelete(team.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <CreateTeamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultGatewayId={defaultGatewayId ?? ''}
        onCreate={handleCreate}
      />

      <CreateTeamDialog
        open={!!editingTeam}
        onOpenChange={(open) => {
          if (!open) setEditingTeam(null);
        }}
        defaultGatewayId={editingTeam?.gatewayId ?? defaultGatewayId ?? ''}
        onCreate={handleUpdate}
        team={editingTeam ?? undefined}
      />
    </div>
  );
}
