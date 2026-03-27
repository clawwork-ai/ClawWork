import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PopoverListBase, { PopoverListItem } from './PopoverListBase';

export interface ArgOption {
  value: string;
  label: string;
  detail?: string;
}

interface SlashArgPickerProps {
  commandName: string;
  options: ArgOption[];
  selectedIndex: number;
  onSelect: (option: ArgOption) => void;
  onHoverIndex: (index: number) => void;
  onClose: () => void;
}

export default function SlashArgPicker({
  commandName,
  options,
  selectedIndex,
  onSelect,
  onHoverIndex,
  onClose,
}: SlashArgPickerProps) {
  const { t } = useTranslation();
  const selectedItemRef = useRef<HTMLLIElement>(null);

  return (
    <PopoverListBase
      open={options.length > 0}
      onClose={onClose}
      selectedIndex={selectedIndex}
      selectedItemRef={selectedItemRef}
      ariaLabel={t('slash.argOptions', { command: commandName })}
      header={
        <div className="type-support border-b border-[var(--border-subtle)] px-4 py-1.5 text-[var(--text-muted)]">
          <span className="type-mono-data text-[var(--accent)]">/{commandName}</span>
        </div>
      }
    >
      {options.map((opt, index) => (
        <PopoverListItem
          key={opt.value}
          selected={index === selectedIndex}
          itemRef={index === selectedIndex ? selectedItemRef : undefined}
          onHover={() => onHoverIndex(index)}
          onSelect={() => onSelect(opt)}
        >
          <span className="type-mono-data shrink-0">{opt.label}</span>
          {opt.detail && <span className="type-support ml-auto truncate text-[var(--text-muted)]">{opt.detail}</span>}
        </PopoverListItem>
      ))}
    </PopoverListBase>
  );
}
