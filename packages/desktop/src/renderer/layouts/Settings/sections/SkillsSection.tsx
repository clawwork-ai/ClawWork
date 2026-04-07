import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Server, ChevronDown, RefreshCw, Power, PowerOff, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion as motionPresets, motionDuration } from '@/styles/design-tokens';
import { useUiStore } from '@/stores/uiStore';
import type { SkillStatusEntry, SkillStatusReport } from '@clawwork/shared';
import { summarizeSkillMissing, getSkillReason } from '@/lib/skill-utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import EmptyState from '@/components/semantic/EmptyState';
import LoadingBlock from '@/components/semantic/LoadingBlock';
import SettingGroup from '@/components/semantic/SettingGroup';
import ToolbarButton from '@/components/semantic/ToolbarButton';

type SkillFilter = 'all' | 'available' | 'unavailable';

function isSkillAvailable(skill: SkillStatusEntry): boolean {
  return skill.eligible && !skill.disabled;
}

function SkillCard({
  skill,
  onToggleEnabled,
  toggling,
}: {
  skill: SkillStatusEntry;
  onToggleEnabled: (skill: SkillStatusEntry) => void;
  toggling: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const sourceLabel = skill.bundled
    ? t('settings.skillSourceBundled')
    : skill.source === 'clawhub'
      ? 'ClawHub'
      : t('settings.skillSourceLocal');

  const SKILL_PREFIX = 'settings.skill';
  const reason = !isSkillAvailable(skill) ? getSkillReason(skill, t, SKILL_PREFIX) : null;
  const hasMissing = summarizeSkillMissing(skill.missing, t, SKILL_PREFIX);

  return (
    <motion.div
      {...motionPresets.listItem}
      className="surface-card rounded-xl border border-[var(--border-subtle)] px-4 py-3.5 transition-colors"
    >
      <div className="flex items-center gap-3">
        {skill.emoji && <span className="emoji-lg flex-shrink-0">{skill.emoji}</span>}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="type-label truncate text-[var(--text-primary)]">{skill.name}</span>
            <span
              className={cn(
                'type-badge rounded-md px-1.5 py-0.5',
                isSkillAvailable(skill)
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
              )}
            >
              {isSkillAvailable(skill) ? t('settings.skillAvailable') : t('settings.skillUnavailable')}
            </span>
            <span className="type-badge rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-muted)]">
              {sourceLabel}
            </span>
          </div>
          <p className="type-support mt-0.5 text-[var(--text-muted)]">{skill.description}</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-1 pl-3 border-l border-[var(--border-subtle)]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={toggling || skill.blockedByAllowlist}
                onClick={() => onToggleEnabled(skill)}
              >
                {toggling ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : skill.disabled ? (
                  <PowerOff size={14} />
                ) : (
                  <Power size={14} className="text-[var(--accent)]" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{skill.disabled ? t('settings.skillEnable') : t('settings.skillDisable')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => setExpanded((v) => !v)}>
                <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.skillDetails')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: motionDuration.normal }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 border-t border-[var(--border-subtle)] pt-3">
              {reason && (
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[var(--warning)]" />
                  <p className="type-support text-[var(--text-muted)]">{reason}</p>
                </div>
              )}
              {hasMissing && skill.eligible && <p className="type-support text-[var(--text-muted)]">{hasMissing}</p>}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <DetailRow label={t('settings.skillKey')} value={skill.skillKey} />
                <DetailRow label={t('settings.skillSource')} value={sourceLabel} />
                {skill.primaryEnv && <DetailRow label={t('settings.skillPrimaryEnv')} value={skill.primaryEnv} />}
              </div>
              {skill.configChecks.length > 0 && (
                <div className="space-y-1">
                  <span className="type-support text-[var(--text-secondary)]">{t('settings.skillConfigChecks')}</span>
                  {skill.configChecks.map((check) => (
                    <div key={check.path} className="flex items-center gap-2 pl-2">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full flex-shrink-0',
                          check.satisfied ? 'bg-[var(--accent)]' : 'bg-[var(--warning)]',
                        )}
                      />
                      <span className="type-mono-data text-[var(--text-muted)]">{check.path}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="type-support text-[var(--text-muted)]">{label}:</span>
      <span className="type-mono-data truncate text-[var(--text-secondary)]">{value}</span>
    </div>
  );
}

export default function SkillsSection() {
  const { t } = useTranslation();
  const gatewayStatusMap = useUiStore((s) => s.gatewayStatusMap);
  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const storeDefaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const skillsStatusByGateway = useUiStore((s) => s.skillsStatusByGateway);
  const setSkillsStatusForGateway = useUiStore((s) => s.setSkillsStatusForGateway);

  const connectedGatewayIds = Object.entries(gatewayStatusMap)
    .filter(([, status]) => status === 'connected')
    .map(([id]) => id)
    .sort();
  const connectedKey = connectedGatewayIds.join(',');

  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SkillFilter>('all');
  const [loading, setLoading] = useState(false);
  const [togglingKeys, setTogglingKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedGatewayId && connectedGatewayIds.includes(selectedGatewayId)) return;
    const preferred =
      storeDefaultGatewayId && connectedGatewayIds.includes(storeDefaultGatewayId)
        ? storeDefaultGatewayId
        : (connectedGatewayIds[0] ?? null);
    setSelectedGatewayId(preferred);
  }, [connectedKey, connectedGatewayIds, selectedGatewayId, storeDefaultGatewayId]);

  const refreshSkills = useCallback(async () => {
    if (!selectedGatewayId) return;
    setLoading(true);
    const res = await window.clawwork.getSkillsStatus(selectedGatewayId);
    if (res.ok && res.result) {
      setSkillsStatusForGateway(selectedGatewayId, res.result as unknown as SkillStatusReport);
    } else {
      toast.error(res.error ?? t('settings.skillUpdateFailed'));
    }
    setLoading(false);
  }, [selectedGatewayId, setSkillsStatusForGateway, t]);

  useEffect(() => {
    if (selectedGatewayId && !skillsStatusByGateway[selectedGatewayId]) {
      refreshSkills();
    }
  }, [selectedGatewayId, skillsStatusByGateway, refreshSkills]);

  const allSkills = useMemo(() => {
    if (!selectedGatewayId) return [];
    return skillsStatusByGateway[selectedGatewayId]?.skills ?? [];
  }, [selectedGatewayId, skillsStatusByGateway]);

  const filteredSkills = useMemo(() => {
    if (filter === 'available') return allSkills.filter(isSkillAvailable);
    if (filter === 'unavailable') return allSkills.filter((s) => !isSkillAvailable(s));
    return allSkills;
  }, [allSkills, filter]);

  const counts = useMemo(
    () => ({
      all: allSkills.length,
      available: allSkills.filter(isSkillAvailable).length,
      unavailable: allSkills.filter((s) => !isSkillAvailable(s)).length,
    }),
    [allSkills],
  );

  const handleToggleEnabled = useCallback(
    async (skill: SkillStatusEntry) => {
      if (!selectedGatewayId) return;
      setTogglingKeys((prev) => new Set(prev).add(skill.skillKey));
      const newEnabled = skill.disabled;
      const res = await window.clawwork.updateSkill(selectedGatewayId, {
        skillKey: skill.skillKey,
        enabled: newEnabled,
      });
      if (res.ok) {
        toast.success(newEnabled ? t('settings.skillEnabled') : t('settings.skillDisabledToast'));
        await refreshSkills();
      } else {
        toast.error(t('settings.skillUpdateFailed'));
      }
      setTogglingKeys((prev) => {
        const next = new Set(prev);
        next.delete(skill.skillKey);
        return next;
      });
    },
    [selectedGatewayId, refreshSkills, t],
  );

  if (connectedGatewayIds.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <h3 className="type-section-title text-[var(--text-primary)]">{t('settings.skills')}</h3>
        </div>
        <SettingGroup>
          <EmptyState
            icon={<Server size={24} className="text-[var(--text-muted)]" />}
            title={t('settings.noConnectedGateways')}
          />
        </SettingGroup>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="type-section-title text-[var(--text-primary)]">{t('settings.skills')}</h3>
        <div className="flex items-center gap-2">
          {connectedGatewayIds.length > 1 && (
            <select
              value={selectedGatewayId ?? ''}
              onChange={(e) => setSelectedGatewayId(e.target.value)}
              className={cn(
                'glow-focus type-label h-8 rounded-md px-2',
                'bg-[var(--bg-tertiary)] border border-[var(--border)]',
                'text-[var(--text-primary)]',
              )}
            >
              {connectedGatewayIds.map((gwId) => (
                <option key={gwId} value={gwId}>
                  {gatewayInfoMap[gwId]?.name ?? gwId}
                </option>
              ))}
            </select>
          )}
          <ToolbarButton
            variant="soft"
            size="sm"
            onClick={refreshSkills}
            disabled={loading}
            icon={<RefreshCw size={14} className={cn(loading && 'animate-spin')} />}
          >
            {t('settings.skillRefresh')}
          </ToolbarButton>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1">
        {(['all', 'available', 'unavailable'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'glow-focus type-label rounded-md px-2.5 py-1 transition-colors',
              filter === f
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            )}
          >
            {t(`settings.skillFilter${f.charAt(0).toUpperCase() + f.slice(1)}`)} ({counts[f]})
          </button>
        ))}
      </div>

      {loading && allSkills.length === 0 ? (
        <SettingGroup>
          <LoadingBlock mode="inline" label={t('settings.skillLoading')} />
        </SettingGroup>
      ) : filteredSkills.length === 0 ? (
        <SettingGroup>
          <EmptyState title={t('settings.skillNoResults')} />
        </SettingGroup>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.skillKey}
                skill={skill}
                onToggleEnabled={handleToggleEnabled}
                toggling={togglingKeys.has(skill.skillKey)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
