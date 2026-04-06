import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, AlertCircle } from 'lucide-react';
import type { AgentInfo } from '@clawwork/shared';
import { Button } from '@/components/ui/button';
import type { AgentDraft } from './types';
import { createAgentDraft } from './utils';
import AgentDraftCard from './AgentDraftCard';

interface AgentConfigStepProps {
  agents: AgentDraft[];
  onChange: (agents: AgentDraft[]) => void;
  gatewayId: string;
}

export default function AgentConfigStep({ agents, onChange, gatewayId }: AgentConfigStepProps) {
  const { t } = useTranslation();
  const [existingAgents, setExistingAgents] = useState<AgentInfo[]>([]);

  useEffect(() => {
    if (!gatewayId) return;
    window.clawwork
      .listAgents(gatewayId)
      .then((res) => {
        if (res.ok && res.result) {
          const payload = res.result as { agents?: AgentInfo[] };
          setExistingAgents(payload.agents ?? []);
        }
      })
      .catch((err) => console.error('Failed to list agents', err));
  }, [gatewayId]);

  const addAgent = useCallback(() => {
    onChange([...agents, createAgentDraft('worker')]);
  }, [agents, onChange]);

  const updateAgent = useCallback(
    (uid: string, patch: Partial<AgentDraft>) => {
      onChange(agents.map((a) => (a.uid === uid ? { ...a, ...patch } : a)));
    },
    [agents, onChange],
  );

  const removeAgent = useCallback(
    (uid: string) => {
      onChange(agents.filter((a) => a.uid !== uid));
    },
    [agents, onChange],
  );

  const hasCoordinator = agents.some((a) => a.role === 'coordinator');
  const showWarnings = agents.length >= 2 && !hasCoordinator;
  const availableExisting = useMemo(() => {
    const usedIds = new Set(agents.filter((a) => a.existingAgentId).map((a) => a.existingAgentId));
    return existingAgents.filter((a) => !usedIds.has(a.id));
  }, [agents, existingAgents]);

  return (
    <div className="space-y-4">
      {showWarnings && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border-warning)] bg-[var(--bg-warning)] px-3 py-2">
          <AlertCircle size={14} className="text-[var(--text-warning)] flex-shrink-0" />
          <span className="type-body text-[var(--text-warning)]">{t('teams.wizard.needCoordinator')}</span>
        </div>
      )}

      <div className="space-y-3">
        {agents.map((agent, index) => (
          <AgentDraftCard
            key={agent.uid}
            agent={agent}
            index={index}
            isFirst={index === 0}
            canRemove={agents.length > 2}
            gatewayId={gatewayId}
            availableExisting={availableExisting}
            onUpdate={(patch) => updateAgent(agent.uid, patch)}
            onRemove={() => removeAgent(agent.uid)}
          />
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addAgent} className="w-full">
        <Plus size={14} />
        {t('teams.wizard.addAgent')}
      </Button>

      {agents.length < 2 && (
        <p className="type-meta text-[var(--text-muted)] text-center">{t('teams.wizard.needTwoAgents')}</p>
      )}
    </div>
  );
}
