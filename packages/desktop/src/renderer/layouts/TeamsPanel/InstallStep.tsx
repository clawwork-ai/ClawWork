import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, AlertTriangle, Loader2, Crown, Users } from 'lucide-react';
import type { InstallEvent } from '@clawwork/shared';
import { cn } from '@/lib/utils';
import type { AgentDraft } from './types';
import { toSlug } from './utils';

interface AgentInstallState {
  slug: string;
  status: 'pending' | 'creating' | 'created' | 'warning';
  files: Array<{ name: string; ok: boolean }>;
  skills: Array<{ id: string; ok: boolean }>;
  warnings: string[];
}

function buildAgentStates(
  agents: AgentDraft[],
  events: InstallEvent[],
): {
  agentStates: AgentInstallState[];
  teamSaved: boolean;
  globalWarnings: string[];
  globalError: string | null;
} {
  const stateMap = new Map<string, AgentInstallState>();
  for (const a of agents) {
    const slug = toSlug(a.name);
    stateMap.set(slug, { slug, status: 'pending', files: [], skills: [], warnings: [] });
  }

  let teamSaved = false;
  const globalWarnings: string[] = [];
  let globalError: string | null = null;

  for (const e of events) {
    const s = e.agentSlug ? stateMap.get(e.agentSlug) : undefined;
    switch (e.type) {
      case 'agent_creating':
        if (s) s.status = 'creating';
        break;
      case 'agent_created':
        if (s) s.status = 'created';
        break;
      case 'file_set':
        if (s && e.fileName) s.files.push({ name: e.fileName, ok: true });
        break;
      case 'file_setting':
        break;
      case 'skill_installed':
        if (s && e.skillId) s.skills.push({ id: e.skillId, ok: true });
        break;
      case 'skill_installing':
        break;
      case 'team_persisted':
        teamSaved = true;
        break;
      case 'warning':
        if (s) {
          s.warnings.push(e.message ?? 'Warning');
          if (s.status === 'creating') s.status = 'warning';
        } else {
          globalWarnings.push(e.message ?? 'Warning');
        }
        break;
      case 'error':
        globalError = e.message ?? 'Installation failed';
        break;
    }
  }

  const agentStates = agents.map((a) => stateMap.get(toSlug(a.name))!).filter(Boolean);
  return { agentStates, teamSaved, globalWarnings, globalError };
}

interface InstallStepProps {
  teamInfo: { name: string; emoji: string; description: string };
  agents: AgentDraft[];
  status: 'idle' | 'installing' | 'done' | 'error';
  events: InstallEvent[];
  isEdit?: boolean;
}

export default function InstallStep({ teamInfo, agents, status, events, isEdit }: InstallStepProps) {
  const { t } = useTranslation();

  const lastProgress = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].progress) return events[i].progress;
    }
    return null;
  }, [events]);

  const progressPercent = lastProgress ? Math.round((lastProgress.current / lastProgress.total) * 100) : 0;

  const { agentStates, teamSaved, globalWarnings, globalError } = useMemo(
    () => buildAgentStates(agents, events),
    [agents, events],
  );

  if (status === 'idle') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--bg-tertiary)]">
            <span className="emoji-lg">{teamInfo.emoji}</span>
          </span>
          <div>
            <h3 className="type-section-title text-[var(--text-primary)]">{teamInfo.name}</h3>
            {teamInfo.description && (
              <p className="type-body text-[var(--text-secondary)] line-clamp-2">{teamInfo.description}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 type-label text-[var(--text-secondary)]">
            <Users size={14} />
            {t('teams.wizard.agentCount', { count: agents.length })}
          </div>
          <div className="space-y-1.5">
            {agents.map((agent) => (
              <div
                key={agent.uid}
                className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2"
              >
                <span className="type-body font-medium text-[var(--text-primary)] flex-1">{agent.name}</span>
                {agent.existingAgentId && (
                  <span className="type-meta text-[var(--text-muted)]">{t('teams.wizard.existing')}</span>
                )}
                {agent.role === 'coordinator' && (
                  <span className="inline-flex items-center gap-1 type-meta text-[var(--accent)]">
                    <Crown size={10} />
                    {t('teams.wizard.coordinator')}
                  </span>
                )}
                {agent.model && (
                  <span className="type-meta text-[var(--text-muted)] truncate max-w-32">{agent.model}</span>
                )}
                {agent.skills.length > 0 && (
                  <span className="type-meta text-[var(--text-muted)]">
                    {agent.skills.length} {t('teams.wizard.skills').toLowerCase()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="type-label text-[var(--text-secondary)]">
            {status === 'installing' && (isEdit ? t('teams.wizard.saving') : t('teams.wizard.installing'))}
            {status === 'done' && (isEdit ? t('teams.wizard.saveComplete') : t('teams.wizard.installComplete'))}
            {status === 'error' && (isEdit ? t('teams.wizard.saveError') : t('teams.wizard.installError'))}
          </span>
          {lastProgress && <span className="type-meta text-[var(--text-muted)]">{progressPercent}%</span>}
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              status === 'error' ? 'bg-[var(--text-danger)]' : 'bg-[var(--accent)]',
            )}
            style={{ width: `${status === 'done' ? 100 : progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {agentStates.map((agent) => (
          <div key={agent.slug} className="rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2">
            <div className="flex items-center gap-2">
              <AgentStatusIcon status={agent.status} />
              <span className="type-body font-medium text-[var(--text-primary)] flex-1">{agent.slug}</span>
              {agent.files.length > 0 && (
                <span className="type-meta text-[var(--text-muted)]">{agent.files.map((f) => f.name).join(', ')}</span>
              )}
              {agent.skills.length > 0 && (
                <span className="type-meta text-[var(--text-muted)]">
                  {agent.skills.length} {t('teams.wizard.skills').toLowerCase()}
                </span>
              )}
            </div>
            {agent.warnings.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {agent.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 type-meta text-[var(--text-warning)]">
                    <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {teamSaved && (
          <div className="flex items-center gap-2 px-3 py-2 type-meta text-[var(--accent)]">
            <Check size={12} />
            {isEdit ? t('teams.wizard.teamUpdated') : t('teams.wizard.teamSaved')}
          </div>
        )}

        {globalWarnings.map((w, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 type-meta text-[var(--text-warning)]">
            <AlertTriangle size={12} />
            {w}
          </div>
        ))}

        {globalError && (
          <div className="flex items-center gap-2 px-3 py-2 type-meta text-[var(--text-danger)]">
            <AlertTriangle size={12} />
            {globalError}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentStatusIcon({ status }: { status: AgentInstallState['status'] }) {
  switch (status) {
    case 'pending':
      return <div className="h-3 w-3 rounded-full border border-[var(--border)]" />;
    case 'creating':
      return <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />;
    case 'created':
      return <Check size={12} className="text-[var(--accent)]" />;
    case 'warning':
      return <AlertTriangle size={12} className="text-[var(--text-warning)]" />;
  }
}
