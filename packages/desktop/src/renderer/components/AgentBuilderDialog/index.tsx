import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sparkles, Send, Loader2, Bot, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MarkdownContent from '@/components/MarkdownContent';
import { useUiStore } from '@/stores/uiStore';
import { useSystemSession } from '@/hooks/useSystemSession';
import type { ModelCatalogEntry } from '@clawwork/shared';

interface AgentConfig {
  name: string;
  model: string;
  identity: string;
}

const EMPTY_CONFIG: AgentConfig = { name: '', model: '', identity: '' };

const EMPTY_MODELS: ModelCatalogEntry[] = [];

const SYSTEM_PROMPT_TEMPLATE = `You are an Agent creation assistant for ClawWork. Help the user create a new AI Agent through guided conversation.

Your job:
1. Ask what kind of Agent the user wants and what it should do
2. Based on their description, suggest a name and draft an identity (system prompt that defines the Agent's role, expertise, and behavior)
3. Recommend a model from the available list: {{modelList}}
4. After each response, include a structured block with current config

Rules:
- Ask ONE question at a time
- Be proactive: extract name and identity from the user's first description
- The name MUST be in English (ASCII only, e.g. "Story Crafter" not "故事匠") — it is used as a system identifier
- Keep identity concise but specific (2-4 sentences)
- Always end your response with the current config as a JSON block
- Only include fields whose values have been determined. Do NOT include fields with placeholder values like "..."
- Example with two determined fields:

\`\`\`agent-config
{"name": "Code Review Helper", "identity": "A code review assistant that..."}
\`\`\`

Respond in {{language}}.

Now begin by asking what kind of Agent the user wants to create.`;

const CONFIG_BLOCK_RE = /\n?```agent-config\n([\s\S]*?)\n```\n?/g;
const CONFIG_BLOCK_PARTIAL_RE = /\n?```agent-config[\s\S]*$/;

function parseAgentConfig(text: string): Partial<AgentConfig> | null {
  const matches = [...text.matchAll(CONFIG_BLOCK_RE)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  try {
    return JSON.parse(last[1]);
  } catch {
    return null;
  }
}

function stripConfigBlock(text: string): string {
  let result = text.replace(CONFIG_BLOCK_RE, '');
  result = result.replace(CONFIG_BLOCK_PARTIAL_RE, '');
  return result.trim();
}

function deriveWorkspace(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const inputClass = cn(
  'flex-1 h-[var(--density-control-height-lg)] px-3 py-2 rounded-md',
  'bg-[var(--bg-tertiary)] border border-[var(--border)]',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
  'outline-none ring-accent-focus transition-colors',
);

interface AgentBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gatewayId: string;
  onCreated?: () => void;
}

export default function AgentBuilderDialog({ open, onOpenChange, gatewayId, onCreated }: AgentBuilderDialogProps) {
  const { t, i18n } = useTranslation();
  const { status, messages, error, start, send, end } = useSystemSession();

  const modelCatalogByGateway = useUiStore((s) => s.modelCatalogByGateway);
  const agentCatalogByGateway = useUiStore((s) => s.agentCatalogByGateway);
  const models = modelCatalogByGateway[gatewayId] ?? EMPTY_MODELS;
  const defaultAgentId = agentCatalogByGateway[gatewayId]?.defaultId ?? 'main';

  const [config, setConfig] = useState<AgentConfig>(EMPTY_CONFIG);
  const [userEdited, setUserEdited] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevStatusRef = useRef(status);
  const startedRef = useRef(false);

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
    setCreating(false);

    const modelListStr = models.map((m) => `${m.name ?? m.id}${m.provider ? ` (${m.provider})` : ''}`).join(', ');
    const prompt = SYSTEM_PROMPT_TEMPLATE.replace('{{modelList}}', modelListStr || 'default').replace(
      '{{language}}',
      i18n.language,
    );

    start({
      gatewayId,
      agentId: defaultAgentId,
      purpose: 'agent-builder',
      initialMessage: prompt,
    });
  }, [open, gatewayId, defaultAgentId, models, start, i18n.language]);

  useEffect(() => {
    if (status === 'streaming' || (prevStatusRef.current === 'streaming' && status === 'active')) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        const parsed = parseAgentConfig(lastMsg.content);
        if (parsed) {
          setConfig((prev) => ({
            name: userEdited.has('name') ? prev.name : (parsed.name ?? prev.name),
            model: userEdited.has('model') ? prev.model : (parsed.model ?? prev.model),
            identity: userEdited.has('identity') ? prev.identity : (parsed.identity ?? prev.identity),
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

  const updateConfigField = useCallback((field: keyof AgentConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setUserEdited((prev) => {
      const next = new Set(prev);
      if (value) {
        next.add(field);
      } else {
        next.delete(field);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!config.name.trim()) return;
    setCreating(true);

    try {
      const slug = deriveWorkspace(config.name) || 'new-agent';
      const wsBase = await window.clawwork.getWorkspacePath();
      const workspace = wsBase ? `${wsBase}/${slug}` : slug;

      const createRes = await window.clawwork.createAgent(gatewayId, {
        name: config.name.trim(),
        workspace,
      });
      if (!createRes.ok) {
        toast.error(createRes.error ?? t('errors.failed'));
        return;
      }

      const created = createRes.result as Record<string, unknown> | undefined;
      const agentId = (created?.agentId as string) ?? '';

      if (config.model.trim() && agentId) {
        const updateRes = await window.clawwork.updateAgent(gatewayId, {
          agentId,
          model: config.model.trim(),
        });
        if (!updateRes.ok) {
          toast.error(updateRes.error ?? t('errors.failed'));
          return;
        }
      }

      if (config.identity.trim() && agentId) {
        const fileRes = await window.clawwork.setAgentFile(gatewayId, agentId, 'IDENTITY.md', config.identity.trim());
        if (!fileRes.ok) {
          toast.error(fileRes.error ?? t('errors.failed'));
          return;
        }
      }

      await end();
      toast.success(t('settings.agentCreated'));
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.failed'));
    } finally {
      setCreating(false);
    }
  }, [config, gatewayId, end, onCreated, onOpenChange, t]);

  const requestClose = useCallback(() => {
    if (creating) return;
    const hasConversation = messages.length > 1;
    if (hasConversation && !window.confirm(t('settings.agentBuilderCloseConfirm'))) return;
    end();
    onOpenChange(false);
  }, [creating, messages.length, end, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden [&>button:last-child]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="relative px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--accent)]" />
            {t('settings.agentBuilderTitle')}
          </DialogTitle>
          <DialogDescription>{t('settings.agentBuilderDesc')}</DialogDescription>
          <button
            type="button"
            onClick={requestClose}
            disabled={creating}
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
                placeholder={t('settings.agentBuilderInputPlaceholder')}
                disabled={status === 'streaming' || status === 'idle'}
                className={cn(inputClass, 'w-full')}
              />
              <Button
                variant="default"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || status === 'streaming'}
              >
                {status === 'streaming' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </div>

          <div className="flex w-80 flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <Bot size={20} className="text-[var(--text-muted)]" />
                </div>
                <span className="type-label text-[var(--text-primary)] truncate">
                  {config.name || t('settings.agentBuilderPreviewTitle')}
                </span>
              </div>

              <div>
                <label className="type-label mb-1.5 block text-[var(--text-secondary)]">
                  {t('settings.agentName')}
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfigField('name', e.target.value)}
                  placeholder={t('settings.agentNamePlaceholder')}
                  className={cn(inputClass, 'w-full')}
                />
              </div>

              <div>
                <label className="type-label mb-1.5 block text-[var(--text-secondary)]">
                  {t('settings.agentModel')}
                </label>
                <select
                  value={config.model}
                  onChange={(e) => updateConfigField('model', e.target.value)}
                  className={cn(inputClass, 'w-full')}
                >
                  <option value="">{t('settings.agentModelPlaceholder')}</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name ?? m.id}
                      {m.provider ? ` (${m.provider})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="type-label mb-1.5 block text-[var(--text-secondary)]">
                  {t('settings.agentBuilderIdentity')}
                </label>
                <textarea
                  value={config.identity}
                  onChange={(e) => updateConfigField('identity', e.target.value)}
                  placeholder={t('settings.agentBuilderIdentityPlaceholder')}
                  rows={6}
                  className={cn(inputClass, 'h-auto w-full resize-none leading-relaxed')}
                />
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] p-4">
              <Button
                variant="default"
                size="default"
                className="w-full gap-2"
                disabled={!config.name.trim() || creating}
                onClick={handleCreate}
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                {t('settings.agentBuilderCreate')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
