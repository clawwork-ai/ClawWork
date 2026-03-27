import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Loader2, Server, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motionDuration, motionEase, motion as motionPresets } from '@/styles/design-tokens';
import logo from '@/assets/logo.png';
import { parseGatewaySetupCode, validateGatewayForm, type GatewayAuthMode } from '@/lib/gateway-auth';
import SectionCard from '@/components/semantic/SectionCard';
import ToolbarButton from '@/components/semantic/ToolbarButton';
import InlineNotice from '@/components/semantic/InlineNotice';

interface SetupProps {
  onSetupComplete: () => void;
  initialStep?: 'workspace' | 'gateway';
}

type Step = 'workspace' | 'gateway';

export default function Setup({ onSetupComplete, initialStep = 'workspace' }: SetupProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(initialStep);

  // Step 1: workspace
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2: gateway
  const [gwName, setGwName] = useState('Default Gateway');
  const [gwUrl, setGwUrl] = useState('ws://127.0.0.1:18789');
  const [gwAuthMode, setGwAuthMode] = useState<GatewayAuthMode>('token');
  const [gwToken, setGwToken] = useState('');
  const [gwPassword, setGwPassword] = useState('');
  const [gwPairingCode, setGwPairingCode] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGwAuthModeChange = (mode: GatewayAuthMode) => {
    setGwAuthMode(mode);
    setGwToken('');
    setGwPassword('');
    setGwPairingCode('');
    setTestResult(null);
    if (mode === 'pairingCode') {
      setGwUrl('');
    } else if (!gwUrl.trim()) {
      setGwUrl('ws://127.0.0.1:18789');
    }
  };

  const tryParseGwSetupCode = (raw: string): boolean => {
    const parsed = parseGatewaySetupCode(raw);
    if (!parsed) return false;
    setGwUrl(parsed.url);
    setGwPairingCode(parsed.pairingCode);
    setTestResult(null);
    return true;
  };

  const gwAuthValue = gwAuthMode === 'token' ? gwToken : gwAuthMode === 'password' ? gwPassword : gwPairingCode;
  const handleGwAuthChange = (v: string) => {
    if (gwAuthMode === 'token') setGwToken(v);
    else if (gwAuthMode === 'password') setGwPassword(v);
    else setGwPairingCode(v);
    setTestResult(null);
  };

  useEffect(() => {
    window.clawwork.getDefaultWorkspacePath().then(setPath);
  }, []);

  const handleBrowse = async (): Promise<void> => {
    const selected = await window.clawwork.browseWorkspace();
    if (selected) {
      setPath(selected);
      setError('');
    }
  };

  const handleWorkspaceNext = async (): Promise<void> => {
    if (!path.trim()) {
      setError(t('setup.errSelectDir'));
      return;
    }
    setLoading(true);
    setError('');
    const result = await window.clawwork.setupWorkspace(path.trim());
    setLoading(false);
    if (result.ok) {
      setStep('gateway');
      setError('');
    } else {
      setError(result.error ?? t('setup.errInitFailed'));
    }
  };

  const handleTestGateway = useCallback(async () => {
    if (gwAuthMode === 'pairingCode') {
      setTestResult('fail');
      setError(t('pairing.cannotTestPairingCode'));
      return;
    }
    try {
      new URL(gwUrl);
    } catch {
      setTestResult('fail');
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await window.clawwork.testGateway(gwUrl, {
      token: gwToken || undefined,
      password: gwPassword || undefined,
    });
    setTesting(false);
    setTestResult(res.ok || res.pairingRequired ? 'success' : 'fail');
    if (res.pairingRequired) {
      setError(t('pairing.instructions'));
    }
  }, [gwAuthMode, gwUrl, gwToken, gwPassword, t]);

  const handleFinish = useCallback(async () => {
    const validationError = validateGatewayForm({
      mode: gwAuthMode,
      name: gwName,
      url: gwUrl,
      token: gwToken,
      password: gwPassword,
      pairingCode: gwPairingCode,
    });
    if (validationError) {
      setError(t(`settings.${validationError}`));
      return;
    }
    setSaving(true);
    setError('');
    const gw = {
      id: crypto.randomUUID(),
      name: gwName.trim(),
      url: gwUrl.trim(),
      token: gwToken.trim() || undefined,
      password: gwPassword.trim() || undefined,
      pairingCode: gwPairingCode.trim() || undefined,
      authMode: gwAuthMode,
      isDefault: true,
    };
    const res = await window.clawwork.addGateway(gw);
    setSaving(false);
    if (res.ok) {
      onSetupComplete();
    } else {
      setError(res.error ?? t('errors.failed'));
    }
  }, [gwAuthMode, gwName, gwUrl, gwToken, gwPassword, gwPairingCode, onSetupComplete, t]);

  const handleSkipGateway = useCallback(() => {
    onSetupComplete();
  }, [onSetupComplete]);

  const inputClass = cn(
    'titlebar-no-drag flex-1 h-[var(--density-control-height-lg)] px-3.5 rounded-lg',
    'bg-[var(--bg-tertiary)] border border-[var(--border)]',
    'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
    'outline-none focus:border-[var(--border-accent)] transition-colors',
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <div className="titlebar-drag fixed top-0 left-0 right-0 h-8 z-50" />

      <div className="flex flex-col items-center justify-center w-full px-6">
        <motion.div {...motionPresets.slideUp} className="w-full max-w-lg space-y-8">
          {/* Logo + title */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 scale-[2.5] rounded-full bg-[var(--accent)] opacity-[0.06] blur-2xl" />
              <img src={logo} alt="ClawWork" className="relative w-16 h-16 rounded-2xl shadow-[var(--glow-accent)]" />
            </div>
            <h1 className="type-section-title text-[var(--text-primary)]">{t('setup.welcome')}</h1>
            <p className="type-body leading-relaxed text-[var(--text-muted)]">
              {step === 'workspace' ? (
                <>
                  {t('setup.desc1')}
                  <br />
                  {t('setup.desc2')}
                </>
              ) : (
                t('setup.gatewayDesc')
              )}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {(['workspace', 'gateway'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'type-badge flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                      step === s
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : s === 'workspace' && step === 'gateway'
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
                    )}
                  >
                    {s === 'workspace' && step === 'gateway' ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'type-support',
                      step === s ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
                    )}
                  >
                    {s === 'workspace' ? t('setup.stepWorkspace') : t('setup.stepGateway')}
                  </span>
                </div>
                {i === 0 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 rounded mx-1',
                      step === 'gateway' ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]',
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 'workspace' ? (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: motionDuration.moderate, ease: motionEase.standard }}
                className="space-y-6"
              >
                <SectionCard
                  title={
                    <span className="inline-flex items-center gap-2">
                      <FolderOpen size={15} className="text-[var(--text-muted)]" />
                      {t('setup.workspaceDir')}
                    </span>
                  }
                  bodyClassName="space-y-4"
                >
                  <p className="type-support leading-relaxed text-[var(--text-muted)]">{t('setup.workspaceExplain')}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={path}
                      onChange={(e) => {
                        setPath(e.target.value);
                        setError('');
                      }}
                      className={inputClass}
                      placeholder={t('setup.selectDir')}
                    />
                    <ToolbarButton
                      variant="outline"
                      onClick={handleBrowse}
                      className="h-[var(--density-control-height-lg)]"
                      icon={<FolderOpen size={15} />}
                    >
                      {t('setup.browse')}
                    </ToolbarButton>
                  </div>
                  <p className="type-support text-[var(--text-muted)] opacity-70">{t('setup.workspaceHint')}</p>
                </SectionCard>

                <ToolbarButton
                  onClick={handleWorkspaceNext}
                  disabled={loading || !path.trim()}
                  className="w-full h-11 justify-center gap-2"
                  icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
                >
                  {loading ? t('setup.initializing') : t('setup.next')}
                  {!loading ? <ArrowRight size={16} /> : null}
                </ToolbarButton>
              </motion.div>
            ) : (
              <motion.div
                key="gateway"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: motionDuration.moderate, ease: motionEase.standard }}
                className="space-y-6"
              >
                <SectionCard
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Server size={15} className="text-[var(--text-muted)]" />
                      {t('setup.gatewayConfig')}
                    </span>
                  }
                  bodyClassName="space-y-4"
                >
                  <p className="type-support leading-relaxed text-[var(--text-muted)]">{t('setup.gatewayExplain')}</p>
                  <div>
                    <label className="type-label mb-1 block text-[var(--text-muted)]">
                      {t('settings.gatewayName')}
                    </label>
                    <input
                      type="text"
                      value={gwName}
                      onChange={(e) => setGwName(e.target.value)}
                      placeholder={t('setup.defaultGatewayName')}
                      className={cn(inputClass, 'w-full')}
                    />
                  </div>
                  <div>
                    <label className="type-label mb-1.5 block text-[var(--text-muted)]">
                      {t('settings.authMethod')}
                    </label>
                    <div className="flex rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] p-0.5 gap-0.5 mb-2">
                      {(
                        [
                          { mode: 'token', label: t('settings.token') },
                          { mode: 'password', label: t('settings.password') },
                          { mode: 'pairingCode', label: t('settings.pairingCode') },
                        ] as const
                      ).map(({ mode, label }) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleGwAuthModeChange(mode)}
                          className={cn(
                            'titlebar-no-drag glow-focus flex-1 h-7 type-label rounded-md transition-colors',
                            gwAuthMode === mode
                              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[var(--shadow-card)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {gwAuthMode !== 'pairingCode' && (
                    <div>
                      <label className="type-label mb-1 block text-[var(--text-muted)]">
                        {t('settings.gatewayUrl')}
                      </label>
                      <input
                        type="text"
                        value={gwUrl}
                        onChange={(e) => {
                          setGwUrl(e.target.value);
                          setTestResult(null);
                        }}
                        placeholder={t('setup.defaultGatewayUrl')}
                        className={cn(inputClass, 'w-full')}
                      />
                      <p className="type-support text-[var(--text-muted)] opacity-70 mt-1">{t('setup.urlHint')}</p>
                    </div>
                  )}
                  <div>
                    <label className="type-label mb-1.5 block text-[var(--text-muted)]">
                      {gwAuthMode === 'pairingCode' ? t('settings.pairingCode') : t('settings.authMethod')}
                    </label>
                    <input
                      type="password"
                      value={gwAuthValue}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (gwAuthMode === 'pairingCode' && !tryParseGwSetupCode(v)) {
                          handleGwAuthChange(v);
                        } else if (gwAuthMode !== 'pairingCode') {
                          handleGwAuthChange(v);
                        }
                      }}
                      onPaste={(e) => {
                        if (gwAuthMode !== 'pairingCode') return;
                        const text = e.clipboardData.getData('text');
                        if (tryParseGwSetupCode(text)) e.preventDefault();
                      }}
                      placeholder={
                        gwAuthMode === 'pairingCode'
                          ? t('settings.setupCodePlaceholder')
                          : gwAuthMode === 'token'
                            ? t('settings.tokenPlaceholder')
                            : t('settings.passwordPlaceholder')
                      }
                      className={cn(inputClass, 'w-full')}
                    />
                    {gwAuthMode === 'pairingCode' && gwUrl && gwUrl !== 'ws://127.0.0.1:18789' && (
                      <p className="type-support mt-1 text-[var(--accent)]">
                        ✓ {t('settings.setupCodeParsed')}: <span className="type-mono-data">{gwUrl}</span>
                      </p>
                    )}
                    <p className="type-support text-[var(--text-muted)] opacity-70 mt-1">
                      {gwAuthMode === 'token'
                        ? t('setup.tokenHint')
                        : gwAuthMode === 'password'
                          ? t('setup.passwordHint')
                          : t('setup.pairingCodeHint')}
                    </p>
                  </div>

                  {gwAuthMode !== 'pairingCode' && (
                    <div className="flex items-center gap-2">
                      <ToolbarButton
                        variant="default"
                        onClick={handleTestGateway}
                        disabled={testing}
                        className="justify-center"
                        icon={testing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      >
                        {t('settings.testConnection')}
                      </ToolbarButton>
                      {testResult === 'success' && (
                        <span className="type-support flex items-center gap-1 text-[var(--accent)]">
                          <CheckCircle2 size={12} /> {t('settings.testSuccess')}
                        </span>
                      )}
                      {testResult === 'fail' && (
                        <span className="type-support text-[var(--danger)]">{t('settings.testFailed')}</span>
                      )}
                    </div>
                  )}
                </SectionCard>

                <div className="flex gap-3">
                  <ToolbarButton
                    variant="outline"
                    onClick={() => setStep('workspace')}
                    className="h-11"
                    icon={<ArrowLeft size={16} />}
                  >
                    {t('setup.back')}
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={handleFinish}
                    disabled={saving}
                    className="flex-1 h-11 justify-center gap-2"
                    icon={saving ? <Loader2 size={16} className="animate-spin" /> : undefined}
                  >
                    {saving
                      ? t('setup.initializing')
                      : gwAuthMode === 'pairingCode'
                        ? t('settings.startPairing')
                        : t('setup.getStarted')}
                  </ToolbarButton>
                </div>
                <button
                  onClick={handleSkipGateway}
                  className="glow-focus type-support w-full text-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {t('setup.skipGateway')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        </motion.div>
      </div>
    </div>
  );
}
