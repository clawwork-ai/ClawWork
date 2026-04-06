import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { TeamInfo } from './types';
import { inputClass } from './utils';

const EMOJI_OPTIONS = [
  '🤖',
  '🧪',
  '🎯',
  '🚀',
  '💡',
  '🔧',
  '📊',
  '🎨',
  '🛡️',
  '📦',
  '🌐',
  '⚡',
  '🔬',
  '📝',
  '🎲',
  '🧩',
  '🏗️',
  '💻',
  '🔍',
  '🤝',
  '📡',
  '🧠',
  '🌟',
  '🎵',
];

interface TeamInfoStepProps {
  info: TeamInfo;
  onChange: (info: TeamInfo) => void;
  gateways: Array<[string, { name: string }]>;
  nameLocked?: boolean;
  gatewayLocked?: boolean;
}

export default function TeamInfoStep({ info, onChange, gateways, nameLocked, gatewayLocked }: TeamInfoStepProps) {
  const { t } = useTranslation();
  const [emojiOpen, setEmojiOpen] = useState(false);

  const update = (patch: Partial<TeamInfo>) => onChange({ ...info, ...patch });

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <button className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)] cursor-pointer focus-visible:outline-none glow-focus">
              <span className="emoji-lg">{info.emoji}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    update({ emoji: e });
                    setEmojiOpen(false);
                  }}
                  className="emoji-md flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-hover)] cursor-pointer"
                >
                  {e}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1 space-y-1">
          <label className="type-label text-[var(--text-secondary)]">{t('teams.teamName')}</label>
          <input
            type="text"
            value={info.name}
            onChange={(e) => update({ name: e.target.value.slice(0, 50) })}
            placeholder={t('teams.namePlaceholder')}
            maxLength={50}
            autoFocus={!nameLocked}
            disabled={nameLocked}
            className={cn(inputClass, nameLocked && 'opacity-60 cursor-not-allowed')}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="type-label text-[var(--text-secondary)]">
          TEAM.md
          <span className="ml-1.5 type-meta text-[var(--text-muted)] font-normal">{t('teams.description')}</span>
        </label>
        <textarea
          value={info.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder={t('teams.wizard.teamMdPlaceholder')}
          rows={6}
          className="type-mono-data w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] glow-focus focus:border-transparent transition-all resize-none"
        />
      </div>

      {gateways.length > 1 && (
        <div className="space-y-1">
          <label className="type-label text-[var(--text-secondary)]">{t('teams.gateway')}</label>
          <select
            value={info.gatewayId}
            onChange={(e) => update({ gatewayId: e.target.value })}
            disabled={gatewayLocked}
            className={cn(inputClass, gatewayLocked && 'opacity-60 cursor-not-allowed')}
          >
            {gateways.map(([id, gw]) => (
              <option key={id} value={id}>
                {gw.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
