import { useState, useEffect, useCallback, useRef } from 'react';
import { Star, Bug, RefreshCw, Loader2, Download, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import SettingRow from '@/components/semantic/SettingRow';
import SettingGroup from '@/components/semantic/SettingGroup';
import InlineNotice from '@/components/semantic/InlineNotice';
import { useUiStore } from '@/stores/uiStore';

const linkClass = cn(
  'type-label flex h-9 items-center justify-center gap-2 rounded-lg px-4 transition-colors',
  'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)]',
  'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.98]',
);

type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes?: string | null;
}

const DEV_MODE_TAP_COUNT = 5;
const DEV_MODE_TAP_WINDOW_MS = 3000;

export default function AboutSection() {
  const { t } = useTranslation();
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const devMode = useUiStore((s) => s.devMode);
  const setDevMode = useUiStore((s) => s.setDevMode);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleVersionClick = useCallback(() => {
    if (devMode) return;
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);
    const remaining = DEV_MODE_TAP_COUNT - tapCountRef.current;
    if (remaining > 0 && remaining <= 3) {
      toast.dismiss('dev-mode-hint');
      toast(t('settings.devModeSteps', { count: remaining }), { id: 'dev-mode-hint', duration: 2000 });
    }
    if (tapCountRef.current >= DEV_MODE_TAP_COUNT) {
      tapCountRef.current = 0;
      toast.dismiss('dev-mode-hint');
      setDevMode(true);
      toast.success(t('settings.devModeEnabled'));
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, DEV_MODE_TAP_WINDOW_MS);
  }, [devMode, setDevMode, t]);

  const handleDisableDevMode = useCallback(() => {
    setDevMode(false);
    toast.success(t('settings.devModeDisabled'));
  }, [setDevMode, t]);

  useEffect(() => {
    window.clawwork
      .getAppVersion()
      .then(setCurrentVersion)
      .catch(() => {});

    window.clawwork
      .getDeviceId()
      .then(setDeviceId)
      .catch(() => {});

    const unsubs: (() => void)[] = [];

    unsubs.push(
      window.clawwork.onUpdateDownloadProgress((progress) => {
        setUpdateState('downloading');
        setDownloadPercent(progress.percent);
      }),
    );

    unsubs.push(
      window.clawwork.onUpdateDownloaded((info) => {
        setUpdateState('downloaded');
        setVersionInfo((prev) => (prev ? { ...prev, latestVersion: info.version } : prev));
      }),
    );

    unsubs.push(
      window.clawwork.onUpdateError((err) => {
        setUpdateState('error');
        setErrorMessage(err.message);
      }),
    );

    window.clawwork
      .checkForUpdates()
      .then((result) => {
        setVersionInfo({
          currentVersion: result.currentVersion,
          latestVersion: result.latestVersion,
          releaseUrl: result.releaseUrl,
          releaseNotes: result.releaseNotes,
        });
        setCurrentVersion(result.currentVersion);
        if (result.hasUpdate) {
          setUpdateState('available');
        }
      })
      .catch((err: unknown) => {
        window.clawwork.reportDebugEvent({
          domain: 'renderer',
          event: 'about.update-check.mount-failed',
          data: { error: err instanceof Error ? err.message : String(err) },
        });
      });

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  const handleCheckForUpdates = useCallback(async () => {
    setUpdateState('checking');
    setErrorMessage('');
    try {
      const result = await window.clawwork.checkForUpdates();
      setVersionInfo({
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion,
        releaseUrl: result.releaseUrl,
        releaseNotes: result.releaseNotes,
      });
      setCurrentVersion(result.currentVersion);
      if (result.hasUpdate) {
        setUpdateState('available');
      } else {
        setUpdateState('idle');
        toast.success(t('settings.alreadyLatest'));
      }
    } catch {
      setUpdateState('error');
      setErrorMessage(t('settings.updateCheckFailed'));
    }
  }, [t]);

  const handleDownload = useCallback(async () => {
    setUpdateState('downloading');
    setDownloadPercent(0);
    const result = await window.clawwork.downloadUpdate();
    if (!result.ok) {
      setUpdateState('error');
      setErrorMessage(result.error ?? 'Download failed');
    }
  }, []);

  const handleInstall = useCallback(async () => {
    await window.clawwork.installUpdate();
  }, []);

  const isChecking = updateState === 'checking';

  return (
    <div>
      <h3 className="type-section-title mb-4 text-[var(--text-primary)]">{t('settings.about')}</h3>
      <SettingGroup>
        <div>
          <SettingRow label={t('settings.version')}>
            <span
              className="type-mono-data text-[var(--text-primary)] cursor-default select-none"
              onClick={handleVersionClick}
            >
              {currentVersion ? `v${currentVersion}` : '—'}
            </span>
          </SettingRow>
          {devMode && (
            <SettingRow label={t('settings.devMode')}>
              <Button variant="outline" size="sm" onClick={handleDisableDevMode}>
                {t('settings.devModeDisable')}
              </Button>
            </SettingRow>
          )}
          {devMode && deviceId && (
            <SettingRow label={t('settings.deviceId')}>
              <span className="type-mono-data select-all text-[var(--text-secondary)]">{deviceId}</span>
            </SettingRow>
          )}
        </div>

        {updateState === 'available' && versionInfo && (
          <div className="px-5 py-4">
            <InlineNotice tone="info">
              <div>
                <p className="type-label mb-2 text-[var(--text-primary)]">
                  {t('settings.newVersionAvailable', { version: versionInfo.latestVersion })}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="default" size="sm" onClick={handleDownload} className="gap-1.5">
                    <Download size={14} />
                    {t('settings.downloadUpdate')}
                  </Button>
                  {versionInfo.releaseUrl && (
                    <a
                      href={versionInfo.releaseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="type-support text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline"
                    >
                      {t('settings.downloadManually')}
                    </a>
                  )}
                </div>
              </div>
            </InlineNotice>
          </div>
        )}

        {updateState === 'downloading' && (
          <div className="px-5 py-4">
            <div className="rounded-lg px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)]">
              <p className="type-body mb-2 text-[var(--text-secondary)]">
                {t('settings.downloadProgress', { percent: downloadPercent })}
              </p>
              <div className="h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                  style={{ width: `${downloadPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {updateState === 'downloaded' && (
          <div className="px-5 py-4">
            <InlineNotice tone="info">
              <div>
                <p className="type-label mb-2 text-[var(--text-primary)]">
                  {t('settings.newVersionAvailable', { version: versionInfo?.latestVersion })}
                </p>
                <Button variant="default" size="sm" onClick={handleInstall} className="gap-1.5">
                  <RotateCcw size={14} />
                  {t('settings.readyToInstall')}
                </Button>
              </div>
            </InlineNotice>
          </div>
        )}

        {updateState === 'error' && (
          <div className="px-5 py-4">
            <InlineNotice
              tone="error"
              action={
                <Button variant="outline" size="sm" onClick={handleCheckForUpdates} className="gap-1.5">
                  <RefreshCw size={14} />
                  {t('settings.checkForUpdates')}
                </Button>
              }
            >
              {t('settings.updateError', { message: errorMessage })}
            </InlineNotice>
          </div>
        )}

        <div className="px-5 py-4 space-y-2">
          {(updateState === 'idle' || updateState === 'checking') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckForUpdates}
              disabled={isChecking}
              className="titlebar-no-drag gap-1.5 w-full justify-center"
            >
              {isChecking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {t('settings.checkForUpdates')}
            </Button>
          )}
          <a href="https://github.com/clawwork-ai/clawwork" target="_blank" rel="noreferrer" className={linkClass}>
            <Star size={14} />
            {t('settings.githubStar')}
          </a>
          <a
            href="https://github.com/clawwork-ai/clawwork/issues/new"
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            <Bug size={14} />
            {t('settings.submitIssue')}
          </a>
        </div>
      </SettingGroup>
    </div>
  );
}
