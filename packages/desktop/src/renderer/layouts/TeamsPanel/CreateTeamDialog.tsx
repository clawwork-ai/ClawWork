import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

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

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; emoji: string; description: string }) => void;
}

export default function CreateTeamDialog({ open, onOpenChange, onCreate }: CreateTeamDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🤖');
  const [description, setDescription] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setEmoji('🤖');
    setDescription('');
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), emoji, description: description.trim() });
    resetForm();
    onOpenChange(false);
  }, [name, emoji, description, onCreate, resetForm, onOpenChange]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetForm();
      onOpenChange(next);
    },
    [onOpenChange, resetForm],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('teams.createTeam')}</DialogTitle>
          <DialogDescription>{t('teams.emptyDesc')}</DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-5">
          <div className="flex items-start gap-4">
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <button className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)] cursor-pointer focus-visible:outline-none glow-focus">
                  <span className="emoji-lg">{emoji}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setEmoji(e);
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
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 50))}
                placeholder={t('teams.namePlaceholder')}
                maxLength={50}
                autoFocus
                className="w-full h-[var(--density-control-height)] px-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] glow-focus focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="type-label text-[var(--text-secondary)]">{t('teams.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder={t('teams.descPlaceholder')}
              maxLength={200}
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] glow-focus focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            {t('teams.createTeam')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
