import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Artifact } from '@clawwork/shared';

export default function RightPanel() {
  const { t } = useTranslation();
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const setHighlightedMessage = useMessageStore((s) => s.setHighlightedMessage);

  const [taskArtifacts, setTaskArtifacts] = useState<Artifact[]>([]);

  useEffect(() => {
    if (!activeTaskId) {
      setTaskArtifacts([]);
      return;
    }
    window.clawwork.listArtifacts(activeTaskId).then((res) => {
      if (res.ok && res.result) {
        setTaskArtifacts(res.result as unknown as Artifact[]);
      }
    });

    const handleArtifactSaved = (artifact: unknown) => {
      const a = artifact as Artifact;
      if (a.taskId !== activeTaskId) return;
      setTaskArtifacts((prev) => {
        if (prev.some((x) => x.id === a.id)) return prev;
        return [a, ...prev];
      });
    };
    const cleanup = window.clawwork.onArtifactSaved(handleArtifactSaved);
    return cleanup;
  }, [activeTaskId]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-3 border-b border-[var(--border)]">
        <div className="text-sm font-medium text-[var(--text-primary)]">{t('rightPanel.artifacts')}</div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="space-y-2">
            {taskArtifacts.length === 0 ? (
              <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-5 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <FileText size={16} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-sm text-[var(--text-secondary)]">{t('common.noFiles')}</span>
              </div>
            ) : (
              taskArtifacts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setHighlightedMessage(a.messageId)}
                  className={cn(
                    'group block w-full min-w-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-left',
                    'transition-all duration-150 hover:border-[var(--border)] hover:bg-[var(--bg-hover)] hover:translate-y-[-1px]',
                  )}
                  title={a.localPath}
                >
                  <div className="flex w-full min-w-0 items-center gap-2.5 overflow-hidden">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                      <FileText
                        size={15}
                        className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors"
                      />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="block w-full truncate text-sm font-medium text-[var(--text-primary)]">
                        {a.name}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
