import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Artifact } from '@clawwork/shared';
import EmptyState from '@/components/semantic/EmptyState';
import ListItem from '@/components/semantic/ListItem';
import PanelHeader from '@/components/semantic/PanelHeader';

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
        <PanelHeader title={t('rightPanel.artifacts')} />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="space-y-2">
            {taskArtifacts.length === 0 ? (
              <EmptyState
                icon={<FileText size={16} className="text-[var(--text-muted)]" />}
                title={t('common.noFiles')}
                className="min-h-24 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-5"
              />
            ) : (
              taskArtifacts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setHighlightedMessage(a.messageId)}
                  className={cn(
                    'group block w-full min-w-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-left',
                    'transition-all duration-150 hover:border-[var(--border)] hover:bg-[var(--bg-hover)] hover:translate-y-[-1px]',
                  )}
                  title={a.localPath}
                >
                  <ListItem
                    leading={
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                        <FileText
                          size={15}
                          className="text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-secondary)]"
                        />
                      </div>
                    }
                    title={a.name}
                    className="rounded-xl px-3 py-2.5"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
