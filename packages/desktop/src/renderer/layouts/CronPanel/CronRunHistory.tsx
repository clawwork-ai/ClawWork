import { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { parseTaskIdFromSessionKey } from '@clawwork/shared';
import type { CronRunLogEntry, CronRunsResult } from '@clawwork/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTaskStore } from '@/stores/taskStore';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import DataTable, { type DataTableColumn } from '@/components/data-display/DataTable';
import EmptyState from '@/components/semantic/EmptyState';
import LoadingBlock from '@/components/semantic/LoadingBlock';
import StatusTag from '@/components/semantic/StatusTag';

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
  const columns: DataTableColumn<CronRunLogEntry>[] = [
    {
      key: 'time',
      header: t('cron.runHistory.time'),
      kind: 'time',
      width: '22%',
      render: (entry) => <span className="tabular-nums text-[var(--text-primary)]">{formatTimestamp(entry.ts)}</span>,
    },
    {
      key: 'status',
      header: t('cron.runHistory.status'),
      kind: 'status',
      width: '14%',
      render: (entry) => {
        const style = STATUS_STYLES[entry.status ?? 'ok'] ?? STATUS_STYLES.ok;
        return (
          <span className={cn('inline-flex items-center gap-1.5', style.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
            <span className="truncate">{entry.status ?? 'ok'}</span>
          </span>
        );
      },
    },
    {
      key: 'duration',
      header: t('cron.runHistory.duration'),
      kind: 'numeric',
      width: '12%',
      render: (entry) => <span className="tabular-nums">{formatDuration(entry.durationMs)}</span>,
    },
    {
      key: 'model',
      header: t('cron.runHistory.model'),
      kind: 'text',
      width: '16%',
      render: (entry) => <span className="block truncate">{entry.model ?? '\u2014'}</span>,
    },
    {
      key: 'summary',
      header: t('cron.runHistory.summary'),
      kind: 'text',
      width: '24%',
      render: (entry, index) => {
        const isExpanded = expandedRows.has(index);
        const expandable = (entry.status === 'error' && entry.error) || (entry.summary && entry.summary.length > 40);
        return (
          <span className="flex items-center gap-1">
            <span className="truncate">
              {entry.summary
                ? isExpanded
                  ? entry.summary
                  : entry.summary.length > 40
                    ? `${entry.summary.slice(0, 40)}\u2026`
                    : entry.summary
                : '\u2014'}
            </span>
            {expandable ? (
              isExpanded ? (
                <ChevronUp size={12} className="shrink-0 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown size={12} className="shrink-0 text-[var(--text-muted)]" />
              )
            ) : null}
          </span>
        );
      },
    },
    {
      key: 'delivery',
      header: t('cron.runHistory.delivery'),
      kind: 'action',
      width: '12%',
      render: (entry) =>
        entry.deliveryStatus ? <StatusTag tone="neutral">{entry.deliveryStatus}</StatusTag> : <span>\u2014</span>,
    },
  ];

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
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
          <LoadingBlock mode="panel" />
        ) : entries.length === 0 ? (
          <EmptyState title={t('cron.runHistory.empty')} />
        ) : (
          <DataTable
            columns={columns}
            rows={entries}
            getRowKey={(entry, index) => `${entry.ts}-${index}`}
            rowClassName={(entry) =>
              (entry.status === 'error' && entry.error) || (entry.summary && entry.summary.length > 40)
                ? 'group'
                : undefined
            }
            onRowClick={(entry, index) => {
              if ((entry.status === 'error' && entry.error) || (entry.summary && entry.summary.length > 40)) {
                toggleExpand(index);
              }
            }}
            isRowExpanded={(_entry, index) => expandedRows.has(index)}
            expandedRowRender={(entry) =>
              entry.status === 'error' && entry.error ? (
                <div className="bg-[var(--danger-bg)] px-4 py-3">
                  <pre className="type-code-block whitespace-pre-wrap break-words text-[var(--danger)]">
                    {entry.error}
                  </pre>
                </div>
              ) : entry.summary && entry.summary.length > 40 ? (
                <div className="bg-[var(--bg-tertiary)] px-4 py-3">
                  <p className="type-body-sm text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                    {entry.summary}
                  </p>
                </div>
              ) : null
            }
          />
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
