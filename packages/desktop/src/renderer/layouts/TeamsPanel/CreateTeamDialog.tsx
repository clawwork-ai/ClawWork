import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import type { AgentInfo, Team } from '@clawwork/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useUiStore } from '@/platform';

const EMOJI_OPTIONS = [
  '🤖',
  '🧪',
  '🎯',
  '🚀',
  '💡',
  '🔧',
  '📊',
  '🎨',
  '🛡️',
  '📦',
  '🌐',
  '⚡',
  '🔬',
  '📝',
  '🎲',
  '🧩',
  '🏗️',
  '💻',
  '🔍',
  '🤝',
  '📡',
  '🧠',
  '🌟',
  '🎵',
];

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGatewayId: string;
  onCreate: (data: {
    name: string;
    emoji: string;
    description: string;
    gatewayId: string;
    agents: Array<{ agentId: string; role: string; isManager: boolean }>;
  }) => void;
  team?: Team;
}

export default function CreateTeamDialog({
  open,
  onOpenChange,
  defaultGatewayId,
  onCreate,
  team,
}: CreateTeamDialogProps) {
  const isEdit = !!team;
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🤖');
  const [description, setDescription] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gatewayId, setGatewayId] = useState(defaultGatewayId);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [agentCatalog, setAgentCatalog] = useState<AgentInfo[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const prevGatewayIdRef = useRef<string | null>(null);

  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const gateways = useMemo(() => Object.entries(gatewayInfoMap), [gatewayInfoMap]);

  useEffect(() => {
    if (!open) return;
    if (team) {
      setName(team.name);
      setEmoji(team.emoji || '🤖');
      setDescription(team.description);
      setGatewayId(team.gatewayId);
      setSelectedAgentIds(new Set(team.agents.map((a) => a.agentId)));
    } else {
      setGatewayId(defaultGatewayId);
    }
  }, [open, defaultGatewayId, team]);

  useEffect(() => {
    if (!open || !gatewayId) return;
    const gatewayChanged = prevGatewayIdRef.current !== null && prevGatewayIdRef.current !== gatewayId;
    prevGatewayIdRef.current = gatewayId;
    if (gatewayChanged) {
      setSelectedAgentIds(new Set());
    }
    setLoadingAgents(true);
    window.clawwork
      .listAgents(gatewayId)
      .then((res) => {
        if (res.ok && res.result) {
          const payload = res.result as { agents?: AgentInfo[] };
          setAgentCatalog(payload.agents ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAgents(false));
  }, [open, gatewayId]);

  const resetForm = useCallback(() => {
    setName('');
    setEmoji('🤖');
    setDescription('');
    setSelectedAgentIds(new Set());
    setAgentCatalog([]);
    prevGatewayIdRef.current = null;
  }, []);

  const toggleAgent = useCallback((agentId: string) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim() || selectedAgentIds.size === 0) return;
    const existingAgentMap = new Map(team?.agents.map((a) => [a.agentId, a]));
    const agents = Array.from(selectedAgentIds).map((agentId) => ({
      agentId,
      role: existingAgentMap.get(agentId)?.role ?? '',
      isManager: existingAgentMap.get(agentId)?.isManager ?? false,
    }));
    onCreate({ name: name.trim(), emoji, description: description.trim(), gatewayId, agents });
    resetForm();
    onOpenChange(false);
  }, [name, emoji, description, gatewayId, selectedAgentIds, team, onCreate, resetForm, onOpenChange]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetForm();
      onOpenChange(next);
    },
    [onOpenChange, resetForm],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('teams.editTeam') : t('teams.createTeam')}</DialogTitle>
          <DialogDescription>{t('teams.emptyDesc')}</DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-5">
          <div className="flex items-start gap-4">
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <button className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)] cursor-pointer focus-visible:outline-none glow-focus">
                  <span className="emoji-lg">{emoji}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setEmoji(e);
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

            <div className="flex-1 space-y-1">
              <label className="type-label text-[var(--text-secondary)]">{t('teams.teamName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 50))}
                placeholder={t('teams.namePlaceholder')}
                maxLength={50}
                autoFocus
                className="w-full h-[var(--density-control-height)] px-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] glow-focus focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="type-label text-[var(--text-secondary)]">{t('teams.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder={t('teams.descPlaceholder')}
              maxLength={200}
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] glow-focus focus:border-transparent transition-all resize-none"
            />
          </div>

          {gateways.length > 1 && (
            <div className="space-y-1">
              <label className="type-label text-[var(--text-secondary)]">{t('teams.gateway')}</label>
              <select
                value={gatewayId}
                onChange={(e) => setGatewayId(e.target.value)}
                className="w-full h-[var(--density-control-height)] px-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] glow-focus focus:border-transparent transition-all"
              >
                {gateways.map(([id, info]) => (
                  <option key={id} value={id}>
                    {info.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="type-label text-[var(--text-secondary)]">
              {t('teams.selectAgents')} {selectedAgentIds.size > 0 && `(${selectedAgentIds.size})`}
            </label>
            {loadingAgents ? (
              <div className="py-4 text-center type-body text-[var(--text-muted)]">{t('common.loading')}</div>
            ) : agentCatalog.length === 0 ? (
              <div className="py-4 text-center type-body text-[var(--text-muted)]">{t('teams.noAgents')}</div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-md border border-[var(--border)]">
                {agentCatalog.map((agent) => {
                  const selected = selectedAgentIds.has(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 transition-colors hover:bg-[var(--bg-hover)] cursor-pointer border-b border-[var(--border)] last:border-b-0"
                    >
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-primary)]">
                        {selected && <Check size={12} className="text-[var(--text-primary)]" />}
                      </div>
                      {agent.identity?.emoji && <span className="emoji-sm">{agent.identity.emoji}</span>}
                      <span className="type-body text-[var(--text-primary)] truncate">{agent.name ?? agent.id}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || selectedAgentIds.size === 0}>
            {isEdit ? t('teams.saveTeam') : t('teams.createTeam')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
