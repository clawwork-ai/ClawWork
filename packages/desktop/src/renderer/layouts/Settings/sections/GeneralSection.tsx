import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Monitor, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { modKey } from '@/lib/utils';
import {
  useUiStore,
  type Theme,
  type Language,
  type SendShortcut,
  type PanelShortcutLeft,
  type PanelShortcutRight,
} from '@/stores/uiStore';
import SettingRow from '../components/SettingRow';
import SegmentedControl from '../components/SegmentedControl';
import Toggle from '../components/Toggle';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
];

export default function GeneralSection() {
  const { t } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
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

  const [notifyTaskComplete, setNotifyTaskComplete] = useState(true);
  const [notifyApproval, setNotifyApproval] = useState(true);
  const [notifyDisconnect, setNotifyDisconnect] = useState(true);

  useEffect(() => {
    window.clawwork.getSettings().then((settings) => {
      if (!settings) return;
      const n = settings.notifications;
      if (n?.taskComplete === false) setNotifyTaskComplete(false);
      if (n?.approvalRequest === false) setNotifyApproval(false);
      if (n?.gatewayDisconnect === false) setNotifyDisconnect(false);
    });
  }, []);

  const handleNotificationToggle = useCallback(
    async (key: 'taskComplete' | 'approvalRequest' | 'gatewayDisconnect', value: boolean) => {
      const settings = await window.clawwork.getSettings();
      await window.clawwork.updateSettings({
        notifications: { ...settings?.notifications, [key]: value },
      });
    },
    [],
  );

  return (
    <div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('settings.general')}</h3>
      <p className="text-sm text-[var(--text-muted)] mt-1 mb-4">{t('settings.generalDesc')}</p>
      <div className="rounded-xl bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
        <div className="px-5 py-4">
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
                      <Moon size={14} /> Dark
                    </>
                  ),
                },
                {
                  value: 'light' as const,
                  label: (
                    <>
                      <Sun size={14} /> Light
                    </>
                  ),
                },
              ]}
            />
          </SettingRow>
        </div>
        <div className="px-5 py-4">
          <SettingRow label="Language">
            <SegmentedControl
              layoutId="seg-lang"
              value={language}
              onChange={setLanguage}
              options={LANGUAGES}
              ariaLabel="Language"
            />
          </SettingRow>
        </div>
        <div className="px-5 py-4">
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
        </div>
        <div className="px-5 py-4">
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
        </div>
        <div className="px-5 py-4">
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
        </div>
      </div>

      <h3 className="text-base font-semibold text-[var(--text-primary)] mt-8">{t('settings.notifications')}</h3>
      <p className="text-sm text-[var(--text-muted)] mt-1 mb-4">{t('settings.notificationsDesc')}</p>
      <div className="rounded-xl bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
        <div className="px-5 py-4">
          <SettingRow
            label={
              <div className="flex items-center gap-3">
                <Bell size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="text-sm text-[var(--text-primary)]">{t('settings.notifyTaskComplete')}</span>
              </div>
            }
          >
            <Toggle
              checked={notifyTaskComplete}
              onChange={(v) => {
                setNotifyTaskComplete(v);
                handleNotificationToggle('taskComplete', v);
              }}
              ariaLabel={t('settings.notifyTaskComplete')}
            />
          </SettingRow>
        </div>
        <div className="px-5 py-4">
          <SettingRow
            label={
              <div className="flex items-center gap-3">
                <Bell size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="text-sm text-[var(--text-primary)]">{t('settings.notifyApproval')}</span>
              </div>
            }
          >
            <Toggle
              checked={notifyApproval}
              onChange={(v) => {
                setNotifyApproval(v);
                handleNotificationToggle('approvalRequest', v);
              }}
              ariaLabel={t('settings.notifyApproval')}
            />
          </SettingRow>
        </div>
        <div className="px-5 py-4">
          <SettingRow
            label={
              <div className="flex items-center gap-3">
                <Bell size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="text-sm text-[var(--text-primary)]">{t('settings.notifyDisconnect')}</span>
              </div>
            }
          >
            <Toggle
              checked={notifyDisconnect}
              onChange={(v) => {
                setNotifyDisconnect(v);
                handleNotificationToggle('gatewayDisconnect', v);
              }}
              ariaLabel={t('settings.notifyDisconnect')}
            />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
