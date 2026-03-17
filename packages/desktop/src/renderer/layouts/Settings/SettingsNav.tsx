import { motion } from 'framer-motion';
import { Settings2, MonitorDot, Server, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type SettingsSection = 'general' | 'system' | 'gateways' | 'about';

const NAV_ITEMS: { key: SettingsSection; icon: typeof Settings2; labelKey: string }[] = [
  { key: 'general', icon: Settings2, labelKey: 'settings.general' },
  { key: 'system', icon: MonitorDot, labelKey: 'settings.system' },
  { key: 'gateways', icon: Server, labelKey: 'settings.gateways' },
  { key: 'about', icon: Info, labelKey: 'settings.about' },
];

export default function SettingsNav({
  active,
  onChange,
}: {
  active: SettingsSection;
  onChange: (section: SettingsSection) => void;
}) {
  const { t } = useTranslation();

  return (
    <nav className="w-[180px] flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] py-4 px-3 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-2.5 w-full h-9 px-3 rounded-lg text-sm transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-accent)]',
              isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="settings-nav-active"
                className="absolute inset-0 rounded-lg bg-[var(--bg-elevated)] shadow-sm border border-[var(--border-subtle)]"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <Icon size={16} className="relative z-10 flex-shrink-0" />
            <span className="relative z-10">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
