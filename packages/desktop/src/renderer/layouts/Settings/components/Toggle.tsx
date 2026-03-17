import { cn } from '@/lib/utils';

export default function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-accent)]',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)] border border-[var(--border)]',
      )}
    >
      <span
        className="pointer-events-none absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]"
        style={{
          transform: `translateX(${checked ? 20 : 0}px)`,
          transition: 'transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />
    </button>
  );
}
