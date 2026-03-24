import { useTranslation } from 'react-i18next';
import { Play, Clock, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CronJob } from '@clawwork/shared';

interface CronJobCardProps {
  job: CronJob;
  onToggleEnabled: (job: CronJob) => void;
  onEdit: (job: CronJob) => void;
  onDelete: (job: CronJob) => void;
  onRunNow: (job: CronJob) => void;
  onShowHistory: (job: CronJob) => void;
}

function formatRelativeMs(ms: number): string {
  const now = Date.now();
  const diff = ms - now;
  const absDiff = Math.abs(diff);
  if (absDiff < 60_000) return diff > 0 ? 'in <1m' : '<1m ago';
  if (absDiff < 3600_000) {
    const m = Math.round(absDiff / 60_000);
    return diff > 0 ? `in ${m}m` : `${m}m ago`;
  }
  if (absDiff < 86400_000) {
    const h = Math.round(absDiff / 3600_000);
    return diff > 0 ? `in ${h}h` : `${h}h ago`;
  }
  const d = Math.round(absDiff / 86400_000);
  return diff > 0 ? `in ${d}d` : `${d}d ago`;
}

function formatEveryMs(ms: number): string {
  if (ms >= 86400_000) return `every ${Math.round(ms / 86400_000)}d`;
  if (ms >= 3600_000) return `every ${Math.round(ms / 3600_000)}h`;
  if (ms >= 60_000) return `every ${Math.round(ms / 60_000)}m`;
  return `every ${Math.round(ms / 1000)}s`;
}

function scheduleLabel(schedule: CronJob['schedule']): { text: string; badge: string } {
  switch (schedule.kind) {
    case 'cron':
      return {
        text: schedule.tz ? `${schedule.expr} (${schedule.tz})` : schedule.expr,
        badge: 'cron',
      };
    case 'every':
      return { text: formatEveryMs(schedule.everyMs), badge: 'interval' };
    case 'at':
      return { text: new Date(schedule.at).toLocaleString(), badge: 'one-time' };
  }
}

function payloadPreview(payload: CronJob['payload']): string {
  const raw = payload.kind === 'systemEvent' ? payload.text : payload.message;
  return raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
}

function sessionTargetLabel(target: CronJob['sessionTarget']): string {
  if (target === 'isolated' || target === 'main' || target === 'current') return target;
  return target;
}

const STATUS_DOT: Record<string, string> = {
  ok: 'bg-[var(--accent)]',
  error: 'bg-[var(--danger)]',
  skipped: 'bg-[var(--text-muted)]',
};

export default function CronJobCard({
  job,
  onToggleEnabled,
  onEdit,
  onDelete,
  onRunNow,
  onShowHistory,
}: CronJobCardProps) {
  const { t } = useTranslation();
  const { text: schedText, badge: schedBadge } = scheduleLabel(job.schedule);
  const preview = payloadPreview(job.payload);
  const targetLabel = sessionTargetLabel(job.sessionTarget);
  const { state } = job;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 transition-opacity',
          !job.enabled && 'opacity-50',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="pt-0.5">
            <Switch
              checked={job.enabled}
              onCheckedChange={() => onToggleEnabled(job)}
              aria-label={t('cron.toggleEnabled')}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{job.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                {state.runningAtMs && <Loader2 size={14} className="animate-spin text-[var(--accent)]" />}
                {state.lastRunStatus && (
                  <span
                    className={cn(
                      'inline-block h-2 w-2 rounded-full',
                      STATUS_DOT[state.lastRunStatus] ?? 'bg-[var(--text-muted)]',
                    )}
                  />
                )}
                {!state.lastRunStatus && !state.runningAtMs && (
                  <span className="inline-block h-2 w-2 rounded-full bg-[var(--text-muted)]" />
                )}
                {state.lastRunAtMs && (
                  <span className="text-xs text-[var(--text-muted)]">{formatRelativeMs(state.lastRunAtMs)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                {schedBadge}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-mono truncate">{schedText}</span>
            </div>

            <div className="text-xs text-[var(--text-secondary)] mt-1 truncate">
              <span className="text-[var(--text-muted)]">{job.payload.kind}:</span> {preview}
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
              <span>{targetLabel}</span>
              {state.nextRunAtMs && (
                <>
                  <span>&middot;</span>
                  <span>
                    {t('cron.nextRun')}: {formatRelativeMs(state.nextRunAtMs)}
                  </span>
                </>
              )}
            </div>

            {(state.consecutiveErrors ?? 0) > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 mt-1.5 text-xs text-[var(--danger)]">
                    <AlertTriangle size={12} />
                    <span>
                      {state.consecutiveErrors} {t('cron.consecutiveErrors')}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs break-words">
                  {state.lastError ?? t('cron.unknownError')}
                </TooltipContent>
              </Tooltip>
            )}

            <div className="flex items-center gap-1 mt-2 border-t border-[var(--border)] pt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => onRunNow(job)}>
                    <Play size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('cron.runNow')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => onShowHistory(job)}>
                    <Clock size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('cron.history')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(job)}>
                    <Pencil size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('cron.edit')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-[var(--danger)] hover:text-[var(--danger)]"
                    onClick={() => onDelete(job)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('cron.delete')}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
