import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Server,
  ChevronDown,
  RefreshCw,
  Power,
  PowerOff,
  AlertTriangle,
  Search,
  Download,
  Info,
  Star,
  Tag,
  Settings2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion as motionPresets, motionDuration } from '@/styles/design-tokens';
import { useUiStore } from '@/stores/uiStore';
import type { SkillStatusEntry, SkillStatusReport, SkillSearchResultEntry, SkillDetailResult } from '@clawwork/shared';
import { summarizeSkillMissing, getSkillReason } from '@/lib/skill-utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConfirmDialog from '@/components/semantic/ConfirmDialog';
import EmptyState from '@/components/semantic/EmptyState';
import LoadingBlock from '@/components/semantic/LoadingBlock';
import SettingGroup from '@/components/semantic/SettingGroup';
import ToolbarButton from '@/components/semantic/ToolbarButton';
import { useDialogGuard } from '@/hooks/useDialogGuard';

type SkillFilter = 'all' | 'available' | 'unavailable' | 'disabled';
type SkillsTab = 'installed' | 'clawhub';

function isSkillAvailable(skill: SkillStatusEntry): boolean {
  return skill.eligible && !skill.disabled;
}

function SkillConfigDialog({
  skill,
  gatewayId,
  open,
  onOpenChange,
  onSaved,
}: {
  skill: SkillStatusEntry;
  gatewayId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [envDraft, setEnvDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setEnvDraft({});
  }, [open]);

  const isDirty = useCallback(() => Object.values(envDraft).some((v) => v.trim()), [envDraft]);

  const doClose = useCallback(() => {
    setEnvDraft({});
    onOpenChange(false);
  }, [onOpenChange]);

  const { confirmOpen, guardedOpenChange, contentProps, confirmDiscard, cancelDiscard } = useDialogGuard({
    isDirty,
    onConfirmClose: doClose,
  });

  const allMissingEnv = skill.missing.env;
  const hasPrimaryKey = skill.primaryEnv && allMissingEnv.includes(skill.primaryEnv);

  const handleSave = useCallback(async () => {
    const filled = Object.fromEntries(Object.entries(envDraft).filter(([, v]) => v.trim()));
    if (Object.keys(filled).length === 0) return;
    setSaving(true);

    const primaryVal = hasPrimaryKey && skill.primaryEnv ? filled[skill.primaryEnv] : undefined;
    const envOnly = { ...filled };
    if (skill.primaryEnv) delete envOnly[skill.primaryEnv];

    const promises: Promise<unknown>[] = [];
    if (primaryVal) {
      promises.push(window.clawwork.updateSkill(gatewayId, { skillKey: skill.skillKey, apiKey: primaryVal }));
    }
    if (Object.keys(envOnly).length > 0) {
      promises.push(window.clawwork.updateSkill(gatewayId, { skillKey: skill.skillKey, env: envOnly }));
    }

    const results = await Promise.all(promises);
    const allOk = results.every((r) => (r as { ok: boolean }).ok);
    if (allOk) {
      toast.success(t('settings.skillEnvSaved'));
      onSaved();
      doClose();
    } else {
      toast.error(t('settings.skillUpdateFailed'));
    }
    setSaving(false);
  }, [gatewayId, skill.skillKey, skill.primaryEnv, hasPrimaryKey, envDraft, onSaved, doClose, t]);

  return (
    <>
      <Dialog open={open} onOpenChange={guardedOpenChange}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {skill.emoji && <span className="mr-2">{skill.emoji}</span>}
              {skill.name}
            </DialogTitle>
            <DialogDescription>{t('settings.skillConfigDialogDesc')}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {allMissingEnv.map((envName) => (
              <div key={envName} className="space-y-1.5">
                <label className="type-label text-[var(--text-secondary)]">{envName}</label>
                <input
                  type="password"
                  value={envDraft[envName] ?? ''}
                  onChange={(e) => setEnvDraft((prev) => ({ ...prev, [envName]: e.target.value }))}
                  placeholder={t('settings.skillEnvPlaceholder', { env: envName })}
                  className={cn(
                    'w-full h-9 px-3 py-2 rounded-md type-mono-data',
                    'bg-[var(--bg-tertiary)] border border-[var(--border)]',
                    'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                    'glow-focus',
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && allMissingEnv.length === 1) handleSave();
                  }}
                />
              </div>
            ))}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => guardedOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button disabled={!isDirty() || saving} onClick={handleSave}>
              {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              {t('settings.skillApiKeySave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={t('common.discardChangesTitle')}
        description={t('common.discardChangesDesc')}
        confirmLabel={t('common.discard')}
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  );
}

function SkillCard({
  skill,
  gatewayId,
  onToggleEnabled,
  onConfigSaved,
  toggling,
}: {
  skill: SkillStatusEntry;
  gatewayId: string;
  onToggleEnabled: (skill: SkillStatusEntry) => void;
  onConfigSaved: () => void;
  toggling: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const hasConfigurableEnv = skill.missing.env.length > 0;

  const sourceLabel = skill.bundled
    ? t('settings.skillSourceBundled')
    : skill.source === 'clawhub'
      ? t('settings.skillSourceClawHub')
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
          {hasConfigurableEnv && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={() => setConfigOpen(true)}>
                  <Settings2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('settings.skillConfigure')}</TooltipContent>
            </Tooltip>
          )}
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
                  <Power size={14} />
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
                      <span
                        className={cn('type-badge', check.satisfied ? 'text-[var(--accent)]' : 'text-[var(--warning)]')}
                      >
                        {check.satisfied ? t('settings.skillConfigSatisfied') : t('settings.skillConfigNotFound')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasConfigurableEnv && (
        <SkillConfigDialog
          skill={skill}
          gatewayId={gatewayId}
          open={configOpen}
          onOpenChange={setConfigOpen}
          onSaved={onConfigSaved}
        />
      )}
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

function ClawHubResultCard({
  entry,
  expanded,
  onToggleExpand,
  detail,
  detailLoading,
  installing,
  onInstall,
}: {
  entry: SkillSearchResultEntry;
  expanded: boolean;
  onToggleExpand: () => void;
  detail: SkillDetailResult | 'failed' | null;
  detailLoading: boolean;
  installing: boolean;
  onInstall: () => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      {...motionPresets.listItem}
      className="surface-card rounded-xl border border-[var(--border-subtle)] px-4 py-3.5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="type-label truncate text-[var(--text-primary)]">{entry.displayName}</span>
            {entry.version && (
              <span className="type-badge rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-secondary)]">
                v{entry.version}
              </span>
            )}
            <span className="type-badge flex items-center gap-1 rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-secondary)]">
              <Star size={10} className="text-[var(--warning)]" />
              {entry.score.toFixed(1)}
            </span>
          </div>
          {entry.summary && <p className="type-support mt-0.5 text-[var(--text-secondary)]">{entry.summary}</p>}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1 pl-3 border-l border-[var(--border-subtle)]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="soft" size="icon-sm" disabled={installing} onClick={onInstall}>
                {installing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.skillHubInstall')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onToggleExpand}>
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
            <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
              {detailLoading ? (
                <LoadingBlock mode="inline" label={t('settings.skillHubLoadingDetail')} />
              ) : detail && detail !== 'failed' && detail.skill ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    <div className="space-y-0.5">
                      <span className="type-support text-[var(--text-muted)]">{t('settings.skillHubSlug')}</span>
                      <p className="type-mono-data text-[var(--text-primary)]">{entry.slug}</p>
                    </div>
                    {detail.owner?.displayName && (
                      <div className="space-y-0.5">
                        <span className="type-support text-[var(--text-muted)]">{t('settings.skillHubAuthor')}</span>
                        <p className="type-label text-[var(--text-primary)]">
                          {detail.owner.displayName}
                          {detail.owner.handle && (
                            <span className="ml-1 text-[var(--text-muted)]">@{detail.owner.handle}</span>
                          )}
                        </p>
                      </div>
                    )}
                    {detail.latestVersion && (
                      <div className="space-y-0.5">
                        <span className="type-support text-[var(--text-muted)]">{t('settings.skillHubVersion')}</span>
                        <p className="type-mono-data text-[var(--text-primary)]">{detail.latestVersion.version}</p>
                      </div>
                    )}
                    {detail.metadata?.os && detail.metadata.os.length > 0 && (
                      <div className="space-y-0.5">
                        <span className="type-support text-[var(--text-muted)]">{t('settings.skillHubOs')}</span>
                        <p className="type-label text-[var(--text-primary)]">{detail.metadata.os.join(', ')}</p>
                      </div>
                    )}
                  </div>
                  {detail.skill.tags && Object.keys(detail.skill.tags).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag size={12} className="flex-shrink-0 text-[var(--text-muted)]" />
                      {Object.entries(detail.skill.tags).map(([key, val]) => (
                        <span
                          key={key}
                          className="type-badge rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-secondary)]"
                        >
                          {val || key}
                        </span>
                      ))}
                    </div>
                  )}
                  {detail.latestVersion?.changelog && (
                    <div className="space-y-1">
                      <span className="type-support text-[var(--text-muted)]">{t('settings.skillHubChangelog')}</span>
                      <p className="type-support whitespace-pre-wrap text-[var(--text-secondary)]">
                        {detail.latestVersion.changelog}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="type-support text-[var(--text-muted)]">{t('settings.skillHubDetailUnavailable')}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ClawHubTab({ gatewayId, onInstalled }: { gatewayId: string; onInstalled: () => void }) {
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SkillSearchResultEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, SkillDetailResult | 'failed'>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [installingSlugs, setInstallingSlugs] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const epochRef = useRef(0);

  useEffect(() => {
    epochRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setSearched(false);
    setQuery('');
    setDetailCache({});
    setExpandedSlug(null);
    setInstallingSlugs(new Set());
  }, [gatewayId]);

  const doSearch = useCallback(
    async (q: string) => {
      const epoch = epochRef.current;
      setSearching(true);
      setSearched(true);
      const res = await window.clawwork.searchSkills(gatewayId, { query: q, limit: 30 });
      if (epoch !== epochRef.current) return;
      if (res.ok && res.result) {
        setResults(res.result.results);
      } else {
        toast.error(t('settings.skillHubSearchFailed'));
        setResults([]);
      }
      setSearching(false);
    },
    [gatewayId, t],
  );

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      debounceRef.current = setTimeout(() => doSearch(value.trim()), 300);
    },
    [doSearch],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleToggleExpand = useCallback(
    async (slug: string) => {
      if (expandedSlug === slug) {
        setExpandedSlug(null);
        return;
      }
      setExpandedSlug(slug);
      if (detailCache[slug]) return;
      const epoch = epochRef.current;
      setDetailLoading(slug);
      const res = await window.clawwork.getSkillDetail(gatewayId, slug);
      if (epoch !== epochRef.current) return;
      if (res.ok && res.result) {
        const detail = res.result;
        setDetailCache((prev) => ({ ...prev, [slug]: detail }));
      } else {
        toast.error(t('settings.skillHubDetailUnavailable'));
        setDetailCache((prev) => ({ ...prev, [slug]: 'failed' }));
      }
      setDetailLoading(null);
    },
    [gatewayId, expandedSlug, detailCache, t],
  );

  const handleInstall = useCallback(
    async (slug: string) => {
      setInstallingSlugs((prev) => new Set(prev).add(slug));
      const res = await window.clawwork.installSkill(gatewayId, { source: 'clawhub', slug });
      if (res.ok && res.result?.ok) {
        toast.success(t('settings.skillHubInstalled'));
        onInstalled();
      } else {
        toast.error(res.error ?? res.result?.message ?? t('settings.skillHubInstallFailed'));
      }
      setInstallingSlugs((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    },
    [gatewayId, onInstalled, t],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2">
        <Search size={14} className="flex-shrink-0 text-[var(--text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('settings.skillHubSearchPlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] type-label outline-none"
        />
        {searching && <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />}
      </div>

      <div className="flex items-start gap-2 rounded-lg border-l-2 border-l-[var(--info)] bg-[var(--bg-secondary)] px-3 py-2">
        <Info size={14} className="mt-0.5 flex-shrink-0 text-[var(--info)]" />
        <p className="type-support text-[var(--text-secondary)]">{t('settings.skillHubMirrorTip')}</p>
      </div>

      {searching && results.length === 0 ? (
        <SettingGroup>
          <LoadingBlock mode="inline" label={t('settings.skillHubSearching')} />
        </SettingGroup>
      ) : searched && results.length === 0 ? (
        <SettingGroup>
          <EmptyState title={t('settings.skillHubNoResults')} />
        </SettingGroup>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {results.map((entry) => (
              <ClawHubResultCard
                key={entry.slug}
                entry={entry}
                expanded={expandedSlug === entry.slug}
                onToggleExpand={() => handleToggleExpand(entry.slug)}
                detail={detailCache[entry.slug] ?? null}
                detailLoading={detailLoading === entry.slug}
                installing={installingSlugs.has(entry.slug)}
                onInstall={() => handleInstall(entry.slug)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <SettingGroup>
          <EmptyState
            icon={<Search size={24} className="text-[var(--text-muted)]" />}
            title={t('settings.skillHubPrompt')}
          />
        </SettingGroup>
      )}
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
  const [activeTab, setActiveTab] = useState<SkillsTab>('installed');
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
    if (filter === 'unavailable') return allSkills.filter((s) => !isSkillAvailable(s) && !s.disabled);
    if (filter === 'disabled') return allSkills.filter((s) => s.disabled);
    return allSkills;
  }, [allSkills, filter]);

  const counts = useMemo(
    () => ({
      all: allSkills.length,
      available: allSkills.filter(isSkillAvailable).length,
      unavailable: allSkills.filter((s) => !isSkillAvailable(s) && !s.disabled).length,
      disabled: allSkills.filter((s) => s.disabled).length,
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

  const handleInstalled = useCallback(() => {
    refreshSkills();
    setActiveTab('installed');
  }, [refreshSkills]);

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
          {activeTab === 'installed' && (
            <ToolbarButton
              variant="soft"
              size="sm"
              onClick={refreshSkills}
              disabled={loading}
              icon={<RefreshCw size={14} className={cn(loading && 'animate-spin')} />}
            >
              {t('settings.skillRefresh')}
            </ToolbarButton>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SkillsTab)} className="mb-3">
        <TabsList>
          <TabsTrigger value="installed">{t('settings.skillTabInstalled')}</TabsTrigger>
          <TabsTrigger value="clawhub">{t('settings.skillTabClawHub')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'installed' ? (
        <>
          <div className="mb-3 flex items-center gap-1">
            {(['all', 'available', 'unavailable', 'disabled'] as const).map((f) => (
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
                    gatewayId={selectedGatewayId!}
                    onToggleEnabled={handleToggleEnabled}
                    onConfigSaved={refreshSkills}
                    toggling={togglingKeys.has(skill.skillKey)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : selectedGatewayId ? (
        <ClawHubTab gatewayId={selectedGatewayId} onInstalled={handleInstalled} />
      ) : null}
    </div>
  );
}
