import { useEffect, useMemo, useCallback, useRef, useState, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFileStore } from '@/stores/fileStore';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { getArtifactKindFilter, getArtifactLabel, type ArtifactKindFilter } from '@/lib/artifact-labels';
import { motionDuration, motionEase } from '@/styles/design-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import FileCard from '@/components/FileCard';
import FilePreview from '@/components/FilePreview';
import { TaskContextMenuPopover, type MenuItem } from '@/components/ContextMenu';
import { useResizePanel } from '@/hooks/useResizePanel';
import type { Artifact } from '@clawwork/shared';
import type { ArtifactSearchResult } from '@/stores/fileStore';
import EmptyState from '@/components/semantic/EmptyState';
import ListItem from '@/components/semantic/ListItem';
import SectionCard from '@/components/semantic/SectionCard';
import WindowTitlebar from '@/components/semantic/WindowTitlebar';

function sortArtifacts(list: Artifact[]): Artifact[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function SnippetHighlight({ snippet }: { snippet: string }) {
  const parts = snippet.split(/(<mark>[^<]*<\/mark>)/g);
  return (
    <span className="type-support line-clamp-1 text-[var(--text-muted)]">
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

type FileMenuState = { artifact: Artifact; position: { x: number; y: number } } | null;

export default function FileBrowser() {
  const { t } = useTranslation();
  const artifacts = useFileStore((s) => s.artifacts);
  const typeFilter = useFileStore((s) => s.typeFilter);
  const selectedId = useFileStore((s) => s.selectedArtifactId);
  const searchQuery = useFileStore((s) => s.searchQuery);
  const searchResults = useFileStore((s) => s.searchResults);
  const isSearching = useFileStore((s) => s.isSearching);
  const setArtifacts = useFileStore((s) => s.setArtifacts);
  const setTypeFilter = useFileStore((s) => s.setTypeFilter);
  const setSelectedArtifact = useFileStore((s) => s.setSelectedArtifact);
  const setSearchQuery = useFileStore((s) => s.setSearchQuery);
  const setSearchResults = useFileStore((s) => s.setSearchResults);
  const setIsSearching = useFileStore((s) => s.setIsSearching);

  const tasks = useTaskStore((s) => s.tasks);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const setMainView = useUiStore((s) => s.setMainView);
  const setHighlightedMessage = useMessageStore((s) => s.setHighlightedMessage);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef(0);

  const [fileMenu, setFileMenu] = useState<FileMenuState>(null);

  const openFileMenu = useCallback((e: MouseEvent, artifact: Artifact) => {
    e.preventDefault();
    e.stopPropagation();
    setFileMenu({ artifact, position: { x: e.clientX, y: e.clientY } });
  }, []);

  const closeFileMenu = useCallback(() => {
    setFileMenu(null);
  }, []);

  const handleNavigateToTask = useCallback(
    (taskId: string, messageId: string) => {
      setActiveTask(taskId);
      setHighlightedMessage(messageId);
      setMainView('chat');
    },
    [setActiveTask, setHighlightedMessage, setMainView],
  );

  const fileMenuItems = useMemo((): MenuItem[] => {
    if (!fileMenu) return [];
    const a = fileMenu.artifact;
    return [
      {
        label: t('filePreview.openInEditor'),
        action: () => window.clawwork.openArtifactFile(a.localPath),
      },
      {
        label: t('filePreview.revealInFolder'),
        action: () => window.clawwork.showArtifactInFolder(a.localPath),
      },
      {
        label: t('filePreview.goToSourceShort'),
        action: () => handleNavigateToTask(a.taskId, a.messageId),
      },
    ];
  }, [fileMenu, t, handleNavigateToTask]);

  useEffect(() => {
    return () => setSelectedArtifact(null);
  }, [setSelectedArtifact]);

  useEffect(() => {
    let cancelled = false;

    window.clawwork
      .listArtifacts()
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.result) {
          setArtifacts(res.result as unknown as Artifact[]);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('[FileBrowser] listArtifacts failed:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [setArtifacts]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const requestId = ++searchRequestIdRef.current;
    debounceRef.current = setTimeout(() => {
      window.clawwork
        .searchArtifacts(searchQuery, {
          kind: typeFilter,
        })
        .then((res) => {
          if (searchRequestIdRef.current !== requestId) return;
          setIsSearching(false);
          if (res.ok && res.result) {
            setSearchResults(res.result as unknown as ArtifactSearchResult[]);
          } else {
            setSearchResults([]);
          }
        })
        .catch(() => {
          if (searchRequestIdRef.current !== requestId) return;
          setIsSearching(false);
          setSearchResults([]);
        });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, setSearchResults, setIsSearching, typeFilter]);

  const taskMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const task of tasks) m.set(task.id, task.title || t('common.newTask'));
    return m;
  }, [tasks, t]);

  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((a) => {
      if (typeFilter !== 'all' && getArtifactKindFilter(a) !== typeFilter) return false;
      return true;
    });
  }, [artifacts, typeFilter]);

  const sorted = useMemo(() => sortArtifacts(filteredArtifacts), [filteredArtifacts]);

  const selectedArtifact = useMemo(
    () => (selectedId ? (artifacts.find((a) => a.id === selectedId) ?? null) : null),
    [selectedId, artifacts],
  );

  useEffect(() => {
    if (!selectedArtifact) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedArtifact(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtifact, setSelectedArtifact]);

  const {
    width: panelWidth,
    isDragging,
    handleMouseDown,
  } = useResizePanel({
    defaultWidth: 360,
    minWidth: 280,
    maxWidth: 700,
    storageKey: 'clawwork:file-preview-width',
  });

  const isSearchMode = searchQuery.trim().length > 0;
  const typeFilterOptions: Array<{ value: ArtifactKindFilter; label: string }> = [
    { value: 'all', label: t('fileBrowser.allTypes') },
    { value: 'image', label: t('fileBrowser.typeImages') },
    { value: 'code', label: t('fileBrowser.typeCode') },
    { value: 'file', label: t('fileBrowser.typeFiles') },
    { value: 'other', label: t('fileBrowser.typeOther') },
  ];

  return (
    <div className="relative flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0">
        <WindowTitlebar
          left={<h2 className="type-section-title text-[var(--text-primary)]">{t('common.fileManager')}</h2>}
          right={
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ArtifactKindFilter)}
              className={cn(
                'glow-focus h-7 px-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)]',
                'type-label text-[var(--text-secondary)] cursor-pointer',
              )}
            >
              {typeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          }
        />

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
                'w-full h-[var(--density-control-height)] pl-10 pr-9 rounded-lg',
                'bg-[var(--bg-tertiary)] border border-[var(--border)]',
                'type-body text-[var(--text-secondary)] outline-none',
                'focus:border-[var(--border-accent)] focus:bg-[var(--bg-secondary)]',
                'placeholder:text-[var(--text-muted)] transition-all duration-150',
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label={t('common.close')}
                className="glow-focus absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
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
                <EmptyState title={t('common.noFiles')} className="py-8" />
              ) : (
                <div className="space-y-1.5">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedArtifact(r.id === selectedId ? null : r.id)}
                      className={cn(
                        'w-full rounded-xl text-left transition-colors',
                        'bg-[var(--bg-secondary)] border hover:bg-[var(--bg-hover)]',
                        r.id === selectedId
                          ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                          : 'border-[var(--border)]',
                      )}
                    >
                      <ListItem
                        title={getArtifactLabel(r, t)}
                        subtitle={r.contentSnippet ? <SnippetHighlight snippet={r.contentSnippet} /> : undefined}
                        meta={taskMap.get(r.taskId) ?? r.taskId}
                        active={r.id === selectedId}
                        className="rounded-xl px-3 py-2.5"
                      />
                    </button>
                  ))}
                </div>
              )
            ) : sorted.length === 0 ? (
              <EmptyState
                icon={<Search size={20} className="text-[var(--text-muted)]" />}
                title={t('common.noFiles')}
                className="py-20"
              />
            ) : (
              <SectionCard bodyClassName="p-0" className="border-none bg-transparent shadow-none">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {sorted.map((a) => (
                    <FileCard
                      key={a.id}
                      artifact={a}
                      taskTitle={taskMap.get(a.taskId) ?? a.taskId}
                      selected={a.id === selectedId}
                      onClick={() => setSelectedArtifact(a.id === selectedId ? null : a.id)}
                      onContextMenu={(e) => openFileMenu(e, a)}
                    />
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </ScrollArea>
      </div>

      <AnimatePresence>
        {selectedArtifact && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 flex max-w-full justify-end">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: motionDuration.moderate, ease: motionEase.standard }}
              className="pointer-events-auto relative h-full flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-secondary)] shadow-[var(--shadow-floating)]"
              style={{ width: panelWidth, maxWidth: 'calc(100% - 48px)' }}
            >
              <div
                onMouseDown={handleMouseDown}
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-1 -translate-x-1/2 z-10 cursor-col-resize',
                  'group flex items-center justify-center',
                )}
              >
                <div
                  className={cn(
                    'w-1 h-8 rounded-full transition-colors duration-150',
                    isDragging ? 'bg-[var(--accent)]' : 'bg-transparent group-hover:bg-[var(--text-muted)]',
                  )}
                />
              </div>
              <FilePreview
                artifact={selectedArtifact}
                onNavigateToTask={handleNavigateToTask}
                onClose={() => setSelectedArtifact(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TaskContextMenuPopover
        open={fileMenu !== null}
        position={fileMenu?.position ?? null}
        items={fileMenuItems}
        onClose={closeFileMenu}
      />
    </div>
  );
}
