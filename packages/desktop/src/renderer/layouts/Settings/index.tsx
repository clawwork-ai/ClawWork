import { useState, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import SettingsNav, { type SettingsSection } from './SettingsNav';
import GeneralSection from './sections/GeneralSection';
import SystemSection from './sections/SystemSection';
import GatewaysSection from './sections/GatewaysSection';
import AboutSection from './sections/AboutSection';

const SECTION_COMPONENTS: Record<SettingsSection, ComponentType> = {
  general: GeneralSection,
  system: SystemSection,
  gateways: GatewaysSection,
  about: AboutSection,
};

export default function Settings({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const SectionComponent = SECTION_COMPONENTS[activeSection];

  return (
    <motion.div {...motionPresets.fadeIn} className="flex flex-col h-full">
      <header className="titlebar-drag flex items-center justify-between h-12 px-4 border-b border-[var(--border)] flex-shrink-0 relative z-[51]">
        <h2 className="font-medium text-[var(--text-primary)]">{t('common.settings')}</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="titlebar-no-drag"
          aria-label={t('common.close')}
        >
          <X size={16} />
        </Button>
      </header>

      <div className="flex flex-1 min-h-0">
        <SettingsNav active={activeSection} onChange={setActiveSection} />

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <SectionComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
