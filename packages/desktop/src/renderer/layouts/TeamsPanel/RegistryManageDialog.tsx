import { useState, useCallback } from 'react';
import { RefreshCw, Trash2, Plus, Globe, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TeamHubRegistry } from '@clawwork/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RegistryManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registries: TeamHubRegistry[];
  onRefreshRegistry: (id: string) => Promise<void>;
  onAddRegistry: (url: string) => Promise<void>;
  onRemoveRegistry: (id: string) => Promise<void>;
}

export default function RegistryManageDialog({
  open,
  onOpenChange,
  registries,
  onRefreshRegistry,
  onAddRegistry,
  onRemoveRegistry,
}: RegistryManageDialogProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());

  const handleAdd = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setAddError('');
    setAdding(true);
    try {
      await onAddRegistry(trimmed);
      setUrl('');
    } catch (e) {
      setAddError(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  }, [url, onAddRegistry]);

  const handleRefresh = useCallback(
    async (id: string) => {
      setRefreshingIds((prev) => new Set(prev).add(id));
      try {
        await onRefreshRegistry(id);
      } finally {
        setRefreshingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [onRefreshRegistry],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      await onRemoveRegistry(id);
    },
    [onRemoveRegistry],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setUrl('');
          setAddError('');
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('teamshub.manageRegistries')}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-3">
          {registries.map((reg) => (
            <div
              key={reg.id}
              className={cn(
                'surface-card flex items-center gap-3 rounded-lg px-4 py-3',
                'border border-[var(--border)]',
              )}
            >
              <Globe size={16} className="flex-shrink-0 text-[var(--text-muted)]" />
              <span className="type-body min-w-0 flex-1 truncate text-[var(--text-primary)]">
                {reg.name || reg.url}
              </span>
              <span className="type-support flex-shrink-0 text-[var(--text-muted)]">
                {reg.fetchedAt ? t('teamshub.teamCount', { count: reg.teams?.length ?? 0 }) : t('teamshub.notFetched')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRefresh(reg.id)}
                  disabled={refreshingIds.has(reg.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] disabled:opacity-40"
                >
                  <RefreshCw size={14} className={refreshingIds.has(reg.id) ? 'animate-spin' : ''} />
                </button>
                {!reg.isOfficial && (
                  <button
                    onClick={() => handleRemove(reg.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--danger)]"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 pt-3">
          <div className="flex items-center gap-2">
            <input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (addError) setAddError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder={t('teamshub.addRegistryPlaceholder')}
              className={cn(
                'flex-1 rounded-md border bg-[var(--bg-tertiary)]',
                'type-body px-3 py-1.5 text-[var(--text-primary)]',
                'placeholder:text-[var(--text-muted)]',
                'focus:outline-none focus:ring-1',
                addError
                  ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
                  : 'border-[var(--border)] focus:ring-[var(--accent)]',
              )}
            />
            <Button size="sm" onClick={handleAdd} disabled={adding || !url.trim()}>
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {t('teamshub.addRegistry')}
            </Button>
          </div>
          {addError ? (
            <span className="type-support text-[var(--danger)]">{addError}</span>
          ) : (
            <span className="type-support text-[var(--text-muted)]">{t('teamshub.addRegistryHint')}</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
