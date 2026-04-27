import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Trash2, X, Crown, Loader2, Search, Check } from 'lucide-react';
import type { AgentInfo, SkillSearchResultEntry, SkillStatusEntry, SkillStatusReport } from '@clawwork/shared';
import { parseIdentityMd } from '@clawwork/core';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useUiStore } from '@/platform';
import type { AgentDraft } from './types';
import { inputClass } from './utils';

const EMPTY_MODELS: { id: string; name?: string; provider?: string }[] = [];

interface SkillPickItem {
  id: string;
  title: string;
  description?: string;
  source: 'installed' | 'clawhub';
}

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
  lockExisting?: boolean;
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
  lockExisting,
  onUpdate,
  onRemove,
}: AgentDraftCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(agent.expandedByDefault ?? index < 2);
  const [activeTab, setActiveTab] = useState(agent.existingAgentId ? 'skills' : 'agent-md');
  const [skillInput, setSkillInput] = useState('');
  const [skillResults, setSkillResults] = useState<SkillSearchResultEntry[]>([]);
  const [skillSearching, setSkillSearching] = useState(false);
  const [skillSearched, setSkillSearched] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsLoadedFor, setDetailsLoadedFor] = useState<string | null>(null);
  const skillSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skillSearchEpoch = useRef(0);
  const modelCatalogByGateway = useUiStore((s) => s.modelCatalogByGateway);
  const skillsStatus = useUiStore((s) => (gatewayId ? s.skillsStatusByGateway[gatewayId] : undefined));
  const setSkillsStatusForGateway = useUiStore((s) => s.setSkillsStatusForGateway);
  const models = (gatewayId ? modelCatalogByGateway[gatewayId] : null) ?? EMPTY_MODELS;
  const isExisting = !!agent.existingAgentId;
  const canSwitchMode = !lockExisting;

  const switchToNew = () => {
    onUpdate({ existingAgentId: undefined, name: '', description: '', model: '', agentMd: '', soulMd: '', skills: [] });
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
    ]).then(([identityRes, soulRes]) => {
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
      if (Object.keys(patch).length > 0) onUpdate(patch);
      setDetailsLoadedFor(agent.existingAgentId!);
      setLoadingDetails(false);
    });

    return () => abortController.abort();
  }, [agent.existingAgentId, gatewayId, detailsLoadedFor, onUpdate]);

  const addSkill = useCallback(
    (slug: string) => {
      if (!slug || agent.skills.includes(slug)) return;
      onUpdate({ skills: [...agent.skills, slug] });
    },
    [agent.skills, onUpdate],
  );

  const removeSkill = (slug: string) => {
    onUpdate({ skills: agent.skills.filter((s) => s !== slug) });
  };

  useEffect(() => {
    if (activeTab !== 'skills' || !gatewayId || skillsStatus) return;
    let cancelled = false;
    setLoadingSkills(true);
    window.clawwork.getSkillsStatus(gatewayId).then((res) => {
      if (cancelled) return;
      if (res.ok && res.result) setSkillsStatusForGateway(gatewayId, res.result as unknown as SkillStatusReport);
      setLoadingSkills(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, gatewayId, skillsStatus, setSkillsStatusForGateway]);

  const runSkillSearch = useCallback(
    async (query: string) => {
      if (!gatewayId) return;
      const epoch = ++skillSearchEpoch.current;
      setSkillSearching(true);
      setSkillSearched(true);
      const res = await window.clawwork.searchSkills(gatewayId, { query, limit: 20 });
      if (epoch !== skillSearchEpoch.current) return;
      setSkillResults(res.ok && res.result ? res.result.results : []);
      setSkillSearching(false);
    },
    [gatewayId],
  );

  const handleSkillQueryChange = useCallback(
    (value: string) => {
      setSkillInput(value);
      if (skillSearchTimer.current) clearTimeout(skillSearchTimer.current);
      const query = value.trim();
      if (!query) {
        skillSearchEpoch.current += 1;
        setSkillResults([]);
        setSkillSearching(false);
        setSkillSearched(false);
        return;
      }
      skillSearchTimer.current = setTimeout(() => runSkillSearch(query), 250);
    },
    [runSkillSearch],
  );

  useEffect(() => {
    return () => {
      if (skillSearchTimer.current) clearTimeout(skillSearchTimer.current);
    };
  }, []);

  const installedSkillItems = useMemo<SkillPickItem[]>(
    () =>
      (skillsStatus?.skills ?? []).map((skill: SkillStatusEntry) => ({
        id: skill.skillKey || skill.name,
        title: skill.name || skill.skillKey,
        description: skill.description,
        source: 'installed',
      })),
    [skillsStatus],
  );

  const searchSkillItems = useMemo<SkillPickItem[]>(
    () =>
      skillResults.map((skill) => ({
        id: skill.slug,
        title: skill.displayName || skill.slug,
        description: skill.summary,
        source: 'clawhub',
      })),
    [skillResults],
  );

  const skillPickItems = skillInput.trim() ? searchSkillItems : installedSkillItems;

  const displayModel = modelLabel(agent.model, models);

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex items-center transition-colors hover:bg-[var(--bg-hover)]">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-4 py-3"
        >
          {expanded ? (
            <ChevronDown size={14} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronRight size={14} className="text-[var(--text-muted)]" />
          )}
          <span className="type-body flex-1 truncate text-left font-medium text-[var(--text-primary)]">
            {agent.name || t('teams.wizard.agentNamePlaceholder')}
          </span>
          {agent.role === 'coordinator' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 type-meta text-[var(--accent)]">
              <Crown size={10} />
              {t('teams.wizard.coordinator')}
            </span>
          )}
          {displayModel && <span className="max-w-32 truncate type-meta text-[var(--text-muted)]">{displayModel}</span>}
          {isExisting && loadingDetails && <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />}
        </button>
        {canRemove && !isFirst && (
          <button
            type="button"
            onClick={onRemove}
            className="mr-3 flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-danger)]"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-3">
          {canSwitchMode && (
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
          )}

          {isExisting ? (
            agent.description ? (
              <div className="space-y-1">
                <label className="type-meta text-[var(--text-muted)]">{t('teams.wizard.description')}</label>
                <p className="type-body rounded-md bg-[var(--bg-primary)] border border-[var(--border)] px-3 py-2 text-[var(--text-secondary)]">
                  {agent.description}
                </p>
              </div>
            ) : null
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
                {agent.skills.length > 0 && ` (${agent.skills.length})`}
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
              <div className="flex items-center gap-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] px-3 py-2">
                <Search size={14} className="flex-shrink-0 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => handleSkillQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const first = skillPickItems.find((skill) => !agent.skills.includes(skill.id));
                      if (first) addSkill(first.id);
                    }
                  }}
                  placeholder={t('settings.skillHubSearchPlaceholder')}
                  className="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] type-label outline-none"
                />
                {(skillSearching || loadingSkills) && (
                  <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                )}
              </div>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--bg-primary)] p-1">
                {skillPickItems.length > 0 ? (
                  skillPickItems.map((skill) => {
                    const selected = agent.skills.includes(skill.id);
                    return (
                      <button
                        key={`${skill.source}-${skill.id}`}
                        type="button"
                        onClick={() => addSkill(skill.id)}
                        disabled={selected}
                        className={cn(
                          'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors',
                          selected ? 'cursor-default opacity-70' : 'cursor-pointer hover:bg-[var(--bg-hover)]',
                        )}
                      >
                        <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center text-[var(--text-muted)]">
                          {selected ? <Check size={13} /> : <Search size={12} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="type-support block truncate text-[var(--text-primary)]">{skill.title}</span>
                          <span className="type-mono-data block truncate text-[var(--text-muted)]">{skill.id}</span>
                          {skill.description && (
                            <span className="type-meta mt-0.5 line-clamp-2 block text-[var(--text-secondary)]">
                              {skill.description}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="type-support px-2 py-2 text-[var(--text-muted)]">
                    {skillSearching
                      ? t('settings.skillHubSearching')
                      : skillInput.trim() && skillSearched
                        ? t('settings.skillHubNoResults')
                        : t('settings.skillHubPrompt')}
                  </p>
                )}
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
