import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Sparkles, Users, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Team } from '@clawwork/shared';
import { useTaskStore } from '@/stores/taskStore';
import { useUiStore } from '@/stores/uiStore';
import { useTeamStore } from '@/stores/teamStore';
import { cn } from '@/lib/utils';
import { motion as animationPresets } from '@/styles/design-tokens';
import { motion } from 'framer-motion';
import { fetchAgentsForGateway } from '@/hooks/useGatewayBootstrap';
import GatewayInstanceSelector from '@/components/GatewayInstanceSelector';
import logo from '@/assets/logo.png';

type WelcomeTab = 'agent' | 'team' | 'orchestrate';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const setMainView = useUiStore((s) => s.setMainView);
  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const agentCatalogByGateway = useUiStore((s) => s.agentCatalogByGateway);
  const selectedMainAgentByGateway = useUiStore((s) => s.selectedMainAgentByGateway);
  const pendingNewTask = useTaskStore((s) => s.pendingNewTask);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const activeTaskEnsemble = useTaskStore((s) => {
    if (!s.activeTaskId) return undefined;
    const t = s.tasks.find((tt) => tt.id === s.activeTaskId);
    return t?.ensemble;
  });
  const activeTaskTeamId = useTaskStore((s) => {
    if (!s.activeTaskId) return undefined;
    const t = s.tasks.find((tt) => tt.id === s.activeTaskId);
    return t?.teamId;
  });
  const updateTaskMetadata = useTaskStore((s) => s.updateTaskMetadata);
  const teamsMap = useTeamStore((s) => s.teams);
  const teamsLoadedOnce = useTeamStore((s) => s.loadedOnce);
  const loadTeams = useTeamStore((s) => s.loadTeams);

  const teams = useMemo(() => Object.values(teamsMap), [teamsMap]);
  const gateways = useMemo(() => Object.values(gatewayInfoMap), [gatewayInfoMap]);
  const [selectedGwId, setSelectedGwId] = useState(
    pendingNewTask?.gatewayId ?? defaultGatewayId ?? gateways[0]?.id ?? '',
  );
  const gwAgents = agentCatalogByGateway[selectedGwId];
  const agentCatalog = useMemo(() => gwAgents?.agents ?? [], [gwAgents]);
  const defaultAgentId = gwAgents?.defaultId ?? agentCatalog[0]?.id ?? '';
  const selectedMainAgentId = selectedMainAgentByGateway[selectedGwId] || '';
  const effectiveAgentId = useMemo(
    () => (agentCatalog.some((agent) => agent.id === selectedMainAgentId) ? selectedMainAgentId : defaultAgentId),
    [agentCatalog, defaultAgentId, selectedMainAgentId],
  );
  const hasMultipleAgents = agentCatalog.length > 1;

  const [activeTab, setActiveTab] = useState<WelcomeTab>(() => {
    const ensemble = activeTaskEnsemble ?? pendingNewTask?.ensemble;
    const teamId = activeTaskTeamId ?? pendingNewTask?.teamId;
    if (teamId) return 'team';
    if (ensemble) return 'orchestrate';
    return 'agent';
  });

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    pendingNewTask?.teamId ?? activeTaskTeamId ?? null,
  );
  const teamsForSelectedGateway = useMemo(
    () => teams.filter((team) => team.gatewayId === selectedGwId),
    [teams, selectedGwId],
  );

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (!gateways.length) return;
    if (gateways.some((gw) => gw.id === selectedGwId)) return;
    const fallback =
      defaultGatewayId && gateways.some((gw) => gw.id === defaultGatewayId)
        ? defaultGatewayId
        : (gateways[0]?.id ?? '');
    if (fallback && fallback !== selectedGwId) setSelectedGwId(fallback);
  }, [defaultGatewayId, gateways, selectedGwId]);

  useEffect(() => {
    if (selectedGwId) fetchAgentsForGateway(selectedGwId);
  }, [selectedGwId]);

  useEffect(() => {
    if (activeTab === 'agent') {
      if (activeTaskId) {
        if (activeTaskEnsemble || activeTaskTeamId) {
          updateTaskMetadata(activeTaskId, { ensemble: false, teamId: null });
        }
      } else {
        const prev = useTaskStore.getState().pendingNewTask;
        if (prev?.gatewayId === selectedGwId && prev?.agentId === effectiveAgentId && !prev?.ensemble && !prev?.teamId)
          return;
        useTaskStore.getState().setPending({ gatewayId: selectedGwId, agentId: effectiveAgentId });
      }
    } else if (activeTab === 'team') {
      if (!teamsLoadedOnce) return;
      const currentTeamValid = selectedTeamId && teamsMap[selectedTeamId]?.gatewayId === selectedGwId;
      const effectiveTeamId = currentTeamValid ? selectedTeamId : (teamsForSelectedGateway[0]?.id ?? null);

      if (effectiveTeamId !== selectedTeamId) {
        setSelectedTeamId(effectiveTeamId);
      }

      if (!effectiveTeamId) {
        if (!defaultAgentId) return;
        if (activeTaskId) return;
        const prev = useTaskStore.getState().pendingNewTask;
        if (prev?.gatewayId === selectedGwId && prev?.agentId === defaultAgentId && !prev?.ensemble && !prev?.teamId)
          return;
        useTaskStore.getState().setPending({ gatewayId: selectedGwId, agentId: defaultAgentId });
        return;
      }

      const team = teamsMap[effectiveTeamId];
      if (!team || team.gatewayId !== selectedGwId) return;
      const manager = team.agents.find((a) => a.isManager);
      const agentId = manager?.agentId ?? team.agents[0]?.agentId ?? '';
      const needsEnsemble = team.agents.length >= 2;
      if (activeTaskId) {
        if (!!activeTaskEnsemble !== needsEnsemble || activeTaskTeamId !== effectiveTeamId) {
          updateTaskMetadata(activeTaskId, {
            ensemble: needsEnsemble,
            teamId: effectiveTeamId,
          });
        }
      } else {
        const prev = useTaskStore.getState().pendingNewTask;
        if (
          prev?.gatewayId === team.gatewayId &&
          prev?.agentId === agentId &&
          !!prev?.ensemble === needsEnsemble &&
          prev?.teamId === effectiveTeamId
        )
          return;
        useTaskStore.getState().setPending({
          gatewayId: team.gatewayId,
          agentId,
          ensemble: needsEnsemble,
          teamId: effectiveTeamId,
        });
      }
    } else if (activeTab === 'orchestrate') {
      if (activeTaskId) {
        if (!activeTaskEnsemble || activeTaskTeamId) {
          updateTaskMetadata(activeTaskId, { ensemble: true, teamId: null });
        }
      } else {
        const prev = useTaskStore.getState().pendingNewTask;
        if (
          prev?.gatewayId === selectedGwId &&
          prev?.agentId === defaultAgentId &&
          prev?.ensemble === true &&
          !prev?.teamId
        )
          return;
        useTaskStore.getState().setPending({
          gatewayId: selectedGwId,
          agentId: defaultAgentId,
          ensemble: true,
        });
      }
    }
  }, [
    activeTab,
    selectedGwId,
    effectiveAgentId,
    selectedTeamId,
    teamsMap,
    teamsLoadedOnce,
    defaultAgentId,
    agentCatalog,
    activeTaskId,
    activeTaskEnsemble,
    activeTaskTeamId,
    updateTaskMetadata,
    teamsForSelectedGateway,
  ]);

  const handleSelectGateway = useCallback(
    (gwId: string) => {
      setSelectedGwId(gwId);
    },
    [setSelectedGwId],
  );

  const handleSelectTeam = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
  }, []);

  const handleBrowseHub = useCallback(() => {
    setMainView('teams');
  }, [setMainView]);

  const visibleTabs = useMemo(() => {
    const all: { id: WelcomeTab; label: string; icon: typeof Bot; visible: boolean }[] = [
      { id: 'agent', label: t('mainArea.tabAgent'), icon: Bot, visible: true },
      { id: 'team', label: t('mainArea.tabTeam'), icon: Users, visible: true },
      {
        id: 'orchestrate',
        label: t('mainArea.tabOrchestrate'),
        icon: Sparkles,
        visible: hasMultipleAgents,
      },
    ];
    return all.filter((tab) => tab.visible);
  }, [t, hasMultipleAgents]);

  return (
    <motion.div
      {...animationPresets.fadeIn}
      className="flex flex-col items-center justify-center h-full text-center py-20"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 scale-[2.5] rounded-full bg-[var(--accent)] opacity-[0.06] blur-2xl" />
        <img src={logo} alt="ClawWork" className="relative w-16 h-16 rounded-2xl shadow-[var(--glow-accent)]" />
      </div>
      <h3 className="type-page-title mb-6 text-[var(--text-primary)]">ClawWork</h3>

      <div className="flex flex-col items-center w-full max-w-lg">
        <div className="flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] p-1.5">
          {visibleTabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              icon={tab.icon}
              label={tab.label}
              onSelectTab={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <GatewayInstanceSelector
          gateways={gateways}
          selectedGatewayId={selectedGwId}
          onSelectGateway={handleSelectGateway}
          showLabel={false}
          className="mt-5"
        />

        <div className="mt-4">
          {activeTab === 'team' && (
            <TeamTabContent
              teams={teamsForSelectedGateway}
              selectedTeamId={selectedTeamId}
              onSelect={handleSelectTeam}
              onBrowseHub={handleBrowseHub}
            />
          )}

          {activeTab === 'orchestrate' && <OrchestrateTabContent agentCount={agentCatalog.length} />}
        </div>
      </div>

      <a
        href="https://github.com/clawwork-ai/clawwork"
        target="_blank"
        rel="noreferrer"
        className="type-support mt-10 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        {t('mainArea.starOnGithub')} ⭐
      </a>
    </motion.div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onSelectTab,
}: {
  active: boolean;
  icon: typeof Bot;
  label: string;
  onSelectTab: () => void;
}) {
  const baseClass = cn(
    'type-body inline-flex items-center gap-2 rounded-full transition-all',
    active
      ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
  );

  return (
    <button onClick={onSelectTab} className={cn(baseClass, 'px-6 py-2.5 cursor-pointer')}>
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

function TeamTabContent({
  teams,
  selectedTeamId,
  onSelect,
  onBrowseHub,
}: {
  teams: Team[];
  selectedTeamId: string | null;
  onSelect: (id: string) => void;
  onBrowseHub: () => void;
}) {
  const { t } = useTranslation();

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="type-body text-[var(--text-muted)]">{t('mainArea.teamEmpty')}</p>
        <button
          onClick={onBrowseHub}
          className="type-label inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline cursor-pointer"
        >
          <Compass size={13} />
          {t('mainArea.browseHub')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-stretch justify-center gap-2">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => onSelect(team.id)}
            className={cn(
              'inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 flex-1 min-w-0 max-w-48 transition-all cursor-pointer',
              'border',
              team.id === selectedTeamId
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-hover)]',
            )}
          >
            <span className="emoji-md flex-shrink-0">{team.emoji}</span>
            <div className="flex flex-col items-start gap-0.5 min-w-0">
              <span
                className={cn(
                  'type-label truncate w-full text-left',
                  team.id === selectedTeamId ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]',
                )}
              >
                {team.name}
              </span>
              <span className="type-support text-[var(--text-muted)]">
                {t('teams.memberCount', { count: team.agents.length })}
              </span>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={onBrowseHub}
        className="type-support inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
      >
        <Compass size={11} />
        {t('mainArea.browseHub')}
      </button>
    </div>
  );
}

function OrchestrateTabContent({ agentCount }: { agentCount: number }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-2 py-2 max-w-xs">
      <p className="type-body text-[var(--text-secondary)]">{t('mainArea.orchestrateCount', { count: agentCount })}</p>
      <p className="type-support text-[var(--text-muted)] leading-relaxed">{t('mainArea.orchestrateDesc')}</p>
    </div>
  );
}
