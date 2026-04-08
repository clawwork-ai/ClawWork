import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Settings, RefreshCw, Loader2, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { TeamHubRegistry, TeamHubEntry } from '@clawwork/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/semantic/EmptyState';
import { useTeamStore } from '@/stores/teamStore';
import TeamHubCard from './TeamHubCard';
import RegistryManageDialog from './RegistryManageDialog';

interface TeamsHubTabProps {
  onSelectEntry: (entry: TeamHubEntry & { _registryId: string }) => void;
}

export default function TeamsHubTab({ onSelectEntry }: TeamsHubTabProps) {
  const { t } = useTranslation();
  const teamsMap = useTeamStore((s) => s.teams);
  const [registries, setRegistries] = useState<TeamHubRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadRegistries = useCallback(async () => {
    const res = await window.clawwork.hubListRegistries();
    if (res.ok && res.result) {
      setRegistries(res.result);
    } else if (!res.ok) {
      toast.error(res.error ?? t('errors.unknown'));
    }
  }, [t]);

  useEffect(() => {
    loadRegistries().finally(() => setLoading(false));
  }, [loadRegistries]);

  const allEntries = useMemo(() => {
    const entries: (TeamHubEntry & { _registryId: string })[] = [];
    for (const reg of registries) {
      for (const team of reg.teams ?? []) {
        entries.push({ ...team, _registryId: reg.id });
      }
    }
    return entries;
  }, [registries]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const e of allEntries) {
      if (e.category) cats.add(e.category);
    }
    return Array.from(cats).sort();
  }, [allEntries]);

  const filtered = useMemo(() => {
    let list = allEntries;
    if (activeCategory) {
      list = list.filter((e) => e.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.description?.toLowerCase() ?? '').includes(q) ||
          e.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allEntries, activeCategory, search]);

  const installedSlugs = useMemo(() => {
    const slugs = new Set<string>();
    for (const team of Object.values(teamsMap)) {
      if (team.hubSlug) slugs.add(team.hubSlug);
    }
    return slugs;
  }, [teamsMap]);

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const results = await Promise.allSettled(registries.map((reg) => window.clawwork.hubFetchRegistry(reg.id)));
      const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
      await loadRegistries();
      if (failed.length > 0) {
        toast.error(t('errors.requestFailed'));
      } else {
        toast.success(t('teamshub.refreshed'));
      }
    } finally {
      setRefreshing(false);
    }
  }, [registries, loadRegistries, t]);

  const handleRefreshRegistry = useCallback(
    async (id: string) => {
      const res = await window.clawwork.hubFetchRegistry(id);
      if (!res.ok) toast.error(res.error ?? t('errors.unknown'));
      await loadRegistries();
    },
    [loadRegistries, t],
  );

  const handleAddRegistry = useCallback(
    async (url: string) => {
      const res = await window.clawwork.hubAddRegistry(url);
      if (!res.ok) throw new Error(res.error ?? t('errors.unknown'));
      await loadRegistries();
      toast.success(t('teamshub.registryAdded'));
    },
    [loadRegistries, t],
  );

  const handleRemoveRegistry = useCallback(
    async (id: string) => {
      const res = await window.clawwork.hubRemoveRegistry(id);
      if (!res.ok) {
        toast.error(res.error ?? t('errors.unknown'));
        return;
      }
      await loadRegistries();
      toast.success(t('teamshub.registryRemoved'));
    },
    [loadRegistries, t],
  );

  const handleSelect = useCallback(
    (entry: TeamHubEntry & { _registryId: string }) => {
      onSelectEntry(entry);
    },
    [onSelectEntry],
  );

  const isEmpty = !loading && (registries.length === 0 || allEntries.length === 0);

  return (
    <>
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={<Store size={24} className="text-[var(--text-muted)]" />}
          title={t('teamshub.emptyTitle')}
          description={t('teamshub.emptyDesc')}
          action={
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Settings size={14} />
              {t('teamshub.manageRegistries')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex flex-1 items-center gap-2 rounded-md border border-[var(--border)]',
                'bg-[var(--bg-tertiary)] px-3 py-1.5',
              )}
            >
              <Search size={14} className="flex-shrink-0 text-[var(--text-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('teamshub.search')}
                className="type-body flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Settings size={14} />
            </Button>
            <Button size="sm" variant="outline" onClick={handleRefreshAll} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </Button>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'type-support rounded-full px-2.5 py-0.5 transition-colors',
                  !activeCategory
                    ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                )}
              >
                {t('teamshub.all')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                  className={cn(
                    'type-support rounded-full px-2.5 py-0.5 transition-colors',
                    cat === activeCategory
                      ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fill,minmax(var(--content-card-min),1fr))] gap-4">
            {filtered.map((entry) => (
              <TeamHubCard
                key={`${entry._registryId}:${entry.slug}`}
                entry={entry}
                installed={installedSlugs.has(entry.slug)}
                onSelect={() => handleSelect(entry)}
                onInstall={() => handleSelect(entry)}
              />
            ))}
          </div>
        </div>
      )}

      <RegistryManageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        registries={registries}
        onRefreshRegistry={handleRefreshRegistry}
        onAddRegistry={handleAddRegistry}
        onRemoveRegistry={handleRemoveRegistry}
      />
    </>
  );
}
