import { useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFileStore } from '@/stores/fileStore';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import FileCard from '@/components/FileCard';
import FilePreview from '@/components/FilePreview';
import type { Artifact } from '@clawwork/shared';
import type { ArtifactSearchResult } from '@/stores/fileStore';

function sortArtifacts(list: Artifact[], sortBy: 'date' | 'name' | 'type'): Artifact[] {
  const sorted = [...list];
  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'type':
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
  }
}

function SnippetHighlight({ snippet }: { snippet: string }) {
  const parts = snippet.split(/(<mark>[^<]*<\/mark>)/g);
  return (
    <span className="text-xs text-[var(--text-muted)] line-clamp-1">
      {parts.map((part, i) =>
        part.startsWith('<mark>') ? (
          <mark key={i} className="bg-[var(--accent-dim)] text-[var(--accent)] not-italic rounded px-0.5">
            {part.replace(/<\/?mark>/g, '')}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export default function FileBrowser() {
  const { t } = useTranslation();
  const artifacts = useFileStore((s) => s.artifacts);
  const filterTaskId = useFileStore((s) => s.filterTaskId);
  const sortBy = useFileStore((s) => s.sortBy);
  const selectedId = useFileStore((s) => s.selectedArtifactId);
  const searchQuery = useFileStore((s) => s.searchQuery);
  const searchResults = useFileStore((s) => s.searchResults);
  const isSearching = useFileStore((s) => s.isSearching);
  const setArtifacts = useFileStore((s) => s.setArtifacts);
  const setFilterTaskId = useFileStore((s) => s.setFilterTaskId);
  const setSortBy = useFileStore((s) => s.setSortBy);
  const setSelectedArtifact = useFileStore((s) => s.setSelectedArtifact);
  const setSearchQuery = useFileStore((s) => s.setSearchQuery);
  const setSearchResults = useFileStore((s) => s.setSearchResults);
  const setIsSearching = useFileStore((s) => s.setIsSearching);

  const tasks = useTaskStore((s) => s.tasks);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const setMainView = useUiStore((s) => s.setMainView);
  const setHighlightedMessage = useMessageStore((s) => s.setHighlightedMessage);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.clawwork.listArtifacts().then((res) => {
      if (res.ok && res.result) {
        setArtifacts(res.result as unknown as Artifact[]);
      }
    });
  }, [setArtifacts]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      window.clawwork
        .searchArtifacts(searchQuery)
        .then((res) => {
          setIsSearching(false);
          if (res.ok && res.result) {
            setSearchResults(res.result as unknown as ArtifactSearchResult[]);
          } else {
            setSearchResults([]);
          }
        })
        .catch(() => {
          setIsSearching(false);
          setSearchResults([]);
        });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, setSearchResults, setIsSearching]);

  const taskMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const task of tasks) m.set(task.id, task.title || t('common.newTask'));
    return m;
  }, [tasks, t]);

  const filteredArtifacts = useMemo(() => {
    if (filterTaskId) return artifacts.filter((a) => a.taskId === filterTaskId);
    return artifacts;
  }, [artifacts, filterTaskId]);

  const sorted = useMemo(() => sortArtifacts(filteredArtifacts, sortBy), [filteredArtifacts, sortBy]);

  const selectedArtifact = useMemo(
    () => (selectedId ? (artifacts.find((a) => a.id === selectedId) ?? null) : null),
    [selectedId, artifacts],
  );

  const taskIdsWithArtifacts = useMemo(() => {
    const ids = new Set<string>();
    for (const a of artifacts) ids.add(a.taskId);
    return Array.from(ids);
  }, [artifacts]);

  const handleNavigateToTask = useCallback(
    (taskId: string, messageId: string) => {
      setActiveTask(taskId);
      setHighlightedMessage(messageId);
      setMainView('chat');
    },
    [setActiveTask, setHighlightedMessage, setMainView],
  );

  const isSearchMode = searchQuery.trim().length > 0;

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
        <header className="titlebar-no-drag flex items-center justify-between px-6 py-3 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t('common.fileManager')}</h2>
          <div className="flex items-center gap-2">
            <select
              value={filterTaskId ?? ''}
              onChange={(e) => setFilterTaskId(e.target.value || null)}
              className={cn(
                'h-7 px-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)]',
                'text-xs text-[var(--text-secondary)] outline-none cursor-pointer',
              )}
            >
              <option value="">{t('fileBrowser.allTasks')}</option>
              {taskIdsWithArtifacts.map((id) => (
                <option key={id} value={id}>
                  {taskMap.get(id) ?? id}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'type')}
              className={cn(
                'h-7 px-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)]',
                'text-xs text-[var(--text-secondary)] outline-none cursor-pointer',
              )}
            >
              <option value="date">{t('fileBrowser.sortByDate')}</option>
              <option value="name">{t('fileBrowser.sortByName')}</option>
              <option value="type">{t('fileBrowser.sortByType')}</option>
            </select>
          </div>
        </header>

        <div className="titlebar-no-drag px-6 py-3 border-b border-[var(--border)] flex-shrink-0">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('fileBrowser.searchFiles')}
              className={cn(
                'w-full h-9 pl-10 pr-9 rounded-lg',
                'bg-[var(--bg-tertiary)] border border-[var(--border)]',
                'text-sm text-[var(--text-secondary)] outline-none',
                'focus:border-[var(--border-accent)] focus:bg-[var(--bg-secondary)]',
                'placeholder:text-[var(--text-muted)] transition-all duration-150',
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            {isSearchMode ? (
              searchResults === null || isSearching ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">{t('common.noFiles')}</p>
              ) : (
                <div className="space-y-1.5">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedArtifact(r.id === selectedId ? null : r.id)}
                      className={cn(
                        'w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-xl text-left transition-colors',
                        'bg-[var(--bg-secondary)] border hover:bg-[var(--bg-hover)]',
                        r.id === selectedId
                          ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                          : 'border-[var(--border)]',
                      )}
                    >
                      <span className="text-sm text-[var(--text-primary)] font-medium truncate">{r.name}</span>
                      {r.contentSnippet && <SnippetHighlight snippet={r.contentSnippet} />}
                      <span className="text-xs text-[var(--text-muted)]">{taskMap.get(r.taskId) ?? r.taskId}</span>
                    </button>
                  ))}
                </div>
              )
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <Search size={20} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">{t('common.noFiles')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sorted.map((a) => (
                  <FileCard
                    key={a.id}
                    artifact={a}
                    taskTitle={taskMap.get(a.taskId) ?? a.taskId}
                    selected={a.id === selectedId}
                    onClick={() => setSelectedArtifact(a.id === selectedId ? null : a.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <AnimatePresence>
        {selectedArtifact && (
          <motion.div
            {...motionPresets.slideIn}
            initial={{ opacity: 0, x: 16 }}
            exit={{ opacity: 0, x: 16 }}
            className="relative w-[360px] flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-secondary)]"
          >
            <button
              onClick={() => setSelectedArtifact(null)}
              title="Close preview"
              className={cn(
                'absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 z-10',
                'flex items-center justify-center w-5 h-12',
                'bg-[var(--bg-secondary)] border border-r-0 border-[var(--border)]',
                'rounded-l-lg cursor-pointer',
                'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                'transition-colors duration-150',
              )}
            >
              <ChevronRight size={13} />
            </button>
            <FilePreview artifact={selectedArtifact} onNavigateToTask={handleNavigateToTask} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
