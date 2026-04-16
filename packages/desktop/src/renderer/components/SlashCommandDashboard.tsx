import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  CATEGORY_I18N_KEYS,
  filterSlashCommands,
  getCommandsForGateway,
  groupCommandsByCategory,
  type SlashCommandView,
} from '@/lib/slash-commands';
import { useTaskStore } from '../stores/taskStore';
import { useUiStore } from '../stores/uiStore';
import CommandSourceBadge from './CommandSourceBadge';

interface SlashCommandDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCommand?: (cmd: SlashCommandView) => void;
}

export default function SlashCommandDashboard({ open, onOpenChange, onSelectCommand }: SlashCommandDashboardProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const activeGatewayId = useTaskStore((s) => {
    const id = s.activeTaskId;
    const task = id ? s.tasks.find((t) => t.id === id) : undefined;
    return task?.gatewayId ?? s.pendingNewTask?.gatewayId ?? null;
  });
  const commandCatalog = useUiStore((s) => (activeGatewayId ? s.commandCatalogByGateway[activeGatewayId] : undefined));
  const allCommands = useMemo(() => getCommandsForGateway(commandCatalog), [commandCatalog]);
  const filtered = useMemo(() => filterSlashCommands(query.trim(), allCommands), [query, allCommands]);
  const groups = useMemo(() => groupCommandsByCategory(filtered), [filtered]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery('');
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('slashDashboard.title')}</DialogTitle>
          <DialogDescription>{t('slashDashboard.description')}</DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('slashDashboard.searchPlaceholder')}
            className="type-support w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-input)] py-2 pr-3 pl-9 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="mt-4 h-96 overflow-y-auto pr-1">
          {groups.length === 0 ? (
            <p className="type-support flex h-full items-center justify-center text-[var(--text-muted)]">
              {t('slashDashboard.empty')}
            </p>
          ) : null}
          <div className="space-y-5">
            {groups.map(({ category, commands }) => (
              <div key={category}>
                <h3 className="type-meta mb-2 text-[var(--text-muted)]">{t(CATEGORY_I18N_KEYS[category])}</h3>
                <div className="space-y-0.5">
                  {commands.map((cmd) => (
                    <button
                      key={cmd.name}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--bg-hover)]"
                      onClick={() => {
                        onSelectCommand?.(cmd);
                        onOpenChange(false);
                      }}
                    >
                      <span className="type-mono-data shrink-0 text-[var(--accent)]">/{cmd.name}</span>
                      <CommandSourceBadge source={cmd.source} />
                      <span className="type-support flex-1 truncate text-[var(--text-secondary)]">
                        {cmd.description}
                      </span>
                      {cmd.argHint && (
                        <span className="type-mono-data shrink-0 text-[var(--text-muted)]">{cmd.argHint}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
