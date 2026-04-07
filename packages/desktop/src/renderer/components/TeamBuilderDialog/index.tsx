import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  X,
  Crown,
  Users,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ModelCatalogEntry, InstallEvent } from '@clawwork/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import MarkdownContent from '@/components/MarkdownContent';
import ConfirmDialog from '@/components/semantic/ConfirmDialog';
import { useUiStore } from '@/stores/uiStore';
import { useSystemSession } from '@/hooks/useSystemSession';
import { useDialogGuard } from '@/hooks/useDialogGuard';
import { useTeamStore } from '@/stores/teamStore';
import { useTeamInstall } from '@/layouts/TeamsPanel/useTeamInstall';
import { toSlug, EMOJI_OPTIONS } from '@/layouts/TeamsPanel/utils';
import type { AgentDraft, TeamInfo } from '@/layouts/TeamsPanel/types';

interface AgentConfig {
  name: string;
  role: 'coordinator' | 'worker';
  description: string;
  model: string;
  identity: string;
}

interface TeamConfig {
  name: string;
  emoji: string;
  description: string;
  agents: AgentConfig[];
}

const EMPTY_CONFIG: TeamConfig = { name: '', emoji: '🤖', description: '', agents: [] };

const EMPTY_MODELS: ModelCatalogEntry[] = [];

const VALID_ROLES = new Set<string>(['coordinator', 'worker']);

const SYSTEM_PROMPT_TEMPLATE = `You are a Team creation assistant for ClawWork. Help the user create a new AI Team — a group of specialized Agents that work together on tasks.

Your job:
1. Ask what kind of Team the user wants and what tasks it should handle
2. Based on their description, suggest a team name, description, emoji, and a set of agents with their roles
3. Each team needs at least one coordinator (who orchestrates the workflow) and one or more workers (who handle specific tasks)
4. Recommend models for each agent from the available list: {{modelList}}
5. After each response, include a structured block with the current team config

Rules:
- Ask ONE question at a time
- Be proactive: extract team structure from the user's first description
- Team name and all agent names MUST be in English (ASCII only, e.g. "Research Team" not "研究团队") — they are used as system identifiers
- Team description should be a brief summary (under 200 chars) of the team's purpose
- Each agent needs: name, role (coordinator or worker), description (brief capability summary under 200 chars), model, and identity (system prompt, 2-4 sentences)
- A team must have at least 2 agents, with at least 1 coordinator
- Always end your response with the current config as a JSON block
- Only include fields whose values have been determined
- Example:

\`\`\`team-config
{"name": "Research Team", "emoji": "🔬", "description": "Deep research and analysis team", "agents": [{"name": "Research Lead", "role": "coordinator", "description": "Coordinates research tasks and synthesizes findings", "model": "gpt-4", "identity": "A research coordinator who plans research strategies and synthesizes findings from team members."}, {"name": "Data Analyst", "role": "worker", "description": "Analyzes data and generates insights", "model": "gpt-4", "identity": "A data analyst specializing in statistical analysis and data visualization."}]}
\`\`\`

Respond in {{language}}.

Now begin by asking what kind of Team the user wants to create.`;

const CONFIG_BLOCK_RE = /\n?```team-config\n([\s\S]*?)\n```\n?/g;
const CONFIG_BLOCK_PARTIAL_RE = /\n?```team-config[\s\S]*$/;

function sanitizeAgents(raw: unknown[]): AgentConfig[] {
  return raw
    .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
    .map((a) => ({
      name: typeof a.name === 'string' ? a.name : '',
      role: VALID_ROLES.has(a.role as string) ? (a.role as 'coordinator' | 'worker') : 'worker',
      description: typeof a.description === 'string' ? a.description : '',
      model: typeof a.model === 'string' ? a.model : '',
      identity: typeof a.identity === 'string' ? a.identity : '',
    }));
}

function parseTeamConfig(text: string): Partial<TeamConfig> | null {
  const matches = [...text.matchAll(CONFIG_BLOCK_RE)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  try {
    const raw = JSON.parse(last[1]);
    if (raw.agents && Array.isArray(raw.agents)) {
      raw.agents = sanitizeAgents(raw.agents);
    }
    return raw;
  } catch {
    return null;
  }
}

function stripConfigBlock(text: string): string {
  let result = text.replace(CONFIG_BLOCK_RE, '');
  result = result.replace(CONFIG_BLOCK_PARTIAL_RE, '');
  return result.trim();
}

function configToTeamInfo(config: TeamConfig, gatewayId: string): TeamInfo {
  return {
    name: config.name.trim(),
    emoji: config.emoji || '🤖',
    description: config.description.trim(),
    gatewayId,
  };
}

function configToAgentDrafts(config: TeamConfig): AgentDraft[] {
  return config.agents.map((a) => ({
    uid: crypto.randomUUID(),
    name: a.name.trim(),
    description: a.description.trim(),
    role: a.role,
    model: a.model,
    agentMd: a.identity.trim(),
    soulMd: '',
    skills: [],
  }));
}

const inputClass = cn(
  'flex-1 h-[var(--density-control-height-lg)] px-3 py-2 rounded-md',
  'bg-[var(--bg-tertiary)] border border-[var(--border)]',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
  'outline-none ring-accent-focus transition-colors',
);

interface TeamBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gatewayId: string;
  onCreated?: () => void;
}

export default function TeamBuilderDialog({ open, onOpenChange, gatewayId, onCreated }: TeamBuilderDialogProps) {
  const { t, i18n } = useTranslation();
  const { status, messages, error, start, send, end } = useSystemSession();

  const modelCatalogByGateway = useUiStore((s) => s.modelCatalogByGateway);
  const agentCatalogByGateway = useUiStore((s) => s.agentCatalogByGateway);
  const models = modelCatalogByGateway[gatewayId] ?? EMPTY_MODELS;
  const defaultAgentId = agentCatalogByGateway[gatewayId]?.defaultId ?? 'main';

  const loadTeams = useTeamStore((s) => s.loadTeams);
  const { installStatus, installEvents, runInstall, resetInstall } = useTeamInstall(loadTeams);

  const [config, setConfig] = useState<TeamConfig>(EMPTY_CONFIG);
  const [userEdited, setUserEdited] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevStatusRef = useRef(status);
  const startedRef = useRef(false);

  const isDirty = useCallback(() => {
    if (installStatus === 'installing') return true;
    if (installStatus === 'done' || installStatus === 'error') return false;
    return messages.length > 1;
  }, [installStatus, messages.length]);

  const doClose = useCallback(() => {
    end();
    resetInstall();
    onOpenChange(false);
  }, [end, resetInstall, onOpenChange]);

  const { confirmOpen, guardedOpenChange, contentProps, confirmDiscard, cancelDiscard } = useDialogGuard({
    isDirty,
    onConfirmClose: doClose,
  });

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    setConfig(EMPTY_CONFIG);
    setUserEdited(new Set());
    setInput('');
    setEmojiOpen(false);
    setExpandedAgent(null);
    resetInstall();

    const modelListStr = models.map((m) => `${m.name ?? m.id}${m.provider ? ` (${m.provider})` : ''}`).join(', ');
    const prompt = SYSTEM_PROMPT_TEMPLATE.replace('{{modelList}}', modelListStr || 'default').replace(
      '{{language}}',
      i18n.language,
    );

    start({
      gatewayId,
      agentId: defaultAgentId,
      purpose: 'team-builder',
      initialMessage: prompt,
    });
  }, [open, gatewayId, defaultAgentId, models, start, i18n.language, resetInstall]);

  useEffect(() => {
    if (status === 'streaming' || (prevStatusRef.current === 'streaming' && status === 'active')) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        const parsed = parseTeamConfig(lastMsg.content);
        if (parsed) {
          setConfig((prev) => ({
            name: userEdited.has('name') ? prev.name : (parsed.name ?? prev.name),
            emoji: userEdited.has('emoji') ? prev.emoji : (parsed.emoji ?? prev.emoji),
            description: userEdited.has('description') ? prev.description : (parsed.description ?? prev.description),
            agents: parsed.agents ?? prev.agents,
          }));
        }
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, userEdited]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (status === 'active') {
      inputRef.current?.focus();
    }
  }, [status]);

  const visibleMessages = useMemo(() => (messages.length > 1 ? messages.slice(1) : []), [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || status === 'streaming') return;
    setInput('');
    await send(text);
  }, [input, status, send]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const updateField = useCallback((field: 'name' | 'emoji' | 'description', value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setUserEdited((prev) => {
      const next = new Set(prev);
      if (value) next.add(field);
      else next.delete(field);
      return next;
    });
  }, []);

  const isValid = useMemo(() => {
    if (!config.name.trim()) return false;
    if (config.agents.length < 2) return false;
    if (!config.agents.some((a) => a.role === 'coordinator')) return false;
    if (!config.agents.every((a) => a.name.trim())) return false;
    const slugs = config.agents.map((a) => toSlug(a.name));
    if (new Set(slugs).size !== slugs.length) return false;
    return true;
  }, [config]);

  const handleCreate = useCallback(async () => {
    if (!isValid) return;
    await end();
    const teamInfo = configToTeamInfo(config, gatewayId);
    const agentDrafts = configToAgentDrafts(config);
    runInstall(teamInfo, agentDrafts);
  }, [isValid, config, gatewayId, end, runInstall]);

  useEffect(() => {
    if (!open) return;
    if (installStatus === 'done') {
      toast.success(t('teams.teamBuilderCreated'));
      onCreated?.();
      onOpenChange(false);
    }
    if (installStatus === 'error') {
      toast.error(t('teams.wizard.installError'));
    }
  }, [open, installStatus, onCreated, onOpenChange, t]);

  const lastProgress = useMemo(() => {
    for (let i = installEvents.length - 1; i >= 0; i--) {
      if (installEvents[i].progress) return installEvents[i].progress;
    }
    return null;
  }, [installEvents]);

  const progressPercent = lastProgress ? Math.round((lastProgress.current / lastProgress.total) * 100) : 0;

  const installing = installStatus === 'installing' || installStatus === 'done' || installStatus === 'error';

  return (
    <Dialog open={open} onOpenChange={guardedOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden [&>button:last-child]:hidden" {...contentProps}>
        <DialogHeader className="relative px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--accent)]" />
            {t('teams.teamBuilderTitle')}
          </DialogTitle>
          <DialogDescription>{t('teams.teamBuilderDesc')}</DialogDescription>
          <button
            type="button"
            onClick={() => guardedOpenChange(false)}
            disabled={installStatus === 'installing'}
            className="absolute right-4 top-4 rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </DialogHeader>

        <div className="flex h-144 border-t border-[var(--border-subtle)]">
          <div className="flex flex-1 flex-col border-r border-[var(--border-subtle)]">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {visibleMessages.map((msg, i) => (
                <div
                  key={`${msg.role}-${msg.timestamp}-${i}`}
                  className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={14} className="text-[var(--accent)]" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-xl px-3.5 py-2.5',
                      msg.role === 'user'
                        ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]',
                    )}
                  >
                    {msg.role === 'assistant' && !stripConfigBlock(msg.content) && status === 'streaming' ? (
                      <div className="flex items-center gap-1.5 py-1">
                        <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                      </div>
                    ) : msg.role === 'assistant' ? (
                      <div className="type-body leading-relaxed [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
                        <MarkdownContent content={stripConfigBlock(msg.content)} />
                      </div>
                    ) : (
                      <p className="type-body leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={14} className="text-[var(--text-muted)]" />
                    </div>
                  )}
                </div>
              ))}
              {error && <p className="type-support text-center text-[var(--danger)]">{error}</p>}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('teams.teamBuilderInputPlaceholder')}
                disabled={status === 'streaming' || status === 'idle' || installing}
                className={cn(inputClass, 'w-full')}
              />
              <Button
                variant="default"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || status === 'streaming' || installing}
              >
                {status === 'streaming' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </div>

          <div className="flex w-88 flex-col">
            {installing ? (
              <InstallProgress
                status={installStatus}
                events={installEvents}
                progressPercent={progressPercent}
                agents={config.agents}
              />
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
                    <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                      <PopoverTrigger asChild>
                        <button className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center transition-colors hover:bg-[var(--bg-hover)] cursor-pointer">
                          <span className="emoji-md">{config.emoji}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-64">
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJI_OPTIONS.map((e) => (
                            <button
                              key={e}
                              onClick={() => {
                                updateField('emoji', e);
                                setEmojiOpen(false);
                              }}
                              className="emoji-md flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-hover)] cursor-pointer"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <span className="type-label text-[var(--text-primary)] truncate">
                      {config.name || t('teams.teamBuilderPreviewTitle')}
                    </span>
                  </div>

                  <div>
                    <label className="type-label mb-1.5 block text-[var(--text-secondary)]">
                      {t('teams.teamName')}
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => updateField('name', e.target.value.slice(0, 50))}
                      placeholder={t('teams.namePlaceholder')}
                      maxLength={50}
                      className={cn(inputClass, 'w-full')}
                    />
                  </div>

                  <div>
                    <label className="type-label mb-1.5 block text-[var(--text-secondary)]">
                      {t('teams.description')}
                    </label>
                    <input
                      type="text"
                      value={config.description}
                      onChange={(e) => updateField('description', e.target.value.slice(0, 200))}
                      placeholder={t('teams.teamBuilderDescPlaceholder')}
                      maxLength={200}
                      className={cn(inputClass, 'w-full')}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 type-label mb-2 text-[var(--text-secondary)]">
                      <Users size={14} />
                      {t('teams.wizard.agentCount', { count: config.agents.length })}
                    </div>
                    <div className="space-y-2">
                      {config.agents.map((agent, i) => (
                        <div
                          key={`${agent.name}-${i}`}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedAgent(expandedAgent === i ? null : i)}
                            className="flex w-full items-center gap-2 px-3 py-2 cursor-pointer"
                          >
                            {expandedAgent === i ? (
                              <ChevronDown size={12} className="text-[var(--text-muted)]" />
                            ) : (
                              <ChevronRight size={12} className="text-[var(--text-muted)]" />
                            )}
                            <span className="type-body font-medium text-[var(--text-primary)] flex-1 text-left truncate">
                              {agent.name || t('teams.teamBuilderNewAgent')}
                            </span>
                            {agent.role === 'coordinator' && (
                              <span className="inline-flex items-center gap-1 type-meta text-[var(--accent)]">
                                <Crown size={10} />
                              </span>
                            )}
                          </button>
                          {expandedAgent === i && (
                            <div className="px-3 pb-3 space-y-2 border-t border-[var(--border-subtle)]">
                              <div className="flex items-center gap-2 pt-2">
                                <span
                                  className={cn(
                                    'type-meta px-1.5 py-0.5 rounded',
                                    agent.role === 'coordinator'
                                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
                                  )}
                                >
                                  {agent.role === 'coordinator'
                                    ? t('teams.wizard.coordinator')
                                    : t('teams.wizard.worker')}
                                </span>
                                {agent.model && (
                                  <span className="type-meta text-[var(--text-muted)] truncate">{agent.model}</span>
                                )}
                              </div>
                              {agent.description && (
                                <p className="type-meta text-[var(--text-secondary)] leading-relaxed">
                                  {agent.description}
                                </p>
                              )}
                              {agent.identity && (
                                <p className="type-meta text-[var(--text-muted)] leading-relaxed italic">
                                  {agent.identity}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {config.agents.length === 0 && (
                        <p className="type-meta text-[var(--text-muted)] text-center py-4">
                          {t('teams.teamBuilderNoAgents')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--border-subtle)] p-4">
                  <Button
                    variant="default"
                    size="default"
                    className="w-full gap-2"
                    disabled={!isValid}
                    onClick={handleCreate}
                  >
                    {t('teams.teamBuilderCreate')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
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

function InstallProgress({
  status,
  events,
  progressPercent,
  agents,
}: {
  status: 'idle' | 'installing' | 'done' | 'error';
  events: InstallEvent[];
  progressPercent: number;
  agents: AgentConfig[];
}) {
  const { t } = useTranslation();

  const agentStates = useMemo(() => {
    const stateMap = new Map<string, { slug: string; status: 'pending' | 'creating' | 'created' | 'warning' }>();
    for (const a of agents) {
      const slug = toSlug(a.name);
      stateMap.set(slug, { slug, status: 'pending' });
    }
    for (const e of events) {
      const s = e.agentSlug ? stateMap.get(e.agentSlug) : undefined;
      if (!s) continue;
      if (e.type === 'agent_creating') s.status = 'creating';
      if (e.type === 'agent_created') s.status = 'created';
      if (e.type === 'warning' && s.status === 'creating') s.status = 'warning';
    }
    return agents.map((a) => stateMap.get(toSlug(a.name))!).filter(Boolean);
  }, [agents, events]);

  const teamSaved = events.some((e) => e.type === 'team_persisted');
  const globalError = events.find((e) => e.type === 'error')?.message;

  return (
    <div className="flex flex-col h-full p-4">
      <div className="space-y-3 mb-4">
        <span className="type-label text-[var(--text-secondary)]">
          {status === 'installing' && t('teams.wizard.installing')}
          {status === 'done' && t('teams.wizard.installComplete')}
          {status === 'error' && t('teams.wizard.installError')}
        </span>
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

      <div className="flex-1 space-y-2 overflow-y-auto">
        {agentStates.map((agent) => (
          <div
            key={agent.slug}
            className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2"
          >
            {agent.status === 'pending' && <div className="h-3 w-3 rounded-full border border-[var(--border)]" />}
            {agent.status === 'creating' && <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />}
            {agent.status === 'created' && <Check size={12} className="text-[var(--accent)]" />}
            {agent.status === 'warning' && <AlertTriangle size={12} className="text-[var(--text-warning)]" />}
            <span className="type-body text-[var(--text-primary)] flex-1 truncate">{agent.slug}</span>
          </div>
        ))}

        {teamSaved && (
          <div className="flex items-center gap-2 px-3 py-2 type-meta text-[var(--accent)]">
            <Check size={12} />
            {t('teams.wizard.teamSaved')}
          </div>
        )}

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
