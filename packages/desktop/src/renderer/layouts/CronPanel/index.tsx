import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Search, RefreshCw, ChevronDown, Server, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { motion as motionPresets, STAGGER_STEP } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CronJobCard from './CronJobCard';
import CronJobDialog from './CronJobDialog';
import CronRunHistory from './CronRunHistory';
import type { CronJob, CronListResult, CronRunResult, CronStatusResult } from '@clawwork/shared';
import ToolbarButton from '@/components/semantic/ToolbarButton';
import EmptyState from '@/components/semantic/EmptyState';
import InlineNotice from '@/components/semantic/InlineNotice';

const PAGE_SIZE = 20;

export default function CronPanel() {
  const { t } = useTranslation();

  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const gatewayStatusMap = useUiStore((s) => s.gatewayStatusMap);
  const defaultGatewayId = useUiStore((s) => s.defaultGatewayId);

  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<CronStatusResult | null>(null);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [historyJobId, setHistoryJobId] = useState<string | null>(null);
  const [deletingJob, setDeletingJob] = useState<CronJob | null>(null);

  const deferredRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectedGateways = useMemo(() => {
    return Object.entries(gatewayInfoMap).filter(([id]) => gatewayStatusMap[id] === 'connected');
  }, [gatewayInfoMap, gatewayStatusMap]);

  useEffect(() => {
    if (selectedGatewayId) return;
    if (defaultGatewayId && gatewayStatusMap[defaultGatewayId] === 'connected') {
      setSelectedGatewayId(defaultGatewayId);
      return;
    }
    if (connectedGateways.length > 0) {
      setSelectedGatewayId(connectedGateways[0][0]);
      return;
    }
    const allGatewayIds = Object.keys(gatewayInfoMap);
    if (defaultGatewayId && gatewayInfoMap[defaultGatewayId]) {
      setSelectedGatewayId(defaultGatewayId);
      return;
    }
    if (allGatewayIds.length > 0) {
      setSelectedGatewayId(allGatewayIds[0]);
    }
  }, [defaultGatewayId, connectedGateways, gatewayInfoMap, gatewayStatusMap, selectedGatewayId]);

  const selectedGatewayConnected = selectedGatewayId ? gatewayStatusMap[selectedGatewayId] === 'connected' : false;

  const refreshData = useCallback(async () => {
    if (!selectedGatewayId) return;
    setLoading(true);
    setError(null);
    try {
      const [listRes, statusRes] = await Promise.all([
        window.clawwork.listCronJobs(selectedGatewayId, {
          enabled: filter,
          query: searchQuery || undefined,
          sortBy: 'nextRunAtMs',
          sortDir: 'asc',
          limit: PAGE_SIZE,
          offset,
        }),
        window.clawwork.getCronStatus(selectedGatewayId),
      ]);
      if (listRes.ok && listRes.result) {
        const r = listRes.result as CronListResult;
        setJobs(r.jobs);
        setTotal(r.total);
      } else {
        setError(listRes.error ?? 'Failed to load');
      }
      if (statusRes.ok && statusRes.result) {
        setSchedulerStatus(statusRes.result as CronStatusResult);
      }
    } catch {
      setError('Failed to load scheduled tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedGatewayId, filter, searchQuery, offset]);

  const prevGatewayIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedGatewayId === prevGatewayIdRef.current) return;
    prevGatewayIdRef.current = selectedGatewayId;
    if (!selectedGatewayId) return;
    setJobs([]);
    setTotal(0);
    setSchedulerStatus(null);
    setLoading(true);
    setError(null);
    setOffset(0);
    setDialogOpen(false);
    setEditingJob(null);
    setHistoryJobId(null);
    if (deferredRefreshRef.current) {
      clearTimeout(deferredRefreshRef.current);
      deferredRefreshRef.current = null;
    }
  }, [selectedGatewayId]);

  useEffect(() => {
    if (!selectedGatewayId || !selectedGatewayConnected) return;
    refreshData();
  }, [selectedGatewayId, selectedGatewayConnected, refreshData]);

  useEffect(() => {
    return () => {
      if (deferredRefreshRef.current) {
        clearTimeout(deferredRefreshRef.current);
      }
    };
  }, []);

  const handleToggleEnabled = useCallback(
    async (job: CronJob) => {
      if (!selectedGatewayId) return;
      const prev = job.enabled;
      setJobs((curr) => curr.map((j) => (j.id === job.id ? { ...j, enabled: !prev } : j)));
      try {
        const res = await window.clawwork.updateCronJob(selectedGatewayId, job.id, {
          enabled: !prev,
        });
        if (res.ok) {
          toast.success(!prev ? t('cron.enabledToast') : t('cron.disabledToast'), { description: job.name });
          await refreshData();
        } else {
          setJobs((curr) => curr.map((j) => (j.id === job.id ? { ...j, enabled: prev } : j)));
          toast.error(t('cron.toggleFailed'), { description: res.error ?? job.name });
        }
      } catch {
        setJobs((curr) => curr.map((j) => (j.id === job.id ? { ...j, enabled: prev } : j)));
        toast.error(t('cron.toggleFailed'), { description: job.name });
      }
    },
    [refreshData, selectedGatewayId, t],
  );

  const handleDelete = useCallback(async (job: CronJob) => {
    setDeletingJob(job);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedGatewayId || !deletingJob) return;
    const res = await window.clawwork.removeCronJob(selectedGatewayId, deletingJob.id);
    if (res.ok) {
      toast.success(t('cron.deletedToast'), { description: deletingJob.name });
      setDeletingJob(null);
      await refreshData();
      return;
    }
    toast.error(t('cron.deleteFailed'), { description: res.error ?? deletingJob.name });
  }, [deletingJob, refreshData, selectedGatewayId, t]);

  const handleRunNow = useCallback(
    async (job: CronJob) => {
      if (!selectedGatewayId) return;
      const res = await window.clawwork.runCronJob(selectedGatewayId, job.id, 'force');
      if (res.ok) {
        const result = res.result as CronRunResult | undefined;
        if (result?.ran === false) {
          toast.error(t('cron.runNotRun', { reason: result.reason ?? t('cron.unknownError') }));
          return;
        }
        toast.success(t('cron.runEnqueued'), { description: job.name });
        await refreshData();
        if (deferredRefreshRef.current) clearTimeout(deferredRefreshRef.current);
        deferredRefreshRef.current = setTimeout(() => {
          refreshData();
          deferredRefreshRef.current = null;
        }, 5000);
      } else {
        toast.error(t('cron.runFailed'), { description: res.error ?? job.name });
      }
    },
    [refreshData, selectedGatewayId, t],
  );

  const handleEdit = useCallback((job: CronJob) => {
    setEditingJob(job);
    setDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingJob(null);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingJob(null);
  }, []);

  const handleDialogSaved = useCallback(() => {
    setDialogOpen(false);
    setEditingJob(null);
    refreshData();
  }, [refreshData]);

  const handleShowHistory = useCallback((job: CronJob) => {
    setHistoryJobId(job.id);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setHistoryJobId(null);
  }, []);

  const pageStart = offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  const filterTabs: { key: 'all' | 'enabled' | 'disabled'; label: string }[] = [
    { key: 'all', label: t('cron.filterAll') },
    { key: 'enabled', label: t('cron.filterEnabled') },
    { key: 'disabled', label: t('cron.filterDisabled') },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="titlebar-drag flex items-center justify-between px-6 py-3 border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t('cron.title')}</h2>
          {schedulerStatus && (
            <span className="text-xs text-[var(--text-muted)]">
              {t('cron.jobCount', { count: schedulerStatus.jobs })}
            </span>
          )}
        </div>
        <div className="titlebar-no-drag flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton variant="outline" size="sm">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    schedulerStatus?.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--text-muted)]',
                  )}
                />
                <Server className="w-3.5 h-3.5" />
                <span className="max-w-24 truncate">
                  {selectedGatewayId
                    ? (gatewayInfoMap[selectedGatewayId]?.name ?? selectedGatewayId)
                    : t('cron.selectGateway')}
                </span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {connectedGateways.map(([id, info]) => (
                <DropdownMenuItem
                  key={id}
                  onClick={() => setSelectedGatewayId(id)}
                  className={cn('text-xs', id === selectedGatewayId && 'bg-[var(--accent-dim)]')}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: info.color ?? 'var(--accent)' }}
                  />
                  <span className="truncate">{info.name}</span>
                  {id === selectedGatewayId && schedulerStatus && !schedulerStatus.enabled && (
                    <span className="ml-auto text-xs text-[var(--text-muted)]">{t('cron.schedulerStopped')}</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarButton
            size="sm"
            onClick={handleCreate}
            disabled={!selectedGatewayConnected}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            {t('cron.newJob')}
          </ToolbarButton>
        </div>
      </header>

      <div className="flex items-center justify-between px-6 py-2 border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                setOffset(0);
              }}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150',
                filter === tab.key
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOffset(0);
              }}
              placeholder={t('cron.searchPlaceholder')}
              className={cn(
                'h-7 w-44 pl-8 pr-3 rounded-md text-xs',
                'bg-[var(--bg-tertiary)] border border-[var(--border)]',
                'text-[var(--text-secondary)] outline-none',
                'focus:border-[var(--border-accent)] focus:bg-[var(--bg-secondary)]',
                'placeholder:text-[var(--text-muted)] transition-all duration-150',
              )}
            />
          </div>
          <ToolbarButton
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => refreshData()}
            disabled={!selectedGatewayConnected || loading}
            icon={<RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />}
          />
        </div>
      </div>

      {!selectedGatewayConnected && selectedGatewayId && (
        <div className="mx-6 mt-4">
          <InlineNotice tone="info">
            <span className="inline-flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              {t('cron.notConnected')}
            </span>
          </InlineNotice>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4">
          <InlineNotice
            tone="error"
            action={
              <ToolbarButton variant="ghost" size="sm" className="text-[var(--danger)]" onClick={() => refreshData()}>
                {t('cron.retry')}
              </ToolbarButton>
            }
          >
            {error}
          </InlineNotice>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          {loading && jobs.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : jobs.length === 0 && !error ? (
            <motion.div {...motionPresets.fadeIn} className="py-20">
              <EmptyState
                icon={<Clock size={24} className="text-[var(--text-muted)]" />}
                title={t('cron.emptyTitle')}
                description={t('cron.emptySubtitle')}
                action={
                  <ToolbarButton
                    size="sm"
                    onClick={handleCreate}
                    disabled={!selectedGatewayConnected}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    {t('cron.createFirst')}
                  </ToolbarButton>
                }
              />
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    {...motionPresets.listItem}
                    transition={{ ...motionPresets.listItem.transition, delay: i * STAGGER_STEP }}
                  >
                    <CronJobCard
                      job={job}
                      onToggleEnabled={handleToggleEnabled}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onRunNow={handleRunNow}
                      onShowHistory={handleShowHistory}
                    />
                    {historyJobId === job.id && selectedGatewayId && (
                      <div className="mt-2 rounded-lg border border-[var(--border)] overflow-hidden">
                        <CronRunHistory
                          jobId={job.id}
                          jobName={job.name}
                          jobSessionKey={job.sessionKey}
                          gatewayId={selectedGatewayId}
                          onClose={handleCloseHistory}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {total > 0 && (
        <div className="flex items-center justify-between px-6 py-2 border-t border-[var(--border)] flex-shrink-0">
          <span className="text-xs text-[var(--text-muted)]">
            {t('cron.pagination', { start: pageStart, end: pageEnd, total })}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={!hasPrev}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              {t('cron.prev')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={!hasNext}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              {t('cron.next')}
            </Button>
          </div>
        </div>
      )}

      {selectedGatewayId && (
        <CronJobDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          gatewayId={selectedGatewayId}
          editingJob={editingJob}
          onSaved={handleDialogSaved}
        />
      )}

      <Dialog open={!!deletingJob} onOpenChange={(open) => !open && setDeletingJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cron.deleteJob')}</DialogTitle>
            <DialogDescription>{t('cron.deleteConfirm', { name: deletingJob?.name ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingJob(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()}>
              {t('cron.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
