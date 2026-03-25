import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import cronstrue from 'cronstrue/i18n';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { buildSessionKey } from '@clawwork/shared';
import { useTaskStore } from '@/stores/taskStore';
import type {
  AgentListResponse,
  CronDelivery,
  CronFailureAlert,
  CronJob,
  CronJobCreate,
  CronJobPatch,
  CronPayload,
  CronSchedule,
  CronSessionTarget,
  ModelListResponse,
} from '@clawwork/shared';

interface CronJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gatewayId: string;
  editingJob: CronJob | null;
  onSaved: () => void;
}

type ScheduleKind = 'cron' | 'every' | 'at';
type PayloadKind = 'agentTurn' | 'systemEvent';
type SessionTargetMode = 'task' | 'main';
type DeliveryMode = 'none' | 'announce' | 'webhook';
type FailureAlertMode = 'announce' | 'webhook';
type EveryUnit = 'minutes' | 'hours' | 'days';

const CRON_PRESETS: { expr: string; labelKey: string }[] = [
  { expr: '*/5 * * * *', labelKey: 'cron.preset_every5min' },
  { expr: '0 * * * *', labelKey: 'cron.preset_everyHour' },
  { expr: '0 9 * * *', labelKey: 'cron.preset_dailyAt9' },
  { expr: '0 9 * * 1-5', labelKey: 'cron.preset_weekdays9' },
  { expr: '0 9 * * 1', labelKey: 'cron.preset_everyMonday' },
];

const EVERY_UNIT_MS: Record<EveryUnit, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};

function describeCron(expr: string, locale: string): string | null {
  try {
    return cronstrue.toString(expr, { locale: locale === 'zh' ? 'zh_CN' : 'en', use24HourTimeFormat: true });
  } catch {
    return null;
  }
}

const inputClass = [
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
  'hover:border-[var(--text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-transparent',
  'transition-colors',
].join(' ');

const selectClass = [
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm',
  'text-[var(--text-primary)]',
  'hover:border-[var(--text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-transparent',
  'transition-colors appearance-none cursor-pointer',
].join(' ');

const labelClass = 'block text-sm font-medium text-[var(--text-secondary)] mb-1.5';

function toLocalDatetimeValue(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function bestEveryUnit(ms: number): { value: number; unit: EveryUnit } {
  if (ms >= 86_400_000 && ms % 86_400_000 === 0) return { value: ms / 86_400_000, unit: 'days' };
  if (ms >= 3_600_000 && ms % 3_600_000 === 0) return { value: ms / 3_600_000, unit: 'hours' };
  return { value: ms / 60_000, unit: 'minutes' };
}

function parseSchedule(job: CronJob | null): {
  scheduleKind: ScheduleKind;
  cronExpr: string;
  cronTz: string;
  everyValue: string;
  everyUnit: EveryUnit;
  atTimestamp: string;
} {
  if (!job) {
    return {
      scheduleKind: 'cron',
      cronExpr: '',
      cronTz: '',
      everyValue: '',
      everyUnit: 'minutes',
      atTimestamp: '',
    };
  }

  if (job.schedule.kind === 'cron') {
    return {
      scheduleKind: 'cron',
      cronExpr: job.schedule.expr,
      cronTz: job.schedule.tz ?? '',
      everyValue: '',
      everyUnit: 'minutes',
      atTimestamp: '',
    };
  }

  if (job.schedule.kind === 'every') {
    const { value, unit } = bestEveryUnit(job.schedule.everyMs);
    return {
      scheduleKind: 'every',
      cronExpr: '',
      cronTz: '',
      everyValue: String(value),
      everyUnit: unit,
      atTimestamp: '',
    };
  }

  return {
    scheduleKind: 'at',
    cronExpr: '',
    cronTz: '',
    everyValue: '',
    everyUnit: 'minutes',
    atTimestamp: toLocalDatetimeValue(job.schedule.at),
  };
}

function parsePayload(job: CronJob | null): {
  payloadKind: PayloadKind;
  message: string;
  agentId: string;
  model: string;
  thinking: string;
  timeoutSeconds: string;
} {
  if (!job) {
    return {
      payloadKind: 'agentTurn',
      message: '',
      agentId: '',
      model: '',
      thinking: '',
      timeoutSeconds: '',
    };
  }

  if (job.payload.kind === 'systemEvent') {
    return {
      payloadKind: 'systemEvent',
      message: job.payload.text,
      agentId: job.agentId ?? '',
      model: '',
      thinking: '',
      timeoutSeconds: '',
    };
  }

  return {
    payloadKind: 'agentTurn',
    message: job.payload.message,
    agentId: job.agentId ?? '',
    model: job.payload.model ?? '',
    thinking: job.payload.thinking ?? '',
    timeoutSeconds: job.payload.timeoutSeconds ? String(job.payload.timeoutSeconds) : '',
  };
}

function parseDelivery(job: CronJob | null): {
  deliveryMode: DeliveryMode;
  deliveryChannel: string;
  deliveryTarget: string;
} {
  return {
    deliveryMode: job?.delivery?.mode ?? 'none',
    deliveryChannel: job?.delivery?.channel ?? 'last',
    deliveryTarget: job?.delivery?.to ?? '',
  };
}

function parseFailureAlert(job: CronJob | null): {
  failureAlertEnabled: boolean;
  failureAlertAfter: string;
  failureAlertTarget: string;
  failureAlertMode: FailureAlertMode;
} {
  if (!job?.failureAlert) {
    return {
      failureAlertEnabled: false,
      failureAlertAfter: '3',
      failureAlertTarget: '',
      failureAlertMode: 'announce',
    };
  }

  return {
    failureAlertEnabled: true,
    failureAlertAfter: job.failureAlert.after ? String(job.failureAlert.after) : '3',
    failureAlertTarget: job.failureAlert.to ?? '',
    failureAlertMode: job.failureAlert.mode ?? 'announce',
  };
}

function buildSchedule(
  scheduleKind: ScheduleKind,
  cronExpr: string,
  cronTz: string,
  everyValue: string,
  everyUnit: EveryUnit,
  atTimestamp: string,
  existing?: CronSchedule,
): CronSchedule {
  if (scheduleKind === 'cron') {
    const base = existing?.kind === 'cron' ? existing : undefined;
    return {
      kind: 'cron',
      expr: cronExpr.trim(),
      tz: cronTz.trim() || undefined,
      staggerMs: base?.staggerMs,
    };
  }

  if (scheduleKind === 'every') {
    const base = existing?.kind === 'every' ? existing : undefined;
    return {
      kind: 'every',
      everyMs: Number(everyValue) * EVERY_UNIT_MS[everyUnit],
      anchorMs: base?.anchorMs,
    };
  }

  return {
    kind: 'at',
    at: new Date(atTimestamp).toISOString(),
  };
}

function buildPayload(
  payloadKind: PayloadKind,
  message: string,
  model: string,
  thinking: string,
  timeoutSeconds: string,
  existing?: CronPayload,
): CronPayload {
  if (payloadKind === 'systemEvent') {
    return {
      kind: 'systemEvent',
      text: message.trim(),
    };
  }

  const base = existing?.kind === 'agentTurn' ? existing : undefined;
  return {
    ...(base ?? {}),
    kind: 'agentTurn',
    message: message.trim(),
    model: model.trim() || undefined,
    thinking: thinking.trim() || undefined,
    timeoutSeconds: timeoutSeconds.trim() ? Number(timeoutSeconds) : undefined,
  };
}

function buildDelivery(
  deliveryMode: DeliveryMode,
  deliveryChannel: string,
  deliveryTarget: string,
  existing?: CronDelivery,
): CronDelivery {
  if (deliveryMode === 'announce') {
    return {
      ...(existing?.mode === 'announce' ? existing : {}),
      mode: 'announce',
      channel: deliveryChannel.trim() || 'last',
      to: deliveryTarget.trim() || undefined,
    };
  }

  if (deliveryMode === 'webhook') {
    return {
      ...(existing?.mode === 'webhook' ? existing : {}),
      mode: 'webhook',
      to: deliveryTarget.trim(),
    };
  }

  return { mode: 'none' };
}

function buildFailureAlert(
  enabled: boolean,
  after: string,
  target: string,
  mode: FailureAlertMode,
  existing?: CronFailureAlert | false,
): CronFailureAlert | false {
  if (!enabled) return false;

  const base = existing || undefined;
  return {
    ...(base ?? {}),
    after: after.trim() ? Number(after) : undefined,
    to: target.trim() || undefined,
    mode,
  };
}

function normalizeForCompare<T>(value: T): string {
  return JSON.stringify(value);
}

export default function CronJobDialog({ open, onOpenChange, gatewayId, editingJob, onSaved }: CronJobDialogProps) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>('cron');
  const [cronExpr, setCronExpr] = useState('');
  const [cronTz, setCronTz] = useState('');
  const [everyValue, setEveryValue] = useState('');
  const [everyUnit, setEveryUnit] = useState<EveryUnit>('minutes');
  const [atTimestamp, setAtTimestamp] = useState('');
  const [payloadKind, setPayloadKind] = useState<PayloadKind>('agentTurn');
  const [message, setMessage] = useState('');
  const [sessionTarget, setSessionTarget] = useState<SessionTargetMode>('task');
  const [enabled, setEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [description, setDescription] = useState('');
  const [wakeMode, setWakeMode] = useState<'now' | 'next-heartbeat'>('now');
  const [deleteAfterRun, setDeleteAfterRun] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('none');
  const [deliveryChannel, setDeliveryChannel] = useState('last');
  const [deliveryTarget, setDeliveryTarget] = useState('');
  const [agentId, setAgentId] = useState('');
  const [model, setModel] = useState('');
  const [thinking, setThinking] = useState('');
  const [timeoutSeconds, setTimeoutSeconds] = useState('');
  const [failureAlertEnabled, setFailureAlertEnabled] = useState(false);
  const [failureAlertAfter, setFailureAlertAfter] = useState('3');
  const [failureAlertTarget, setFailureAlertTarget] = useState('');
  const [failureAlertMode, setFailureAlertMode] = useState<FailureAlertMode>('announce');
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [agentOptions, setAgentOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [defaultAgentId, setDefaultAgentId] = useState('');
  const [modelOptions, setModelOptions] = useState<Array<{ id: string; name: string }>>([]);

  const isEdit = !!editingJob;
  const canUseAgentTurn = sessionTarget !== 'main';

  useEffect(() => {
    const schedule = parseSchedule(editingJob);
    const payload = parsePayload(editingJob);
    const delivery = parseDelivery(editingJob);
    const failureAlert = parseFailureAlert(editingJob);

    setName(editingJob?.name ?? '');
    setScheduleKind(schedule.scheduleKind);
    setCronExpr(schedule.cronExpr);
    setCronTz(schedule.cronTz);
    setEveryValue(schedule.everyValue);
    setEveryUnit(schedule.everyUnit);
    setAtTimestamp(schedule.atTimestamp);
    setPayloadKind(payload.payloadKind);
    setMessage(payload.message);
    setSessionTarget(editingJob?.sessionTarget === 'main' ? 'main' : 'task');
    setEnabled(editingJob?.enabled ?? true);
    setDescription(editingJob?.description ?? '');
    setWakeMode(editingJob?.wakeMode ?? 'now');
    setDeleteAfterRun(editingJob?.deleteAfterRun ?? false);
    setDeliveryMode(delivery.deliveryMode);
    setDeliveryChannel(delivery.deliveryChannel);
    setDeliveryTarget(delivery.deliveryTarget);
    setAgentId(payload.agentId);
    setModel(payload.model);
    setThinking(payload.thinking);
    setTimeoutSeconds(payload.timeoutSeconds);
    setFailureAlertEnabled(failureAlert.failureAlertEnabled);
    setFailureAlertAfter(failureAlert.failureAlertAfter);
    setFailureAlertTarget(failureAlert.failureAlertTarget);
    setFailureAlertMode(failureAlert.failureAlertMode);
    setSaving(false);
    setServerError(null);
    setShowAdvanced(
      Boolean(
        editingJob?.description ||
        editingJob?.deleteAfterRun ||
        (editingJob && editingJob.wakeMode !== 'now') ||
        editingJob?.agentId ||
        (editingJob?.payload.kind === 'agentTurn' &&
          (editingJob.payload.model || editingJob.payload.thinking || editingJob.payload.timeoutSeconds)) ||
        editingJob?.delivery ||
        editingJob?.failureAlert,
      ),
    );
  }, [editingJob]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setLoadingCatalogs(true);
    Promise.all([window.clawwork.listAgents(gatewayId), window.clawwork.listModels(gatewayId)])
      .then(([agentsRes, modelsRes]) => {
        if (cancelled) return;

        if (agentsRes.ok && agentsRes.result) {
          const data = agentsRes.result as unknown as AgentListResponse;
          const agents = (data.agents ?? []).map((agent) => ({
            id: agent.id,
            name: agent.name ?? agent.identity?.name ?? agent.id,
          }));
          setAgentOptions(agents);
          setDefaultAgentId(data.defaultId ?? '');
          if (!editingJob && !agentId && data.defaultId) {
            setAgentId(data.defaultId);
          }
        }

        if (modelsRes.ok && modelsRes.result) {
          const data = modelsRes.result as unknown as ModelListResponse;
          setModelOptions((data.models ?? []).map((entry) => ({ id: entry.id, name: entry.name ?? entry.id })));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerError((prev) => prev ?? t('cron.errorCatalogLoad'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalogs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, gatewayId, editingJob, agentId, t]);

  useEffect(() => {
    if (sessionTarget === 'main' && payloadKind !== 'systemEvent') {
      setPayloadKind('systemEvent');
    }
  }, [sessionTarget, payloadKind]);

  const { i18n } = useTranslation();

  const cronDescription = useMemo(() => {
    if (scheduleKind !== 'cron' || !cronExpr.trim()) return null;
    return describeCron(cronExpr.trim(), i18n.language);
  }, [scheduleKind, cronExpr, i18n.language]);

  const agentSelectValue = useMemo(() => {
    if (agentId) return agentId;
    if (!isEdit && defaultAgentId) return defaultAgentId;
    return '';
  }, [agentId, defaultAgentId, isEdit]);

  const validate = useCallback((): string | null => {
    if (!name.trim()) return t('cron.errorNameRequired');
    if (scheduleKind === 'cron' && !cronExpr.trim()) return t('cron.errorScheduleRequired');
    if (scheduleKind === 'every' && (!everyValue.trim() || Number(everyValue) <= 0)) {
      return t('cron.errorScheduleRequired');
    }
    if (scheduleKind === 'at' && !atTimestamp) return t('cron.errorScheduleRequired');
    if (!message.trim()) return t('cron.errorMessageRequired');
    if (sessionTarget === 'main' && payloadKind !== 'systemEvent') return t('cron.errorMainSessionPayload');
    if (deliveryMode === 'webhook' && !deliveryTarget.trim()) return t('cron.errorDeliveryTargetRequired');
    if (payloadKind === 'agentTurn' && timeoutSeconds.trim() && Number(timeoutSeconds) <= 0) {
      return t('cron.errorTimeoutInvalid');
    }
    if (failureAlertEnabled && failureAlertAfter.trim() && Number(failureAlertAfter) <= 0) {
      return t('cron.errorFailureAlertAfterInvalid');
    }
    if (failureAlertEnabled && failureAlertMode === 'webhook' && !failureAlertTarget.trim()) {
      return t('cron.errorFailureAlertTargetRequired');
    }
    return null;
  }, [
    atTimestamp,
    cronExpr,
    deliveryMode,
    deliveryTarget,
    everyValue,
    failureAlertAfter,
    failureAlertEnabled,
    failureAlertMode,
    failureAlertTarget,
    message,
    name,
    payloadKind,
    scheduleKind,
    sessionTarget,
    t,
    timeoutSeconds,
  ]);

  const handleSave = useCallback(async () => {
    const err = validate();
    if (err) {
      setServerError(err);
      return;
    }

    setSaving(true);
    setServerError(null);

    try {
      const resolvedAgentId = agentSelectValue.trim() || editingJob?.agentId || defaultAgentId || 'main';

      let target: CronSessionTarget;
      let jobSessionKey: string | undefined;

      if (sessionTarget === 'main') {
        target = 'main';
      } else if (editingJob?.sessionTarget?.startsWith('session:')) {
        target = editingJob.sessionTarget;
        jobSessionKey = editingJob.sessionKey;
      } else {
        const deviceId = (await window.clawwork.getDeviceId().catch(() => '')) || undefined;
        const taskId = crypto.randomUUID();
        const storeKey = buildSessionKey(taskId, resolvedAgentId, deviceId);
        target = `session:${storeKey}` as CronSessionTarget;
        jobSessionKey = storeKey;
        useTaskStore.getState().adoptTasks([
          {
            taskId,
            sessionKey: storeKey,
            title: name,
            updatedAt: new Date().toISOString(),
            gatewayId,
            agentId: resolvedAgentId,
          },
        ]);
      }

      const schedule = buildSchedule(
        scheduleKind,
        cronExpr,
        cronTz,
        everyValue,
        everyUnit,
        atTimestamp,
        editingJob?.schedule,
      );
      const payload = buildPayload(payloadKind, message, model, thinking, timeoutSeconds, editingJob?.payload);
      const delivery = buildDelivery(deliveryMode, deliveryChannel, deliveryTarget, editingJob?.delivery);
      const failureAlert = buildFailureAlert(
        failureAlertEnabled,
        failureAlertAfter,
        failureAlertTarget,
        failureAlertMode,
        editingJob?.failureAlert,
      );
      const normalizedAgentId = resolvedAgentId || undefined;

      if (editingJob) {
        const patch: CronJobPatch = {};

        if (name !== editingJob.name) patch.name = name;
        if (enabled !== editingJob.enabled) patch.enabled = enabled;
        if (description !== (editingJob.description ?? '')) patch.description = description || undefined;
        if (wakeMode !== editingJob.wakeMode) patch.wakeMode = wakeMode;
        if (deleteAfterRun !== (editingJob.deleteAfterRun ?? false)) patch.deleteAfterRun = deleteAfterRun;
        if (target !== editingJob.sessionTarget) patch.sessionTarget = target;
        if ((editingJob.agentId ?? undefined) !== normalizedAgentId) patch.agentId = normalizedAgentId;
        if (jobSessionKey !== undefined && (editingJob.sessionKey ?? undefined) !== jobSessionKey) {
          patch.sessionKey = jobSessionKey;
        }
        if (normalizeForCompare(schedule) !== normalizeForCompare(editingJob.schedule)) patch.schedule = schedule;
        if (normalizeForCompare(payload) !== normalizeForCompare(editingJob.payload)) patch.payload = payload;
        if (normalizeForCompare(delivery) !== normalizeForCompare(editingJob.delivery ?? { mode: 'none' })) {
          patch.delivery = delivery;
        }
        if (normalizeForCompare(failureAlert) !== normalizeForCompare(editingJob.failureAlert ?? false)) {
          patch.failureAlert = failureAlert;
        }

        const res = await window.clawwork.updateCronJob(gatewayId, editingJob.id, patch);
        if (!res.ok) {
          setServerError(res.error ?? 'Unknown error');
          return;
        }
      } else {
        const addParams: CronJobCreate = {
          name,
          enabled,
          schedule,
          sessionTarget: target,
          wakeMode,
          payload,
          delivery,
          description: description || undefined,
          deleteAfterRun,
          agentId: normalizedAgentId,
          failureAlert,
          sessionKey: jobSessionKey,
        };

        const res = await window.clawwork.addCronJob(gatewayId, addParams);
        if (!res.ok) {
          setServerError(res.error ?? 'Unknown error');
          return;
        }
      }

      onSaved();
      onOpenChange(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }, [
    agentSelectValue,
    atTimestamp,
    cronExpr,
    cronTz,
    deleteAfterRun,
    deliveryChannel,
    deliveryMode,
    deliveryTarget,
    description,
    editingJob,
    enabled,
    everyValue,
    everyUnit,
    failureAlertAfter,
    failureAlertEnabled,
    failureAlertMode,
    failureAlertTarget,
    gatewayId,
    message,
    model,
    name,
    onOpenChange,
    onSaved,
    payloadKind,
    scheduleKind,
    sessionTarget,
    thinking,
    timeoutSeconds,
    validate,
    defaultAgentId,
    wakeMode,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex max-h-screen flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('cron.editJob') : t('cron.createJob')}</DialogTitle>
          <DialogDescription>{t('cron.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2" style={{ scrollbarWidth: 'none' }}>
          <div>
            <label className={labelClass}>{t('cron.fieldName')}</label>
            <input
              type="text"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('cron.fieldNamePlaceholder')}
            />
          </div>

          <div>
            <label className={labelClass}>{t('cron.fieldScheduleType')}</label>
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
              {(['cron', 'every', 'at'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={[
                    'flex-1 px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)]',
                    scheduleKind === kind
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                  ].join(' ')}
                  onClick={() => setScheduleKind(kind)}
                >
                  {t(`cron.schedule_${kind}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('cron.fieldScheduleDetail')}</label>
            {scheduleKind === 'cron' && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {CRON_PRESETS.map((preset) => (
                    <button
                      key={preset.expr}
                      type="button"
                      className={[
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                        cronExpr === preset.expr
                          ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                      ].join(' ')}
                      onClick={() => setCronExpr(preset.expr)}
                    >
                      {t(preset.labelKey)}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className={inputClass}
                  value={cronExpr}
                  onChange={(e) => setCronExpr(e.target.value)}
                  placeholder="0 9 * * 1-5"
                />
                {cronDescription && <p className="text-xs text-[var(--text-muted)]">{cronDescription}</p>}
                {cronExpr.trim() && !cronDescription && (
                  <p className="text-xs text-[var(--warning)]">{t('cron.invalidExpression')}</p>
                )}
                <input
                  type="text"
                  className={inputClass}
                  value={cronTz}
                  onChange={(e) => setCronTz(e.target.value)}
                  placeholder={t('cron.timezonePlaceholder')}
                />
              </div>
            )}
            {scheduleKind === 'every' && (
              <div className="flex gap-2">
                <input
                  type="number"
                  className={[inputClass, 'flex-1'].join(' ')}
                  value={everyValue}
                  onChange={(e) => setEveryValue(e.target.value)}
                  placeholder={t('cron.everyValuePlaceholder')}
                  min={1}
                />
                <select
                  className={[selectClass, 'w-auto min-w-24'].join(' ')}
                  value={everyUnit}
                  onChange={(e) => setEveryUnit(e.target.value as EveryUnit)}
                >
                  <option value="minutes">{t('cron.unit_minutes')}</option>
                  <option value="hours">{t('cron.unit_hours')}</option>
                  <option value="days">{t('cron.unit_days')}</option>
                </select>
              </div>
            )}
            {scheduleKind === 'at' && (
              <input
                type="datetime-local"
                className={inputClass}
                value={atTimestamp}
                onChange={(e) => setAtTimestamp(e.target.value)}
              />
            )}
          </div>

          <div>
            <label className={labelClass}>{t('cron.fieldPayloadType')}</label>
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
              {(['agentTurn', 'systemEvent'] as const).map((kind) => {
                const disabled = kind === 'agentTurn' && !canUseAgentTurn;
                return (
                  <button
                    key={kind}
                    type="button"
                    disabled={disabled}
                    className={[
                      'flex-1 px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)]',
                      payloadKind === kind
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                      disabled ? 'opacity-40 cursor-not-allowed' : '',
                    ].join(' ')}
                    onClick={() => setPayloadKind(kind)}
                  >
                    {t(`cron.payload_${kind}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('cron.fieldMessage')}</label>
            <textarea
              className={[inputClass, 'min-h-20 resize-y'].join(' ')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('cron.messagePlaceholder')}
              rows={3}
            />
          </div>

          <div>
            <label className={labelClass}>{t('cron.fieldSessionTarget')}</label>
            <select
              className={selectClass}
              value={sessionTarget}
              onChange={(e) => setSessionTarget(e.target.value as SessionTargetMode)}
            >
              <option value="task">{t('cron.sessionTarget_task')}</option>
              <option value="main">{t('cron.sessionTarget_main')}</option>
            </select>
            {sessionTarget === 'task' && (
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">{t('cron.taskSessionNote')}</p>
            )}
            {sessionTarget === 'main' && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--warning)]">
                <AlertTriangle size={14} />
                {t('cron.mainSessionNote')}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('cron.fieldEnabled')}</label>
            <Switch checked={enabled} onCheckedChange={setEnabled} aria-label={t('cron.fieldEnabled')} />
          </div>

          <div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {t('cron.advancedOptions')}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 pl-1">
                <div>
                  <label className={labelClass}>{t('cron.fieldDescription')}</label>
                  <textarea
                    className={[inputClass, 'min-h-16 resize-y'].join(' ')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <label className={labelClass}>{t('cron.agent')}</label>
                  <select
                    className={selectClass}
                    value={agentSelectValue}
                    onChange={(e) => setAgentId(e.target.value)}
                    disabled={loadingCatalogs}
                  >
                    <option value="">{loadingCatalogs ? t('cron.loadingCatalogs') : t('cron.defaultAgent')}</option>
                    {agentOptions.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                {payloadKind === 'agentTurn' && (
                  <>
                    <div>
                      <label className={labelClass}>{t('cron.model')}</label>
                      <select className={selectClass} value={model} onChange={(e) => setModel(e.target.value)}>
                        <option value="">{t('cron.useDefaultModel')}</option>
                        {modelOptions.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>{t('cron.thinking')}</label>
                      <select className={selectClass} value={thinking} onChange={(e) => setThinking(e.target.value)}>
                        <option value="">{t('cron.useDefaultThinking')}</option>
                        {['off', 'minimal', 'low', 'medium', 'high', 'adaptive'].map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>{t('cron.timeout')}</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={timeoutSeconds}
                        onChange={(e) => setTimeoutSeconds(e.target.value)}
                        placeholder={t('cron.timeoutPlaceholder')}
                        min={1}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className={labelClass}>{t('cron.fieldWakeMode')}</label>
                  <select
                    className={selectClass}
                    value={wakeMode}
                    onChange={(e) => setWakeMode(e.target.value as 'now' | 'next-heartbeat')}
                  >
                    <option value="now">{t('cron.wakeMode_now')}</option>
                    <option value="next-heartbeat">{t('cron.wakeMode_nextHeartbeat')}</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>{t('cron.delivery.label')}</label>
                  <select
                    className={selectClass}
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                  >
                    <option value="none">{t('cron.delivery.none')}</option>
                    <option value="announce">{t('cron.delivery.announce')}</option>
                    <option value="webhook">{t('cron.delivery.webhook')}</option>
                  </select>
                  {deliveryMode === 'none' && (
                    <p className="mt-1.5 text-xs text-[var(--text-muted)]">{t('cron.deliveryHint')}</p>
                  )}
                  {deliveryMode === 'announce' && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        className={inputClass}
                        value={deliveryChannel}
                        onChange={(e) => setDeliveryChannel(e.target.value)}
                        placeholder={t('cron.deliveryChannelPlaceholder')}
                      />
                      <input
                        type="text"
                        className={inputClass}
                        value={deliveryTarget}
                        onChange={(e) => setDeliveryTarget(e.target.value)}
                        placeholder={t('cron.deliveryTargetPlaceholder')}
                      />
                      <p className="text-xs text-[var(--text-muted)]">{t('cron.deliveryAnnounceHint')}</p>
                    </div>
                  )}
                  {deliveryMode === 'webhook' && (
                    <div className="mt-2">
                      <input
                        type="url"
                        className={inputClass}
                        value={deliveryTarget}
                        onChange={(e) => setDeliveryTarget(e.target.value)}
                        placeholder={t('cron.deliveryWebhookUrl')}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-secondary)]">{t('cron.failureAlert')}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t('cron.failureAlertHint')}</p>
                    </div>
                    <Switch
                      checked={failureAlertEnabled}
                      onCheckedChange={setFailureAlertEnabled}
                      aria-label={t('cron.failureAlert')}
                    />
                  </div>

                  {failureAlertEnabled && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>{t('cron.failureAlertAfter')}</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={failureAlertAfter}
                          onChange={(e) => setFailureAlertAfter(e.target.value)}
                          min={1}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>{t('cron.failureAlertMode')}</label>
                        <select
                          className={selectClass}
                          value={failureAlertMode}
                          onChange={(e) => setFailureAlertMode(e.target.value as FailureAlertMode)}
                        >
                          <option value="announce">{t('cron.delivery.announce')}</option>
                          <option value="webhook">{t('cron.delivery.webhook')}</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>
                          {failureAlertMode === 'webhook' ? t('cron.deliveryWebhookUrl') : t('cron.failureAlertTarget')}
                        </label>
                        <input
                          type={failureAlertMode === 'webhook' ? 'url' : 'text'}
                          className={inputClass}
                          value={failureAlertTarget}
                          onChange={(e) => setFailureAlertTarget(e.target.value)}
                          placeholder={
                            failureAlertMode === 'webhook'
                              ? t('cron.deliveryWebhookUrl')
                              : t('cron.deliveryTargetPlaceholder')
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {scheduleKind === 'at' && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                      {t('cron.fieldDeleteAfterRun')}
                    </label>
                    <Switch
                      checked={deleteAfterRun}
                      onCheckedChange={setDeleteAfterRun}
                      aria-label={t('cron.fieldDeleteAfterRun')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {serverError && (
          <p className="flex items-center gap-1.5 text-sm text-[var(--danger)] bg-[var(--danger-bg)] border border-[var(--danger)]/20 rounded-lg px-3 py-2">
            <AlertTriangle size={14} />
            {serverError}
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? t('common.save') : t('cron.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
