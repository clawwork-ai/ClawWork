import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Loader2, Rocket, Save } from 'lucide-react';
import type { Team, AgentInfo } from '@clawwork/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/platform';
import { useTeamStore } from '@/stores/teamStore';
import { useDialogGuard } from '@/hooks/useDialogGuard';
import ConfirmDialog from '@/components/semantic/ConfirmDialog';
import TeamInfoStep from './TeamInfoStep';
import AgentConfigStep from './AgentConfigStep';
import InstallStep from './InstallStep';
import { useTeamInstall } from './useTeamInstall';
import { toSlug, createAgentDraft } from './utils';
import type { AgentDraft, TeamInfo } from './types';

interface CreateTeamWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGatewayId: string;
  editTeam: Team | null;
}

export default function CreateTeamWizard({ open, onOpenChange, defaultGatewayId, editTeam }: CreateTeamWizardProps) {
  const { t } = useTranslation();
  const loadTeams = useTeamStore((s) => s.loadTeams);
  const isEdit = !!editTeam;

  const [step, setStep] = useState(1);
  const [teamInfo, setTeamInfo] = useState<TeamInfo>({
    name: '',
    emoji: '🤖',
    description: '',
    gatewayId: defaultGatewayId,
  });
  const [agents, setAgents] = useState<AgentDraft[]>([createAgentDraft('coordinator'), createAgentDraft('worker')]);
  const [touched, setTouched] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const { installStatus, installEvents, runInstall, runUpdate, resetInstall } = useTeamInstall(loadTeams);

  const handleTeamInfoChange = useCallback((info: TeamInfo) => {
    setTeamInfo(info);
    setTouched(true);
  }, []);

  const handleAgentsChange = useCallback((newAgents: AgentDraft[]) => {
    setAgents(newAgents);
    setTouched(true);
  }, []);

  useEffect(() => {
    if (!editTeam || !open) return;
    const abortController = new AbortController();
    setEditLoading(true);
    setTeamInfo({
      name: editTeam.name,
      emoji: editTeam.emoji,
      description: editTeam.description,
      gatewayId: editTeam.gatewayId,
    });

    window.clawwork
      .listAgents(editTeam.gatewayId)
      .then((res) => {
        if (abortController.signal.aborted) return;
        if (!res.ok) return;
        const payload = res.result as { agents?: AgentInfo[] };
        const infoMap = new Map((payload.agents ?? []).map((a) => [a.id, a]));
        setAgents(
          editTeam.agents.map((a) => {
            const info = infoMap.get(a.agentId);
            return {
              uid: crypto.randomUUID(),
              name: info?.name ?? a.agentId,
              role: a.isManager ? ('coordinator' as const) : ('worker' as const),
              model: info?.model?.primary ?? '',
              agentMd: '',
              soulMd: '',
              skills: [],
              existingAgentId: a.agentId,
            };
          }),
        );
      })
      .catch((err) => {
        if (!abortController.signal.aborted) console.error('Failed to load agents for edit', err);
      })
      .finally(() => {
        if (!abortController.signal.aborted) setEditLoading(false);
      });

    return () => abortController.abort();
  }, [editTeam, open]);

  const step1Valid = teamInfo.name.trim().length > 0 && teamInfo.gatewayId.length > 0;
  const step2Valid = useMemo(() => {
    if (agents.length < 2) return false;
    if (!agents.some((a) => a.role === 'coordinator')) return false;
    if (!agents.every((a) => a.name.trim().length > 0)) return false;
    const slugs = agents.map((a) => toSlug(a.name));
    if (new Set(slugs).size !== slugs.length) return false;
    return true;
  }, [agents]);

  const reset = useCallback(() => {
    setStep(1);
    setTouched(false);
    setEditLoading(false);
    setTeamInfo({ name: '', emoji: '🤖', description: '', gatewayId: defaultGatewayId });
    setAgents([createAgentDraft('coordinator'), createAgentDraft('worker')]);
    resetInstall();
  }, [defaultGatewayId, resetInstall]);

  const isDirty = useCallback(() => {
    if (installStatus === 'installing') return true;
    if (installStatus === 'done') return false;
    if (isEdit) return touched;
    return teamInfo.name.trim().length > 0 || agents.some((a) => a.name.trim().length > 0);
  }, [teamInfo.name, agents, installStatus, isEdit, touched]);

  const doClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const { confirmOpen, guardedOpenChange, contentProps, confirmDiscard, cancelDiscard } = useDialogGuard({
    isDirty,
    onConfirmClose: doClose,
  });

  const handleInstall = useCallback(() => {
    if (editTeam && agents.every((a) => a.existingAgentId)) {
      return runUpdate(editTeam.id, editTeam.createdAt, teamInfo, agents);
    }
    return runInstall(teamInfo, agents, editTeam ? { teamId: editTeam.id, createdAt: editTeam.createdAt } : undefined);
  }, [runInstall, runUpdate, teamInfo, agents, editTeam]);

  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const stepTitles = [
    t('teams.wizard.teamInfo'),
    t('teams.wizard.configureAgents'),
    isEdit ? t('teams.wizard.reviewSave') : t('teams.wizard.reviewInstall'),
  ];

  return (
    <Dialog open={open} onOpenChange={guardedOpenChange}>
      <DialogContent className="max-w-[var(--dialog-max-width)] flex max-h-screen flex-col" {...contentProps}>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('teams.editTeam') : t('teams.createTeam')}</DialogTitle>
          <DialogDescription>
            <span className="inline-flex gap-2">
              {stepTitles.map((title, i) => (
                <span
                  key={i}
                  className={i + 1 === step ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}
                >
                  {i + 1}. {title}
                  {i < stepTitles.length - 1 && <span className="ml-2 text-[var(--text-muted)]">/</span>}
                </span>
              ))}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-4">
          {editLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <>
              {step === 1 && (
                <TeamInfoStep
                  info={teamInfo}
                  onChange={handleTeamInfoChange}
                  gateways={Object.entries(gatewayInfoMap)}
                  nameLocked={isEdit}
                  gatewayLocked={isEdit}
                />
              )}
              {step === 2 && (
                <AgentConfigStep agents={agents} onChange={handleAgentsChange} gatewayId={teamInfo.gatewayId} />
              )}
              {step === 3 && (
                <InstallStep
                  teamInfo={teamInfo}
                  agents={agents}
                  status={installStatus}
                  events={installEvents}
                  isEdit={isEdit}
                />
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
          <div className="flex-1">
            {step > 1 && installStatus === 'idle' && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft size={14} />
                {t('teams.wizard.prev')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {installStatus !== 'installing' && (
              <Button variant="outline" onClick={() => guardedOpenChange(false)}>
                {installStatus === 'done' ? t('common.close') : t('common.cancel')}
              </Button>
            )}
            {step < 3 && (
              <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 ? !step1Valid : !step2Valid}>
                {t('teams.wizard.next')}
                <ChevronRight size={14} />
              </Button>
            )}
            {step === 3 && installStatus === 'idle' && (
              <Button onClick={handleInstall} disabled={!step1Valid || !step2Valid}>
                {isEdit ? <Save size={14} /> : <Rocket size={14} />}
                {isEdit ? t('teams.wizard.save') : t('teams.wizard.install')}
              </Button>
            )}
            {step === 3 && installStatus === 'installing' && (
              <Button disabled>
                <Loader2 size={14} className="animate-spin" />
                {isEdit ? t('teams.wizard.saving') : t('teams.wizard.installing')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
      <ConfirmDialog
        open={confirmOpen}
        title={t('common.discardChangesTitle')}
        description={t('common.discardChangesDesc')}
        confirmLabel={t('common.discard')}
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </Dialog>
  );
}
