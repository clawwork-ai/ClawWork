import { useState, useEffect, useCallback } from 'react';
import { Star, Bug, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import SettingRow from '../components/SettingRow';

const linkClass = cn(
  'flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors',
  'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)]',
  'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.98]',
);

interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
}

export default function AboutSection() {
  const { t } = useTranslation();
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    window.clawwork
      .checkForUpdates()
      .then(setUpdateInfo)
      .catch(() => {});
  }, []);

  const handleCheckForUpdates = useCallback(async () => {
    setCheckingUpdate(true);
    try {
      const result = await window.clawwork.checkForUpdates();
      setUpdateInfo(result);
      if (!result.hasUpdate) {
        toast.success(t('settings.alreadyLatest'));
      }
    } catch {
      toast.error(t('settings.updateCheckFailed'));
    } finally {
      setCheckingUpdate(false);
    }
  }, [t]);

  return (
    <div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('settings.about')}</h3>
      <p className="text-sm text-[var(--text-muted)] mt-1 mb-4">{t('settings.aboutDesc')}</p>
      <div className="rounded-xl bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
        <div className="px-5 py-4">
          <SettingRow label={t('settings.version')}>
            <span className="text-sm text-[var(--text-primary)] font-mono">
              v{updateInfo?.currentVersion ?? '0.0.3'}
            </span>
          </SettingRow>
        </div>

        {updateInfo?.hasUpdate && (
          <div className="px-5 py-4">
            <div className={cn('rounded-lg px-4 py-3', 'bg-[var(--accent-soft)] border border-[var(--accent)]/30')}>
              <p className="text-sm text-[var(--accent)] font-medium mb-1">
                {t('settings.newVersionAvailable', { version: updateInfo.latestVersion })}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {t('settings.homebrewUpgrade')}{' '}
                <code className="font-mono bg-[var(--bg-tertiary)] px-1 py-0.5 rounded text-[var(--text-primary)]">
                  brew upgrade --cask clawwork
                </code>
              </p>
            </div>
          </div>
        )}

        <div className="px-5 py-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckForUpdates}
            disabled={checkingUpdate}
            className="titlebar-no-drag gap-1.5 w-full justify-center"
          >
            {checkingUpdate ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {t('settings.checkForUpdates')}
          </Button>
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
      </div>
    </div>
  );
}
