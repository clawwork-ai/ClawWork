import { useState, useCallback, useEffect, useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Team } from '@clawwork/shared';
import WindowTitlebar from '@/components/semantic/WindowTitlebar';
import EmptyState from '@/components/semantic/EmptyState';
import ConfirmDialog from '@/components/semantic/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeamStore } from '@/stores/teamStore';
import { useTaskStore, useUiStore } from '@/platform';
import TeamCard from './TeamCard';
import TeamDetailView from './TeamDetailView';
import CreateTeamWizard from './CreateTeamWizard';

export default function TeamsPanel() {
  const { t } = useTranslation();
  const teamsMap = useTeamStore((s) => s.teams);
  const loadTeams = useTeamStore((s) => s.loadTeams);
  const deleteTeamAction = useTeamStore((s) => s.deleteTeam);
  const createTask = useTaskStore((s) => s.createTask);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const setMainView = useUiStore((s) => s.setMainView);
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  const teams = useMemo(() => Object.values(teamsMap), [teamsMap]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

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
      setEditTeam(team);
      setWizardOpen(true);
    },
    [teamsMap],
  );

  const handleDelete = useCallback((teamId: string) => {
    setDeletingTeamId(teamId);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deletingTeamId) deleteTeamAction(deletingTeamId);
    setDeletingTeamId(null);
  }, [deletingTeamId, deleteTeamAction]);

  const handleWizardClose = useCallback((open: boolean) => {
    if (!open) setEditTeam(null);
    setWizardOpen(open);
  }, []);

  const deletingTeam = deletingTeamId ? teamsMap[deletingTeamId] : null;
  const selectedTeam = selectedTeamId ? teamsMap[selectedTeamId] : null;

  return (
    <>
      {selectedTeam ? (
        <TeamDetailView
          team={selectedTeam}
          onBack={() => setSelectedTeamId(null)}
          onStartChat={() => handleStartChat(selectedTeam.id)}
          onEdit={() => handleEdit(selectedTeam.id)}
        />
      ) : (
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
                <Button
                  size="sm"
                  onClick={() => {
                    setEditTeam(null);
                    setWizardOpen(true);
                  }}
                >
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
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditTeam(null);
                      setWizardOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    {t('teams.createTeam')}
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(var(--content-card-min),1fr))] gap-4">
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onSelect={() => setSelectedTeamId(team.id)}
                    onStartChat={() => handleStartChat(team.id)}
                    onEdit={() => handleEdit(team.id)}
                    onDelete={() => handleDelete(team.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      <CreateTeamWizard
        open={wizardOpen}
        onOpenChange={handleWizardClose}
        defaultGatewayId={defaultGatewayId ?? ''}
        editTeam={editTeam}
      />

      <ConfirmDialog
        open={!!deletingTeam}
        variant="danger"
        title={t('teams.confirmDeleteTitle')}
        description={t('teams.confirmDeleteDesc', { name: deletingTeam?.name ?? '' })}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTeamId(null)}
      />
    </>
  );
}
