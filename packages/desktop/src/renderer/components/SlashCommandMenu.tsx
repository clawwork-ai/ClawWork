import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { SlashCommand } from '@/lib/slash-commands';
import PopoverListBase, { PopoverListItem } from './PopoverListBase';

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  onHoverIndex: (index: number) => void;
  onClose: () => void;
  className?: string;
}

export default function SlashCommandMenu({
  commands,
  selectedIndex,
  onSelect,
  onHoverIndex,
  onClose,
  className,
}: SlashCommandMenuProps) {
  const { t } = useTranslation();
  const selectedItemRef = useRef<HTMLLIElement>(null);

  return (
    <PopoverListBase
      open={commands.length > 0}
      onClose={onClose}
      selectedIndex={selectedIndex}
      selectedItemRef={selectedItemRef}
      ariaLabel={t('chatInput.slashCommands')}
      className={className}
    >
      {commands.map((cmd, index) => (
        <PopoverListItem
          key={cmd.name}
          selected={index === selectedIndex}
          itemRef={index === selectedIndex ? selectedItemRef : undefined}
          onHover={() => onHoverIndex(index)}
          onSelect={() => onSelect(cmd)}
        >
          <span className="type-mono-data shrink-0 text-[var(--accent)]">/{cmd.name}</span>
          <span className="type-support truncate">{cmd.description}</span>
          {cmd.argHint && (
            <span className="type-mono-data ml-auto shrink-0 text-[var(--text-muted)]">{cmd.argHint}</span>
          )}
        </PopoverListItem>
      ))}
    </PopoverListBase>
  );
}
