import { useState, useEffect, useCallback } from 'react';
import { MonitorDot, Zap, FolderOpen, Loader2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Toggle from '../components/Toggle';
import SettingRow from '@/components/semantic/SettingRow';
import SettingGroup from '@/components/semantic/SettingGroup';
import { useSettingsStore } from '@/stores/settingsStore';

export default function SystemSection() {
  const { t } = useTranslation();
  const [trayEnabled, setTrayEnabled] = useState(true);
  const [quickLaunchEnabled, setQuickLaunchEnabled] = useState(false);
  const [quickLaunchShortcut, setQuickLaunchShortcut] = useState('Alt+Space');
  const [recordingShortcut, setRecordingShortcut] = useState(false);
  const [changingWorkspace, setChangingWorkspace] = useState(false);
  const workspacePath = useSettingsStore((s) => s.settings?.workspacePath);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.load);
  const refreshSettings = useSettingsStore((s) => s.refresh);

  useEffect(() => {
    window.clawwork
      .getQuickLaunchConfig()
      .then((config) => {
        setQuickLaunchEnabled(config.enabled);
        setQuickLaunchShortcut(config.shortcut);
      })
      .catch((err) => console.error('[SystemSection] getQuickLaunchConfig failed:', err));
    window.clawwork
      .getTrayEnabled()
      .then(setTrayEnabled)
      .catch((err) => console.error('[SystemSection] getTrayEnabled failed:', err));
  }, [t]);

  useEffect(() => {
    if (settingsLoaded) return;
    void loadSettings().catch((err: unknown) => {
      console.error('[SystemSection] loadSettings failed:', err);
    });
  }, [settingsLoaded, loadSettings]);

  const handleTrayToggle = useCallback(
    async (enabled: boolean) => {
      await window.clawwork.setTrayEnabled(enabled);
      setTrayEnabled(enabled);
      toast.success(enabled ? t('settings.trayEnabled') : t('settings.trayDisabled'));
    },
    [t],
  );

  const handleQuickLaunchToggle = useCallback(
    async (enabled: boolean) => {
      const success = await window.clawwork.updateQuickLaunchConfig(enabled, quickLaunchShortcut);
      if (success) {
        setQuickLaunchEnabled(enabled);
        toast.success(enabled ? t('settings.quickLaunchEnabled') : t('settings.quickLaunchDisabled'));
      } else {
        toast.error(t('settings.quickLaunchShortcutConflict'));
      }
    },
    [quickLaunchShortcut, t],
  );

  const handleChangeWorkspace = useCallback(async () => {
    let selected: string | null = null;
    try {
      selected = await window.clawwork.browseWorkspace();
    } catch (err) {
      console.error('[SystemSection] browseWorkspace failed:', err);
      toast.error(t('errors.failed'));
      return;
    }
    if (!selected || selected === workspacePath) return;
    const oldPath = workspacePath;
    setChangingWorkspace(true);
    try {
      const result = await window.clawwork.changeWorkspace(selected);
      if (result.ok) {
        await refreshSettings().catch(() => {});
        toast.success(t('settings.workspaceChanged'), {
          description: t('settings.workspaceOldPathHint', { path: oldPath }),
          duration: 8000,
        });
      } else {
        toast.error(t('settings.workspaceChangeFailed', { error: result.error }));
      }
    } catch (err) {
      console.error('[SystemSection] changeWorkspace failed:', err);
      toast.error(t('settings.workspaceChangeFailed', { error: String(err) }));
    } finally {
      setChangingWorkspace(false);
    }
  }, [refreshSettings, workspacePath, t]);

  const handleShortcutRecord = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setRecordingShortcut(false);
        return;
      }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push('CommandOrControl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (parts.length === 0) return;

      const key = e.code.startsWith('Key')
        ? e.code.slice(3)
        : e.code.startsWith('Digit')
          ? e.code.slice(5)
          : e.key === ' '
            ? 'Space'
            : e.key.length === 1
              ? e.key.toUpperCase()
              : e.key;

      parts.push(key);
      const shortcut = parts.join('+');
      setRecordingShortcut(false);

      window.clawwork
        .updateQuickLaunchConfig(quickLaunchEnabled, shortcut)
        .then((ok) => {
          if (ok) {
            setQuickLaunchShortcut(shortcut);
            toast.success(t('settings.shortcutUpdated'));
          } else {
            toast.error(t('settings.quickLaunchShortcutConflict'));
          }
        })
        .catch(() => toast.error(t('settings.quickLaunchUpdateFailed')));
    },
    [quickLaunchEnabled, t],
  );

  return (
    <div>
      <h3 className="type-section-title mb-4 text-[var(--text-primary)]">{t('settings.system')}</h3>
      <SettingGroup>
        <SettingRow
          label={
            <div className="flex items-center gap-3">
              <MonitorDot size={14} className="text-[var(--text-muted)] flex-shrink-0" />
              <div>
                <span className="type-label text-[var(--text-primary)]">{t('settings.trayIcon')}</span>
                <p className="type-support mt-0.5 text-[var(--text-muted)]">{t('settings.trayIconDesc')}</p>
              </div>
            </div>
          }
        >
          <Toggle checked={trayEnabled} onChange={handleTrayToggle} ariaLabel={t('settings.trayIcon')} />
        </SettingRow>
        <SettingRow
          label={
            <div className="flex items-center gap-3">
              <Zap size={14} className="text-[var(--text-muted)] flex-shrink-0" />
              <div>
                <span className="type-label text-[var(--text-primary)]">{t('settings.quickLaunch')}</span>
                <p className="type-support mt-0.5 text-[var(--text-muted)]">{t('settings.quickLaunchDesc')}</p>
              </div>
            </div>
          }
        >
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {quickLaunchEnabled &&
              (recordingShortcut ? (
                <input
                  autoFocus
                  readOnly
                  placeholder={t('settings.pressShortcut')}
                  onKeyDown={handleShortcutRecord}
                  onBlur={() => setRecordingShortcut(false)}
                  className={cn(
                    'type-mono-data w-36 text-center px-2.5 py-1 rounded-md',
                    'bg-[var(--accent-soft)] border border-[var(--accent)]/40',
                    'text-[var(--accent)] outline-none animate-pulse',
                    'glow-focus',
                  )}
                />
              ) : (
                <button
                  type="button"
                  aria-label={t('settings.quickLaunchShortcut')}
                  onClick={() => setRecordingShortcut(true)}
                  className={cn(
                    'glow-focus type-mono-data px-2.5 py-1 rounded-md',
                    'bg-[var(--bg-tertiary)] border border-[var(--border)]',
                    'text-[var(--text-primary)] hover:border-[var(--accent)]/40 transition-colors',
                    'cursor-pointer',
                  )}
                >
                  {quickLaunchShortcut}
                </button>
              ))}
            <Toggle
              checked={quickLaunchEnabled}
              onChange={handleQuickLaunchToggle}
              ariaLabel={t('settings.quickLaunch')}
            />
          </div>
        </SettingRow>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <FolderOpen size={14} className="text-[var(--text-muted)] flex-shrink-0" />
            <div>
              <span className="type-label text-[var(--text-primary)]">{t('settings.workspace')}</span>
              <p className="type-support mt-0.5 text-[var(--text-muted)]">{t('settings.workspaceHint')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex-1 min-w-0 px-3 py-2 rounded-md',
                'bg-[var(--bg-tertiary)] border border-[var(--border)]',
                'type-mono-data text-[var(--text-primary)] break-all',
              )}
            >
              {workspacePath || t('common.notConfigured')}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.clawwork.openWorkspaceFolder()}
              className="titlebar-no-drag h-9 w-9 flex-shrink-0"
              title={t('settings.workspaceOpenFolder')}
              aria-label={t('settings.workspaceOpenFolder')}
            >
              <ExternalLink size={14} />
            </Button>
            <Button
              variant="outline"
              onClick={handleChangeWorkspace}
              disabled={changingWorkspace}
              className="titlebar-no-drag h-9 gap-1.5 flex-shrink-0"
            >
              {changingWorkspace ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={14} />}
              {t('settings.workspaceChange')}
            </Button>
          </div>
        </div>
      </SettingGroup>
    </div>
  );
}
