import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Monitor, Bell, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { modKey } from '@/lib/utils';
import {
  useUiStore,
  type Theme,
  type DensityMode,
  type Language,
  type SendShortcut,
  type PanelShortcutLeft,
  type PanelShortcutRight,
} from '@/stores/uiStore';
import { SUPPORTED_LANGUAGES } from '@/i18n/languages';
import SettingRow from '@/components/semantic/SettingRow';
import SegmentedControl from '../components/SegmentedControl';
import Toggle from '../components/Toggle';
import SettingGroup from '@/components/semantic/SettingGroup';
import PairMobileDialog from '../components/PairMobileDialog';

export default function GeneralSection() {
  const { t } = useTranslation();
  const [showPairDialog, setShowPairDialog] = useState(false);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const sendShortcut = useUiStore((s) => s.sendShortcut);
  const setSendShortcut = useUiStore((s) => s.setSendShortcut);
  const leftNavShortcut = useUiStore((s) => s.leftNavShortcut);
  const setLeftNavShortcut = useUiStore((s) => s.setLeftNavShortcut);
  const rightPanelShortcut = useUiStore((s) => s.rightPanelShortcut);
  const setRightPanelShortcut = useUiStore((s) => s.setRightPanelShortcut);

  const handleThemeToggle = useCallback(
    (next: Theme) => {
      setTheme(next);
      toast.success(t('settings.themeUpdated'));
    },
    [setTheme, t],
  );

  const handleDensityChange = useCallback(
    (next: DensityMode) => {
      setDensity(next);
      toast.success(t('settings.densityUpdated'));
    },
    [setDensity, t],
  );

  const handleShortcutChange = useCallback(
    (next: SendShortcut) => {
      if (next === sendShortcut) return;
      setSendShortcut(next);
      toast.success(t('settings.shortcutUpdated'));
    },
    [sendShortcut, setSendShortcut, t],
  );

  const handleLeftNavShortcutChange = useCallback(
    (next: PanelShortcutLeft) => {
      if (next === leftNavShortcut) return;
      setLeftNavShortcut(next);
      toast.success(t('settings.shortcutUpdated'));
    },
    [leftNavShortcut, setLeftNavShortcut, t],
  );

  const handleRightPanelShortcutChange = useCallback(
    (next: PanelShortcutRight) => {
      if (next === rightPanelShortcut) return;
      setRightPanelShortcut(next);
      toast.success(t('settings.shortcutUpdated'));
    },
    [rightPanelShortcut, setRightPanelShortcut, t],
  );

  const [notifyState, setNotifyState] = useState({
    taskComplete: true,
    approvalRequest: true,
    gatewayDisconnect: true,
  });

  useEffect(() => {
    window.clawwork.getSettings().then((settings) => {
      if (!settings?.notifications) return;
      const n = settings.notifications;
      setNotifyState((prev) => ({
        taskComplete: n.taskComplete ?? prev.taskComplete,
        approvalRequest: n.approvalRequest ?? prev.approvalRequest,
        gatewayDisconnect: n.gatewayDisconnect ?? prev.gatewayDisconnect,
      }));
    });
  }, []);

  const handleNotificationToggle = useCallback(
    (key: 'taskComplete' | 'approvalRequest' | 'gatewayDisconnect', value: boolean) => {
      setNotifyState((prev) => {
        const next = { ...prev, [key]: value };
        window.clawwork.updateSettings({ notifications: next });
        return next;
      });
    },
    [],
  );

  const notificationToggles = [
    { key: 'taskComplete' as const, i18nKey: 'settings.notifyTaskComplete' },
    { key: 'approvalRequest' as const, i18nKey: 'settings.notifyApproval' },
    { key: 'gatewayDisconnect' as const, i18nKey: 'settings.notifyDisconnect' },
  ];

  return (
    <div>
      <h3 className="type-section-title text-[var(--text-primary)]">{t('settings.general')}</h3>
      <p className="type-support mt-1 mb-4 text-[var(--text-muted)]">{t('settings.generalDesc')}</p>
      <SettingGroup>
        <SettingRow label={t('settings.theme')}>
          <SegmentedControl
            layoutId="seg-theme"
            value={theme}
            onChange={handleThemeToggle}
            ariaLabel={t('settings.theme')}
            options={[
              {
                value: 'auto' as const,
                label: (
                  <>
                    <Monitor size={14} /> {t('settings.themeAuto')}
                  </>
                ),
              },
              {
                value: 'dark' as const,
                label: (
                  <>
                    <Moon size={14} /> {t('common.dark')}
                  </>
                ),
              },
              {
                value: 'light' as const,
                label: (
                  <>
                    <Sun size={14} /> {t('common.light')}
                  </>
                ),
              },
            ]}
          />
        </SettingRow>
        <SettingRow label={t('settings.density')}>
          <SegmentedControl
            layoutId="seg-density"
            value={density}
            onChange={handleDensityChange}
            ariaLabel={t('settings.density')}
            options={[
              { value: 'compact' as const, label: t('settings.densityCompact') },
              { value: 'comfortable' as const, label: t('settings.densityComfortable') },
              { value: 'spacious' as const, label: t('settings.densitySpacious') },
            ]}
          />
        </SettingRow>
        <SettingRow label={t('settings.language')}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            aria-label={t('settings.language')}
            className="type-body rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-[var(--text-primary)]"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label={t('settings.sendShortcut')}>
          <SegmentedControl
            layoutId="seg-send"
            value={sendShortcut}
            onChange={handleShortcutChange}
            ariaLabel={t('settings.sendShortcut')}
            options={[
              { value: 'enter' as const, label: t('settings.sendEnter') },
              { value: 'cmdEnter' as const, label: t('settings.sendCmdEnter', { mod: modKey }) },
            ]}
          />
        </SettingRow>
        <SettingRow label={t('settings.leftNavShortcut')}>
          <SegmentedControl
            layoutId="seg-left-nav"
            value={leftNavShortcut}
            onChange={handleLeftNavShortcutChange}
            ariaLabel={t('settings.leftNavShortcut')}
            options={[
              { value: 'Comma' as const, label: `${modKey} ,` },
              { value: 'BracketLeft' as const, label: `${modKey} [` },
            ]}
          />
        </SettingRow>
        <SettingRow label={t('settings.rightPanelShortcut')}>
          <SegmentedControl
            layoutId="seg-right-panel"
            value={rightPanelShortcut}
            onChange={handleRightPanelShortcutChange}
            ariaLabel={t('settings.rightPanelShortcut')}
            options={[
              { value: 'Period' as const, label: `${modKey} .` },
              { value: 'BracketRight' as const, label: `${modKey} ]` },
            ]}
          />
        </SettingRow>
      </SettingGroup>

      <h3 className="type-section-title mt-8 text-[var(--text-primary)]">{t('settings.notifications')}</h3>
      <p className="type-support mt-1 mb-4 text-[var(--text-muted)]">{t('settings.notificationsDesc')}</p>
      <SettingGroup>
        {notificationToggles.map(({ key, i18nKey }) => (
          <SettingRow
            key={key}
            label={
              <div className="flex items-center gap-3">
                <Bell size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="type-label text-[var(--text-primary)]">{t(i18nKey)}</span>
              </div>
            }
          >
            <Toggle
              checked={notifyState[key]}
              onChange={(v) => handleNotificationToggle(key, v)}
              ariaLabel={t(i18nKey)}
            />
          </SettingRow>
        ))}
      </SettingGroup>

      <h3 className="type-section-title mt-8 text-[var(--text-primary)]">{t('settings.mobile')}</h3>
      <p className="type-support mt-1 mb-4 text-[var(--text-muted)]">{t('settings.mobileDesc')}</p>
      <SettingGroup>
        <SettingRow
          label={
            <div className="flex items-center gap-3">
              <Smartphone size={14} className="flex-shrink-0 text-[var(--text-muted)]" />
              <span className="type-label text-[var(--text-primary)]">{t('settings.pairMobile')}</span>
            </div>
          }
        >
          <button
            onClick={() => setShowPairDialog(true)}
            className="type-label rounded-lg border border-[var(--border)] px-3 py-1.5 text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
          >
            {t('settings.pairMobileButton')}
          </button>
        </SettingRow>
      </SettingGroup>

      <PairMobileDialog open={showPairDialog} onOpenChange={setShowPairDialog} />
    </div>
  );
}
