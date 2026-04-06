import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Trash2, Plus, X, Crown, Loader2 } from 'lucide-react';
import type { AgentInfo } from '@clawwork/shared';
import { parseIdentityMd } from '@clawwork/core';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useUiStore } from '@/platform';
import type { AgentDraft } from './types';
import { inputClass } from './utils';

const EMPTY_MODELS: { id: string; name?: string; provider?: string }[] = [];

function modelLabel(modelId: string, models: { id: string; name?: string; provider?: string }[]): string {
  if (!modelId) return '';
  const m = models.find((x) => x.id === modelId);
  if (!m) return modelId;
  return m.name ?? m.id;
}

interface AgentDraftCardProps {
  agent: AgentDraft;
  index: number;
  isFirst: boolean;
  canRemove: boolean;
  gatewayId: string;
  availableExisting: AgentInfo[];
  onUpdate: (patch: Partial<AgentDraft>) => void;
  onRemove: () => void;
}

export default function AgentDraftCard({
  agent,
  index,
  isFirst,
  canRemove,
  gatewayId,
  availableExisting,
  onUpdate,
  onRemove,
}: AgentDraftCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(index < 2);
  const [activeTab, setActiveTab] = useState(agent.existingAgentId ? 'skills' : 'agent-md');
  const [skillInput, setSkillInput] = useState('');
  const [pickOpen, setPickOpen] = useState(false);
  const [existingSkillNames, setExistingSkillNames] = useState<string[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsLoadedFor, setDetailsLoadedFor] = useState<string | null>(null);
  const modelCatalogByGateway = useUiStore((s) => s.modelCatalogByGateway);
  const models = (gatewayId ? modelCatalogByGateway[gatewayId] : null) ?? EMPTY_MODELS;
  const isExisting = !!agent.existingAgentId;

  const switchToNew = () => {
    onUpdate({ existingAgentId: undefined, name: '', description: '', model: '', agentMd: '', soulMd: '', skills: [] });
    setExistingSkillNames([]);
    setDetailsLoadedFor(null);
    setActiveTab('agent-md');
  };

  const pickExisting = (info: AgentInfo) => {
    onUpdate({
      existingAgentId: info.id,
      name: info.name ?? info.id,
      description: '',
      model: info.model?.primary ?? '',
      agentMd: '',
      soulMd: '',
      skills: [],
    });
    setExistingSkillNames([]);
    setDetailsLoadedFor(null);
    setActiveTab('agent-md');
    setPickOpen(false);
  };

  useEffect(() => {
    if (!agent.existingAgentId || !gatewayId) return;
    if (detailsLoadedFor === agent.existingAgentId) return;

    const abortController = new AbortController();
    setLoadingDetails(true);

    Promise.allSettled([
      window.clawwork.getAgentFile(gatewayId, agent.existingAgentId, 'IDENTITY.md'),
      window.clawwork.getAgentFile(gatewayId, agent.existingAgentId, 'SOUL.md'),
      window.clawwork.getSkillsStatus(gatewayId, agent.existingAgentId),
    ]).then(([identityRes, soulRes, skillsRes]) => {
      if (abortController.signal.aborted) return;
      const patch: Partial<AgentDraft> = {};
      if (identityRes.status === 'fulfilled' && identityRes.value.ok && identityRes.value.result) {
        const data = identityRes.value.result as Record<string, unknown>;
        if (typeof data.content === 'string') {
          const parsed = parseIdentityMd(data.content);
          patch.description = parsed.description ?? '';
          patch.agentMd = parsed.body;
        }
      }
      if (soulRes.status === 'fulfilled' && soulRes.value.ok && soulRes.value.result) {
        const data = soulRes.value.result as Record<string, unknown>;
        if (typeof data.content === 'string') patch.soulMd = data.content;
      }
      if (skillsRes.status === 'fulfilled' && skillsRes.value.ok && skillsRes.value.result) {
        const data = skillsRes.value.result as Record<string, unknown>;
        const skills = data.skills as Array<{ name: string }> | undefined;
        if (skills) setExistingSkillNames(skills.map((s) => s.name));
      }
      if (Object.keys(patch).length > 0) onUpdate(patch);
      setDetailsLoadedFor(agent.existingAgentId!);
      setLoadingDetails(false);
    });

    return () => abortController.abort();
  }, [agent.existingAgentId, gatewayId, detailsLoadedFor, onUpdate]);

  const addSkill = () => {
    const slug = skillInput.trim();
    if (slug && !agent.skills.includes(slug)) {
      onUpdate({ skills: [...agent.skills, slug] });
      setSkillInput('');
    }
  };

  const removeSkill = (slug: string) => {
    onUpdate({ skills: agent.skills.filter((s) => s !== slug) });
  };

  const displayModel = modelLabel(agent.model, models);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-hover)] cursor-pointer"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-[var(--text-muted)]" />
        ) : (
          <ChevronRight size={14} className="text-[var(--text-muted)]" />
        )}
        <span className="type-body font-medium text-[var(--text-primary)] flex-1 text-left truncate">
          {agent.name || t('teams.wizard.agentNamePlaceholder')}
        </span>
        {agent.role === 'coordinator' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 type-meta text-[var(--accent)]">
            <Crown size={10} />
            {t('teams.wizard.coordinator')}
          </span>
        )}
        {displayModel && <span className="type-meta text-[var(--text-muted)] truncate max-w-32">{displayModel}</span>}
        {canRemove && !isFirst && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-danger)] hover:bg-[var(--bg-hover)] cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-3">
          <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-tertiary)] p-1 w-fit">
            <button
              onClick={switchToNew}
              className={cn(
                'type-label px-3 py-1 rounded-md transition-all',
                !isExisting
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-card)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              )}
            >
              {t('teams.wizard.createNew')}
            </button>
            <Popover open={pickOpen} onOpenChange={setPickOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'type-label px-3 py-1 rounded-md transition-all',
                    isExisting
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-card)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  )}
                >
                  {isExisting ? agent.name : t('teams.wizard.selectExisting')}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-1">
                {availableExisting.length === 0 ? (
                  <div className="px-3 py-2 type-body text-[var(--text-muted)]">{t('teams.noAgents')}</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    {availableExisting.map((info) => (
                      <button
                        key={info.id}
                        onClick={() => pickExisting(info)}
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 transition-colors hover:bg-[var(--bg-hover)] cursor-pointer"
                      >
                        {info.identity?.emoji && <span className="emoji-sm">{info.identity.emoji}</span>}
                        <span className="type-body text-[var(--text-primary)] truncate">{info.name ?? info.id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {isExisting ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] px-3 py-2">
                <span className="type-body text-[var(--text-primary)] flex-1">{agent.name}</span>
                {displayModel && <span className="type-meta text-[var(--text-muted)]">{displayModel}</span>}
                {loadingDetails && <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />}
              </div>
              {agent.description && (
                <div className="space-y-1">
                  <label className="type-meta text-[var(--text-muted)]">{t('teams.wizard.description')}</label>
                  <p className="type-body rounded-md bg-[var(--bg-primary)] border border-[var(--border)] px-3 py-2 text-[var(--text-secondary)]">
                    {agent.description}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="type-meta text-[var(--text-muted)]">{t('teams.wizard.agentName')}</label>
                  <input
                    type="text"
                    value={agent.name}
                    onChange={(e) => onUpdate({ name: e.target.value.slice(0, 50) })}
                    placeholder={t('teams.wizard.agentNamePlaceholder')}
                    maxLength={50}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="type-meta text-[var(--text-muted)]">{t('teams.wizard.role')}</label>
                  <div className={cn(inputClass, 'flex items-center opacity-60 cursor-default')}>
                    {isFirst ? t('teams.wizard.coordinator') : t('teams.wizard.worker')}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="type-meta text-[var(--text-muted)]">{t('teams.wizard.model')}</label>
                  <select
                    value={agent.model}
                    onChange={(e) => onUpdate({ model: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">{t('teams.wizard.modelDefault')}</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name ?? m.id}
                        {m.provider ? ` (${m.provider})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="type-meta text-[var(--text-muted)]">{t('teams.wizard.description')}</label>
                <input
                  type="text"
                  value={agent.description}
                  onChange={(e) => onUpdate({ description: e.target.value.slice(0, 200) })}
                  placeholder={t('teams.wizard.descriptionPlaceholder')}
                  maxLength={200}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="agent-md">IDENTITY.md</TabsTrigger>
              <TabsTrigger value="soul-md">SOUL.md</TabsTrigger>
              <TabsTrigger value="skills">
                {t('teams.wizard.skills')}
                {agent.skills.length + existingSkillNames.length > 0 &&
                  ` (${agent.skills.length + existingSkillNames.length})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {(activeTab === 'agent-md' || activeTab === 'soul-md') &&
            (() => {
              const field = activeTab === 'agent-md' ? 'agentMd' : 'soulMd';
              const placeholder =
                activeTab === 'agent-md' ? t('teams.wizard.agentMdPlaceholder') : t('teams.wizard.soulMdPlaceholder');
              return isExisting ? (
                <pre className="type-mono-data max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--bg-primary)] border border-[var(--border)] p-3 text-[var(--text-secondary)]">
                  {agent[field] || t('common.noFiles')}
                </pre>
              ) : (
                <textarea
                  value={agent[field]}
                  onChange={(e) => onUpdate({ [field]: e.target.value })}
                  placeholder={placeholder}
                  rows={6}
                  className="type-mono-data w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] glow-focus focus:border-transparent transition-all resize-none"
                />
              );
            })()}

          {activeTab === 'skills' && (
            <div className="space-y-2">
              {existingSkillNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {existingSkillNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-tertiary)] px-2.5 py-0.5 type-meta text-[var(--text-muted)]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder={t('teams.wizard.skillSlugPlaceholder')}
                  className={cn(inputClass, 'flex-1')}
                />
                <Button size="sm" variant="outline" onClick={addSkill} disabled={!skillInput.trim()}>
                  <Plus size={14} />
                </Button>
              </div>
              {agent.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {agent.skills.map((slug) => (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-tertiary)] px-2.5 py-0.5 type-meta text-[var(--text-secondary)]"
                    >
                      {slug}
                      <button
                        onClick={() => removeSkill(slug)}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
