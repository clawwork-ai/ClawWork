import { useState, useEffect, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  Crown,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUiStore, type GatewayConnectionStatus } from '@/stores/uiStore';
import EmptyState from '@/components/semantic/EmptyState';
import InlineNotice from '@/components/semantic/InlineNotice';
import SettingGroup from '@/components/semantic/SettingGroup';
import ToolbarButton from '@/components/semantic/ToolbarButton';
import {
  inferGatewayAuthMode,
  parseGatewaySetupCode,
  validateGatewayForm,
  type GatewayAuthMode,
} from '@/lib/gateway-auth';

type GatewayType = 'openclaw';

interface GatewayFormData {
  name: string;
  url: string;
  token: string;
  password: string;
  pairingCode: string;
  authMode?: GatewayAuthMode;
}

interface GatewayServerConfig {
  id: string;
  name: string;
  url: string;
  token?: string;
  password?: string;
  pairingCode?: string;
  authMode?: GatewayAuthMode;
  isDefault?: boolean;
  color?: string;
  type?: GatewayType;
}

const EMPTY_FORM: GatewayFormData = {
  name: '',
  url: 'ws://127.0.0.1:18789',
  token: '',
  password: '',
  pairingCode: '',
  authMode: 'token',
};

const STATUS_ICON: Record<GatewayConnectionStatus, { icon: typeof CheckCircle2; color: string }> = {
  connected: { icon: CheckCircle2, color: 'text-[var(--accent)]' },
  connecting: { icon: Loader2, color: 'text-[var(--warning)]' },
  disconnected: { icon: XCircle, color: 'text-[var(--danger)]' },
};

const GATEWAY_TYPE_LABEL: Record<GatewayType, string> = {
  openclaw: 'OpenClaw',
};

const inputClass = cn(
  'flex-1 h-[var(--density-control-height-lg)] px-3 py-2 rounded-md',
  'bg-[var(--bg-tertiary)] border border-[var(--border)]',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
  'outline-none ring-accent-focus transition-colors',
);

function GatewayCard({
  gw,
  status,
  isDefault,
  isEditing,
  serverVersion,
  onEdit,
  onRemove,
  onSetDefault,
}: {
  gw: GatewayServerConfig;
  status: GatewayConnectionStatus;
  isDefault: boolean;
  isEditing: boolean;
  serverVersion?: string;
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
}) {
  const { t } = useTranslation();
  const StatusIcon = STATUS_ICON[status].icon;
  const typeLabel = GATEWAY_TYPE_LABEL[gw.type ?? 'openclaw'];

  return (
    <motion.div
      layout
      {...motionPresets.listItem}
      className={cn(
        'surface-card rounded-xl px-4 py-3.5 transition-colors',
        isEditing ? 'border-[var(--accent)]/40' : 'border-[var(--border-subtle)]',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            status === 'connected' ? 'bg-[var(--accent-soft)]' : 'bg-[var(--bg-tertiary)]',
          )}
        >
          <Server size={16} className={status === 'connected' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="type-label truncate text-[var(--text-primary)]">{gw.name}</span>
            {isDefault && (
              <span className="type-badge normal-case flex items-center gap-1 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[var(--accent)]">
                <Crown size={10} />
                {t('settings.default')}
              </span>
            )}
            <span className="type-badge normal-case rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-muted)]">
              {typeLabel}
            </span>
            {serverVersion && (
              <span className="type-mono-data rounded-md bg-[var(--info)]/10 px-1.5 py-0.5 text-[var(--info)]">
                v{serverVersion}
              </span>
            )}
          </div>
          <p className="type-mono-data mt-0.5 truncate text-[var(--text-muted)]">{gw.url}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusIcon size={12} className={cn(STATUS_ICON[status].color, status === 'connecting' && 'animate-spin')} />
          <span className={cn('type-support', STATUS_ICON[status].color)}>{t(`connection.${status}`)}</span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-1 pl-3 border-l border-[var(--border-subtle)]">
          {!isDefault && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onSetDefault}
                  aria-label={`${t('settings.setAsDefault')}: ${gw.name}`}
                >
                  <Crown size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('settings.setAsDefault')}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`${t('settings.edit')}: ${gw.name}`}>
                <Pencil size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.edit')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRemove}
                aria-label={`${t('settings.remove')}: ${gw.name}`}
              >
                <Trash2 size={14} className="text-[var(--danger)]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.remove')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
}

function GatewayForm({
  editingId,
  form,
  setForm,
  testing,
  saving,
  onTest,
  onSave,
  onClose,
}: {
  editingId: string | null;
  form: GatewayFormData;
  setForm: React.Dispatch<React.SetStateAction<GatewayFormData>>;
  testing: boolean;
  saving: boolean;
  onTest: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const nameId = 'gateway-form-name';
  const urlId = 'gateway-form-url';
  const authInputId = 'gateway-form-auth';

  const [authMode, setAuthMode] = useState<GatewayAuthMode>(() => form.authMode ?? inferGatewayAuthMode(form));

  useEffect(() => {
    const nextMode = form.authMode ?? inferGatewayAuthMode(form);
    setAuthMode((currentMode) => (currentMode === nextMode ? currentMode : nextMode));
  }, [form]);

  const handleAuthModeChange = (mode: GatewayAuthMode) => {
    setAuthMode(mode);
    setForm((f) => ({
      ...f,
      token: '',
      password: '',
      pairingCode: '',
      authMode: mode,
      url: mode === 'pairingCode' ? '' : f.url || 'ws://127.0.0.1:18789',
    }));
  };

  const tryParseSetupCode = (raw: string): boolean => {
    const parsed = parseGatewaySetupCode(raw);
    if (!parsed) return false;
    setForm((f) => ({ ...f, url: parsed.url, pairingCode: parsed.pairingCode }));
    return true;
  };

  const AUTH_TABS: { mode: GatewayAuthMode; label: string }[] = [
    { mode: 'token', label: t('settings.token') },
    { mode: 'password', label: t('settings.password') },
    { mode: 'pairingCode', label: t('settings.pairingCode') },
  ];

  const authPlaceholder =
    authMode === 'token'
      ? t('settings.tokenPlaceholder')
      : authMode === 'password'
        ? t('settings.passwordPlaceholder')
        : t('settings.pairingCodePlaceholder');

  const authValue = authMode === 'token' ? form.token : authMode === 'password' ? form.password : form.pairingCode;

  const handleAuthChange = (v: string) => {
    if (authMode === 'token') setForm((f) => ({ ...f, token: v }));
    else if (authMode === 'password') setForm((f) => ({ ...f, password: v }));
    else setForm((f) => ({ ...f, pairingCode: v }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      className="overflow-hidden"
    >
      <div className="surface-card space-y-4 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <span className="type-label text-[var(--text-primary)]">
            {editingId ? t('settings.editGateway') : t('settings.addGateway')}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('common.close')}>
            <X size={14} />
          </Button>
        </div>
        <div>
          <label htmlFor={nameId} className="type-label mb-1.5 block text-[var(--text-secondary)]">
            {t('settings.gatewayName')}
          </label>
          <input
            id={nameId}
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('settings.gatewayNamePlaceholder')}
            className={cn(inputClass, 'w-full')}
          />
        </div>
        <div>
          <label className="type-label mb-1.5 block text-[var(--text-secondary)]">{t('settings.authMethod')}</label>
          <div className="flex rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] p-0.5 gap-0.5 mb-3">
            {AUTH_TABS.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleAuthModeChange(mode)}
                className={cn(
                  'glow-focus type-label flex-1 h-7 rounded-md transition-colors',
                  authMode === mode
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[var(--shadow-card)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {authMode !== 'pairingCode' && (
          <div>
            <label htmlFor={urlId} className="type-label mb-1.5 block text-[var(--text-secondary)]">
              {t('settings.gatewayUrl')}
            </label>
            <input
              id={urlId}
              type="text"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="ws://127.0.0.1:18789"
              className={cn(inputClass, 'w-full')}
            />
          </div>
        )}
        <div>
          <label className="type-label mb-1.5 block text-[var(--text-secondary)]">
            {authMode === 'pairingCode' ? t('settings.pairingCode') : t('settings.authMethod')}
          </label>
          <input
            id={authInputId}
            type="password"
            value={authValue}
            onChange={(e) => {
              const v = e.target.value;
              if (authMode === 'pairingCode' && !tryParseSetupCode(v)) {
                handleAuthChange(v);
              } else if (authMode !== 'pairingCode') {
                handleAuthChange(v);
              }
            }}
            onPaste={(e) => {
              if (authMode !== 'pairingCode') return;
              const text = e.clipboardData.getData('text');
              if (tryParseSetupCode(text)) e.preventDefault();
            }}
            placeholder={authMode === 'pairingCode' ? t('settings.setupCodePlaceholder') : authPlaceholder}
            className={cn(inputClass, 'w-full')}
          />
          {authMode === 'pairingCode' && form.url && form.url !== 'ws://127.0.0.1:18789' && (
            <p className="type-support mt-1.5 text-[var(--accent)]">
              ✓ {t('settings.setupCodeParsed')}: <span className="type-mono-data">{form.url}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1">
          {authMode !== 'pairingCode' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={testing}
              className="titlebar-no-drag gap-1.5"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {t('settings.testConnection')}
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={onClose} className="titlebar-no-drag">
            {t('common.cancel')}
          </Button>
          <Button variant="default" size="sm" onClick={onSave} disabled={saving} className="titlebar-no-drag gap-1.5">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editingId
              ? t('common.save')
              : authMode === 'pairingCode'
                ? t('settings.startPairing')
                : t('settings.addGateway')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function GatewaysSection() {
  const { t } = useTranslation();
  const gatewayStatusMap = useUiStore((s) => s.gatewayStatusMap);
  const gatewayVersionMap = useUiStore((s) => s.gatewayVersionMap);
  const setDefaultGatewayId = useUiStore((s) => s.setDefaultGatewayId);
  const setGatewayInfoMap = useUiStore((s) => s.setGatewayInfoMap);

  const [gateways, setGateways] = useState<GatewayServerConfig[]>([]);
  const [defaultGwId, setDefaultGwId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GatewayFormData>(EMPTY_FORM);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPairingDialog, setShowPairingDialog] = useState(false);
  const [pairingRetrying, setPairingRetrying] = useState(false);
  const [deletingGwId, setDeletingGwId] = useState<string | null>(null);

  const loadGateways = useCallback(async () => {
    const settings = await window.clawwork.getSettings();
    if (!settings) {
      setGateways([]);
      setDefaultGwId(null);
      setDefaultGatewayId(null);
      setGatewayInfoMap({});
      return;
    }
    const gwList = settings.gateways ?? [];
    const nextDefaultGatewayId = settings.defaultGatewayId ?? gwList[0]?.id ?? null;
    setGateways(gwList);
    setDefaultGwId(nextDefaultGatewayId);
    setDefaultGatewayId(nextDefaultGatewayId);
    const infoMap: Record<string, { id: string; name: string; color?: string }> = {};
    for (const gw of gwList) {
      infoMap[gw.id] = { id: gw.id, name: gw.name, color: gw.color };
    }
    setGatewayInfoMap(infoMap);
  }, [setDefaultGatewayId, setGatewayInfoMap]);

  useEffect(() => {
    loadGateways();
  }, [loadGateways]);

  const openAddForm = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((gw: GatewayServerConfig) => {
    setEditingId(gw.id);
    setForm({
      name: gw.name,
      url: gw.url,
      token: gw.token ?? '',
      password: gw.password ?? '',
      pairingCode: gw.pairingCode ?? '',
      authMode: gw.authMode,
    });
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleTest = useCallback(async () => {
    const authMode = inferGatewayAuthMode(form);
    if (authMode === 'pairingCode') {
      toast.error(t('pairing.cannotTestPairingCode'));
      return;
    }
    try {
      new URL(form.url);
    } catch {
      toast.error(t('settings.invalidUrl'));
      return;
    }
    setTesting(true);
    const auth = {
      token: form.token || undefined,
      password: form.password || undefined,
    };
    const res = await window.clawwork.testGateway(form.url, auth);
    setTesting(false);
    if (res.ok) {
      toast.success(t('settings.testSuccess'));
    } else if (res.pairingRequired) {
      setShowPairingDialog(true);
    } else {
      toast.error(t('settings.testFailed'), { description: res.error });
    }
  }, [form, t]);

  const handlePairingRetry = useCallback(async () => {
    setPairingRetrying(true);
    const auth = {
      token: form.token || undefined,
      password: form.password || undefined,
    };
    const res = await window.clawwork.testGateway(form.url, auth);
    setPairingRetrying(false);
    if (res.ok) {
      setShowPairingDialog(false);
      toast.success(t('pairing.approved'));
    } else {
      toast.error(t('pairing.stillPending'), { description: res.error });
    }
  }, [form.url, form.token, form.password, t]);

  const handleSave = useCallback(async () => {
    const authMode = inferGatewayAuthMode(form);
    const validationError = validateGatewayForm({
      mode: authMode,
      name: form.name,
      url: form.url,
      token: form.token,
      password: form.password,
      pairingCode: form.pairingCode,
    });
    if (validationError) {
      toast.error(t(`settings.${validationError}`));
      return;
    }

    setSaving(true);
    if (editingId) {
      const res = await window.clawwork.updateGateway(editingId, {
        name: form.name.trim(),
        url: form.url.trim(),
        token: form.token.trim() || undefined,
        password: form.password.trim() || undefined,
        pairingCode: form.pairingCode.trim() || undefined,
        authMode,
      });
      if (res.ok) {
        toast.success(t('settings.gatewayUpdated'));
        closeForm();
        await loadGateways();
      } else {
        toast.error(res.error ?? t('errors.failed'));
      }
    } else {
      const newGw: GatewayServerConfig = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        url: form.url.trim(),
        token: form.token.trim() || undefined,
        password: form.password.trim() || undefined,
        pairingCode: form.pairingCode.trim() || undefined,
        authMode,
        type: 'openclaw',
      };
      const res = await window.clawwork.addGateway(newGw);
      if (res.ok) {
        toast.success(t('settings.gatewayAdded'));
        closeForm();
        await loadGateways();
      } else {
        toast.error(res.error ?? t('errors.failed'));
      }
    }
    setSaving(false);
  }, [form, editingId, closeForm, loadGateways, t]);

  const handleRemove = useCallback(
    async (gwId: string) => {
      const res = await window.clawwork.removeGateway(gwId);
      if (res.ok) {
        toast.success(t('settings.gatewayRemoved'));
        await loadGateways();
      } else {
        toast.error(res.error ?? t('errors.failed'));
      }
    },
    [loadGateways, t],
  );

  const handleSetDefault = useCallback(
    async (gwId: string) => {
      const res = await window.clawwork.setDefaultGateway(gwId);
      if (res.ok) {
        setDefaultGatewayId(gwId);
        await loadGateways();
        toast.success(t('settings.defaultUpdated'));
      }
    },
    [loadGateways, setDefaultGatewayId, t],
  );

  const deletingGw = deletingGwId ? gateways.find((g) => g.id === deletingGwId) : null;

  return (
    <>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="type-section-title text-[var(--text-primary)]">{t('settings.gateways')}</h3>
          {!showForm && (
            <ToolbarButton variant="soft" size="sm" onClick={openAddForm} icon={<Plus size={14} />}>
              {t('settings.addGateway')}
            </ToolbarButton>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {gateways.map((gw) => (
              <Fragment key={gw.id}>
                <GatewayCard
                  gw={gw}
                  status={gatewayStatusMap[gw.id] ?? 'disconnected'}
                  isDefault={gw.id === defaultGwId}
                  isEditing={editingId === gw.id && showForm}
                  serverVersion={gatewayVersionMap[gw.id]}
                  onEdit={() => openEditForm(gw)}
                  onRemove={() => setDeletingGwId(gw.id)}
                  onSetDefault={() => handleSetDefault(gw.id)}
                />
                {editingId === gw.id && showForm && (
                  <GatewayForm
                    editingId={editingId}
                    form={form}
                    setForm={setForm}
                    testing={testing}
                    saving={saving}
                    onTest={handleTest}
                    onSave={handleSave}
                    onClose={closeForm}
                  />
                )}
              </Fragment>
            ))}
          </AnimatePresence>

          {gateways.length === 0 && !showForm && (
            <SettingGroup>
              <EmptyState
                icon={<Server size={24} className="text-[var(--text-muted)]" />}
                title={t('settings.noGateways')}
                action={
                  <ToolbarButton variant="soft" size="sm" onClick={openAddForm} icon={<Plus size={14} />}>
                    {t('settings.addFirstGateway')}
                  </ToolbarButton>
                }
              />
            </SettingGroup>
          )}

          <AnimatePresence>
            {showForm && !editingId && (
              <GatewayForm
                editingId={null}
                form={form}
                setForm={setForm}
                testing={testing}
                saving={saving}
                onTest={handleTest}
                onSave={handleSave}
                onClose={closeForm}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={!!deletingGwId} onOpenChange={(open) => !open && setDeletingGwId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('settings.confirmDeleteTitle')}</DialogTitle>
            <DialogDescription className="pt-2">
              {t('settings.confirmDeleteDesc', { name: deletingGw?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDeletingGwId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (deletingGwId) handleRemove(deletingGwId);
                setDeletingGwId(null);
              }}
              className="gap-1.5"
            >
              <Trash2 size={14} />
              {t('settings.remove')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPairingDialog} onOpenChange={setShowPairingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-[var(--accent)]" />
              <DialogTitle>{t('pairing.title')}</DialogTitle>
            </div>
            <DialogDescription className="pt-2">{t('pairing.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <InlineNotice tone="info">{t('pairing.instructions')}</InlineNotice>
            <div className="type-support flex items-center gap-2 text-[var(--text-muted)]">
              <Loader2 size={14} className="animate-spin" />
              {t('pairing.waiting')}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPairingDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handlePairingRetry}
                disabled={pairingRetrying}
                className="gap-1.5"
              >
                {pairingRetrying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {t('pairing.retry')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
