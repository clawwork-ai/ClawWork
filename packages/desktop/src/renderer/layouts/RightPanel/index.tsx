import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { STAGGER_STEP, motionDuration } from '@/styles/design-tokens';
import type { Artifact } from '@clawwork/shared';
import ListItem from '@/components/semantic/ListItem';
import PanelHeader from '@/components/semantic/PanelHeader';

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_STEP } },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: motionDuration.normal } },
};

function sortArtifacts(artifacts: Artifact[]) {
  return [...artifacts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function formatArtifactSubtitle(localPath: string) {
  const [, ...segments] = localPath.split('/');
  return segments.join('/') || localPath;
}

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
        setTaskArtifacts(sortArtifacts(res.result as unknown as Artifact[]));
      }
    });

    const handleArtifactSaved = (artifact: unknown) => {
      const a = artifact as Artifact;
      if (a.taskId !== activeTaskId) return;
      setTaskArtifacts((prev) => {
        if (prev.some((x) => x.id === a.id)) return prev;
        return sortArtifacts([a, ...prev]);
      });
    };
    const cleanup = window.clawwork.onArtifactSaved(handleArtifactSaved);
    return cleanup;
  }, [activeTaskId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-[var(--density-toolbar-height)] items-center border-b border-[var(--border)] px-5 shrink-0">
        <PanelHeader title={t('rightPanel.artifacts')} className="w-full items-center" />
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2.5 px-3 py-3">
          {taskArtifacts.length === 0 ? (
            <div className="flex items-center gap-2 px-2 py-1.5 text-[var(--text-muted)]">
              <FileText size={14} className="shrink-0 text-[var(--text-muted)]" />
              <span className="type-support">{t('common.noFiles')}</span>
            </div>
          ) : (
            <motion.div className="space-y-1.5" variants={listVariants} initial="hidden" animate="visible">
              {taskArtifacts.map((a) => (
                <motion.div key={a.id} variants={listItemVariants}>
                  <button
                    onClick={() => setHighlightedMessage(a.messageId)}
                    className={cn(
                      'group block w-full min-w-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-left',
                      'transition-all duration-150 hover:border-[var(--border)] hover:bg-[var(--bg-hover)]',
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
                      subtitle={formatArtifactSubtitle(a.localPath)}
                      meta={formatRelativeTime(new Date(a.createdAt))}
                      className="rounded-xl px-3 py-2.5"
                    />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
