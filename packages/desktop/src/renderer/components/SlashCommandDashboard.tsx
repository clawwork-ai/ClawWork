import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { groupCommandsByCategory, CATEGORY_I18N_KEYS, type SlashCommand } from '@/lib/slash-commands';

interface SlashCommandDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCommand?: (cmd: SlashCommand) => void;
}

const groups = groupCommandsByCategory();

export default function SlashCommandDashboard({ open, onOpenChange, onSelectCommand }: SlashCommandDashboardProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('slashDashboard.title')}</DialogTitle>
          <DialogDescription>{t('slashDashboard.description')}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {groups.map(({ category, commands }) => (
            <div key={category}>
              <h3 className="type-meta mb-2 text-[var(--text-muted)]">{t(CATEGORY_I18N_KEYS[category])}</h3>
              <div className="space-y-0.5">
                {commands.map((cmd) => (
                  <button
                    key={cmd.name}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors"
                    onClick={() => {
                      onSelectCommand?.(cmd);
                      onOpenChange(false);
                    }}
                  >
                    <span className="type-mono-data shrink-0 text-[var(--accent)]">/{cmd.name}</span>
                    <span className="type-support flex-1 truncate text-[var(--text-secondary)]">{cmd.description}</span>
                    {cmd.argHint && (
                      <span className="type-mono-data shrink-0 text-[var(--text-muted)]">{cmd.argHint}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
