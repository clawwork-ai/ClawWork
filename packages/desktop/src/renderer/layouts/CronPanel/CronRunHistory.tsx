import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { parseTaskIdFromSessionKey } from '@clawwork/shared';
import type { CronRunLogEntry, CronRunsResult } from '@clawwork/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTaskStore } from '@/stores/taskStore';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

interface CronRunHistoryProps {
  jobId: string;
  jobName: string;
  jobSessionKey?: string;
  gatewayId: string;
  onClose: () => void;
}

const PAGE_SIZE = 20;

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(ms?: number): string {
  if (!ms) return '\u2014';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  ok: { dot: 'bg-[var(--accent)]', text: 'text-[var(--accent)]' },
  error: { dot: 'bg-[var(--danger)]', text: 'text-[var(--danger)]' },
  skipped: { dot: 'bg-[var(--text-muted)]', text: 'text-[var(--text-muted)]' },
};

export default function CronRunHistory({ jobId, jobName, jobSessionKey, gatewayId, onClose }: CronRunHistoryProps) {
  const { t } = useTranslation();

  const handleOpenTask = useCallback(() => {
    if (!jobSessionKey) return;
    const taskId = parseTaskIdFromSessionKey(jobSessionKey);
    if (!taskId) return;
    useTaskStore.getState().setActiveTask(taskId);
    useUiStore.getState().setMainView('chat');
  }, [jobSessionKey]);
  const [entries, setEntries] = useState<CronRunLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    window.clawwork
      .listCronRuns(gatewayId, {
        scope: 'job',
        jobId,
        limit: PAGE_SIZE,
        offset,
        sortDir: 'desc',
      })
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.result) {
          const r = res.result as unknown as CronRunsResult;
          setEntries(r.entries);
          setTotal(r.total);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gatewayId, jobId, offset]);

  const toggleExpand = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const pageStart = offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col max-h-[50vh]">
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          {t('cron.runHistory.title')}: {jobName}
        </h3>
        <div className="flex items-center gap-1">
          {jobSessionKey && (
            <Button variant="ghost" size="sm" onClick={handleOpenTask} className="text-xs gap-1">
              <ExternalLink size={12} />
              {t('cron.runHistory.openTask')}
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('common.close')}>
            <X size={14} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-[var(--text-tertiary)]">
            {t('cron.runHistory.empty')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--text-secondary)]">
                <th className="text-left px-4 py-1.5 font-medium">{t('cron.runHistory.time')}</th>
                <th className="text-left px-4 py-1.5 font-medium">{t('cron.runHistory.status')}</th>
                <th className="text-left px-4 py-1.5 font-medium">{t('cron.runHistory.duration')}</th>
                <th className="text-left px-4 py-1.5 font-medium">{t('cron.runHistory.model')}</th>
                <th className="text-left px-4 py-1.5 font-medium">{t('cron.runHistory.summary')}</th>
                <th className="text-left px-4 py-1.5 font-medium">{t('cron.runHistory.delivery')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const style = STATUS_STYLES[entry.status ?? 'ok'] ?? STATUS_STYLES.ok;
                const isExpanded = expandedRows.has(i);
                const hasExpandable =
                  (entry.status === 'error' && entry.error) || (entry.summary && entry.summary.length > 40);

                return (
                  <tr key={`${entry.ts}-${i}`} className="group">
                    <td colSpan={6} className="p-0">
                      <div
                        className={cn(
                          'grid grid-cols-[minmax(140px,1fr)_90px_80px_120px_minmax(160px,2fr)_100px] items-center border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors',
                          hasExpandable && 'cursor-pointer',
                        )}
                        onClick={hasExpandable ? () => toggleExpand(i) : undefined}
                      >
                        <span className="px-4 py-1.5 text-[var(--text-primary)] tabular-nums">
                          {formatTimestamp(entry.ts)}
                        </span>
                        <span className={cn('px-4 py-1.5 flex items-center gap-1.5', style.text)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', style.dot)} />
                          {entry.status ?? 'ok'}
                        </span>
                        <span className="px-4 py-1.5 text-[var(--text-secondary)] tabular-nums">
                          {formatDuration(entry.durationMs)}
                        </span>
                        <span className="px-4 py-1.5 text-[var(--text-secondary)] truncate">
                          {entry.model ?? '\u2014'}
                        </span>
                        <span className="px-4 py-1.5 text-[var(--text-secondary)] flex items-center gap-1">
                          <span className="truncate">
                            {entry.summary
                              ? isExpanded
                                ? entry.summary
                                : entry.summary.length > 40
                                  ? `${entry.summary.slice(0, 40)}\u2026`
                                  : entry.summary
                              : '\u2014'}
                          </span>
                          {hasExpandable &&
                            (isExpanded ? (
                              <ChevronUp size={12} className="flex-shrink-0 text-[var(--text-tertiary)]" />
                            ) : (
                              <ChevronDown size={12} className="flex-shrink-0 text-[var(--text-tertiary)]" />
                            ))}
                        </span>
                        <span className="px-4 py-1.5">
                          {entry.deliveryStatus ? (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                              {entry.deliveryStatus}
                            </span>
                          ) : (
                            '\u2014'
                          )}
                        </span>
                      </div>
                      {isExpanded && entry.status === 'error' && entry.error && (
                        <div className="px-4 py-2 bg-[var(--danger-bg)] border-b border-[var(--border)]">
                          <pre className="text-xs text-[var(--danger)] whitespace-pre-wrap break-words font-mono">
                            {entry.error}
                          </pre>
                        </div>
                      )}
                      {isExpanded && entry.summary && entry.summary.length > 40 && entry.status !== 'error' && (
                        <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border)]">
                          <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                            {entry.summary}
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ScrollArea>

      {!loading && total > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] flex-shrink-0 text-xs text-[var(--text-secondary)]">
          <span>{t('cron.runHistory.showing', { start: pageStart, end: pageEnd, total })}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasPrev}
              onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
            >
              {t('cron.runHistory.prev')}
            </Button>
            <Button variant="ghost" size="sm" disabled={!hasNext} onClick={() => setOffset((prev) => prev + PAGE_SIZE)}>
              {t('cron.runHistory.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
