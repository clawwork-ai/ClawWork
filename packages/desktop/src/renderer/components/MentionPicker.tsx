import { useEffect, useRef, useMemo } from 'react';
import { File, FileCode, FolderOpen, Image as ImageIcon, ListTodo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Task, Artifact, FileIndexEntry } from '@clawwork/shared';
import { useFileStore } from '@/stores/fileStore';
import { cn, formatFileSize } from '@/lib/utils';

export type MentionTab = 'local' | 'tasks' | 'files';

export type MentionItem =
  | { kind: 'task'; task: Task }
  | { kind: 'file'; artifact: Artifact }
  | { kind: 'local'; file: FileIndexEntry };
interface MentionPickerProps {
  visible: boolean;
  query: string;
  tasks: Task[];
  localFiles: FileIndexEntry[];
  hasContextFolders: boolean;
  activeTab: MentionTab;
  selectedIndex: number;
  onSelectTask: (task: Task) => void;
  onSelectArtifact: (artifact: Artifact) => void;
  onSelectLocalFile: (file: FileIndexEntry) => void;
  onTabChange: (tab: MentionTab) => void;
  onHoverIndex: (index: number) => void;
  onItemsChange?: (items: MentionItem[]) => void;
}

function artifactIcon(type: string, size: number) {
  if (type === 'code') return <FileCode size={size} className="text-[var(--accent)]" />;
  if (type === 'image') return <ImageIcon size={size} className="text-[var(--info)]" />;
  return <File size={size} className="text-[var(--text-muted)]" />;
}

export default function MentionPicker({
  visible,
  query,
  tasks,
  localFiles,
  hasContextFolders,
  activeTab,
  selectedIndex,
  onSelectTask,
  onSelectArtifact,
  onSelectLocalFile,
  onTabChange,
  onHoverIndex,
  onItemsChange,
}: MentionPickerProps) {
  const { t } = useTranslation();
  const artifacts = useFileStore((s) => s.artifacts);
  const setArtifacts = useFileStore((s) => s.setArtifacts);
  const listRef = useRef<HTMLDivElement>(null);
  const artifactsLoaded = useRef(false);

  useEffect(() => {
    if (!visible || artifactsLoaded.current) return;
    if (artifacts.length > 0) {
      artifactsLoaded.current = true;
      return;
    }
    artifactsLoaded.current = true;
    window.clawwork.listArtifacts().then((res) => {
      if (res.ok && res.result) {
        setArtifacts(res.result as unknown as Artifact[]);
      }
    });
  }, [visible, artifacts.length, setArtifacts]);

  const tabs = useMemo(() => {
    const allTabs: { id: MentionTab; label: string; icon: typeof ListTodo }[] = [
      { id: 'local', label: t('mentionPicker.local'), icon: FolderOpen },
      { id: 'tasks', label: t('mentionPicker.tasks'), icon: ListTodo },
      { id: 'files', label: t('mentionPicker.files'), icon: File },
    ];
    if (hasContextFolders) return allTabs;
    return allTabs.filter((tab) => tab.id !== 'local');
  }, [hasContextFolders, t]);

  const items = useMemo<MentionItem[]>(() => {
    const q = query.toLowerCase();
    if (activeTab === 'local') {
      const filtered = q
        ? localFiles.filter((f) => f.fileName.toLowerCase().includes(q) || f.relativePath.toLowerCase().includes(q))
        : localFiles;
      return filtered.map((f) => ({ kind: 'local' as const, file: f }));
    }
    if (activeTab === 'tasks') {
      const filtered = q ? tasks.filter((t) => t.title.toLowerCase().includes(q)) : tasks;
      return filtered.map((t) => ({ kind: 'task' as const, task: t }));
    }
    const filtered = q ? artifacts.filter((a) => a.name.toLowerCase().includes(q)) : artifacts;
    return filtered.map((a) => ({ kind: 'file' as const, artifact: a }));
  }, [activeTab, query, tasks, artifacts, localFiles]);

  useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-mention-selected]') as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute bottom-full left-0 right-0 mb-2 z-50',
        'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
        'rounded-xl shadow-[var(--shadow-elevated)] overflow-hidden',
      )}
    >
      <div className="flex border-b border-[var(--border-subtle)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              )}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div ref={listRef} className="max-h-56 overflow-y-auto py-1">
        {items.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
            {activeTab === 'local'
              ? t('mentionPicker.noLocalFiles')
              : activeTab === 'tasks'
                ? t('mentionPicker.noTasks')
                : t('mentionPicker.noFiles')}
          </div>
        )}

        {activeTab === 'local' &&
          items.map((item, i) => {
            if (item.kind !== 'local') return null;
            const f = item.file;
            return (
              <button
                key={f.absolutePath}
                data-mention-selected={i === selectedIndex ? '' : undefined}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm',
                  'hover:bg-[var(--bg-hover)] transition-colors',
                  i === selectedIndex && 'bg-[var(--bg-hover)]',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectLocalFile(f)}
                onMouseEnter={() => onHoverIndex(i)}
              >
                <FileCode size={14} className="text-[var(--accent)] flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate text-[var(--text-primary)]">{f.relativePath}</span>
                <span className="flex-shrink-0 text-xs text-[var(--text-muted)]">{formatFileSize(f.size)}</span>
              </button>
            );
          })}

        {activeTab === 'tasks' &&
          items.map((item, i) => {
            if (item.kind !== 'task') return null;
            return (
              <button
                key={item.task.id}
                data-mention-selected={i === selectedIndex ? '' : undefined}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm',
                  'hover:bg-[var(--bg-hover)] transition-colors',
                  i === selectedIndex && 'bg-[var(--bg-hover)]',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectTask(item.task)}
                onMouseEnter={() => onHoverIndex(i)}
              >
                <ListTodo size={14} className="text-[var(--accent)] flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate text-[var(--text-primary)]">
                  {item.task.title || t('common.noTitle')}
                </span>
                <span className="flex-shrink-0 text-2xs text-[var(--text-muted)]">{item.task.status}</span>
              </button>
            );
          })}

        {activeTab === 'files' &&
          items.map((item, i) => {
            if (item.kind !== 'file') return null;
            const a = item.artifact;
            return (
              <button
                key={a.id}
                data-mention-selected={i === selectedIndex ? '' : undefined}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm',
                  'hover:bg-[var(--bg-hover)] transition-colors',
                  i === selectedIndex && 'bg-[var(--bg-hover)]',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectArtifact(a)}
                onMouseEnter={() => onHoverIndex(i)}
              >
                {artifactIcon(a.type, 14)}
                <span className="flex-1 min-w-0 truncate text-[var(--text-primary)]">{a.name}</span>
                <span className="flex-shrink-0 text-xs text-[var(--text-muted)]">{formatFileSize(a.size)}</span>
              </button>
            );
          })}
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-3 py-1.5 text-2xs text-[var(--text-muted)]">
        <span>
          <kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)] font-mono">Tab</kbd> {t('common.switch')}
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)] font-mono">↑↓</kbd> {t('common.navigate')}
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)] font-mono">↵</kbd> {t('common.select')}
        </span>
      </div>
    </div>
  );
}
