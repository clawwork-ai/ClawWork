import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Plus, FolderOpen, Sun, Moon, PanelRightOpen, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { useMessageStore } from '@/stores/messageStore';
import { commandPaletteMotion, safeMotion, STAGGER_STEP } from '@/styles/design-tokens';
import ActivityBars from './ActivityBars';

interface PaletteItem {
  id: string;
  kind: 'task' | 'action';
  label: string;
  secondary?: string;
  icon?: React.ReactNode;
  running?: boolean;
  onSelect: () => void;
}

interface PaletteSection {
  key: string;
  title: string;
  items: PaletteItem[];
}

export default function CommandPalette() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const close = useUiStore((s) => s.closeCommandPalette);
  const setMainView = useUiStore((s) => s.setMainView);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const startNewTask = useTaskStore((s) => s.startNewTask);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const tasks = useTaskStore((s) => s.tasks);
  const activeTurnBySession = useMessageStore((s) => s.activeTurnBySession);

  const isTaskStreaming = useCallback(
    (taskId: string) => {
      const t = tasks.find((task) => task.id === taskId);
      if (!t) return false;
      const turn = activeTurnBySession[t.sessionKey];
      return !!turn && !turn.finalized && (!!turn.streamingText || !!turn.streamingThinking);
    },
    [activeTurnBySession, tasks],
  );

  const exec = useCallback(
    (fn: () => void) => {
      close();
      fn();
    },
    [close],
  );

  const recentTasks = useMemo(
    () => [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [tasks],
  );

  const activeTasks = useMemo(() => tasks.filter((t) => t.status === 'active'), [tasks]);

  const actionItems = useMemo<PaletteItem[]>(
    () => [
      {
        id: 'action:new-task',
        kind: 'action',
        label: t('commandPalette.newTask'),
        icon: <Plus size={16} />,
        onSelect: () => exec(startNewTask),
      },
      {
        id: 'action:open-files',
        kind: 'action',
        label: t('commandPalette.openFiles'),
        icon: <FolderOpen size={16} />,
        onSelect: () => exec(() => setMainView('files')),
      },
      {
        id: 'action:toggle-theme',
        kind: 'action',
        label: t('commandPalette.toggleTheme'),
        icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
        onSelect: () =>
          exec(() => {
            const resolved = theme === 'auto' ? 'dark' : theme;
            setTheme(resolved === 'dark' ? 'light' : 'dark');
          }),
      },
      {
        id: 'action:toggle-panels',
        kind: 'action',
        label: t('commandPalette.togglePanels'),
        icon: <PanelRightOpen size={16} />,
        onSelect: () => exec(toggleRightPanel),
      },
      {
        id: 'action:settings',
        kind: 'action',
        label: t('commandPalette.openSettings'),
        icon: <Settings2 size={16} />,
        onSelect: () => exec(() => setSettingsOpen(true)),
      },
    ],
    [t, exec, startNewTask, setMainView, theme, setTheme, toggleRightPanel, setSettingsOpen],
  );

  const sections = useMemo<PaletteSection[]>(() => {
    const q = query.toLowerCase().trim();
    const match = (text: string) => !q || text.toLowerCase().includes(q);

    const result: PaletteSection[] = [];

    const filteredRecent = recentTasks
      .filter((task) => match(task.title || t('common.noTitle')))
      .map(
        (task): PaletteItem => ({
          id: `recent:${task.id}`,
          kind: 'task',
          label: task.title || t('common.noTitle'),
          secondary: isTaskStreaming(task.id) ? t('commandPalette.running') : undefined,
          running: isTaskStreaming(task.id),
          onSelect: () =>
            exec(() => {
              setActiveTask(task.id);
              setMainView('chat');
            }),
        }),
      );
    if (filteredRecent.length > 0) {
      result.push({ key: 'recent', title: t('commandPalette.recentTasks'), items: filteredRecent });
    }

    const filteredActions = actionItems.filter((a) => match(a.label));
    if (filteredActions.length > 0) {
      result.push({ key: 'actions', title: t('commandPalette.actions'), items: filteredActions });
    }

    const activeOnly = activeTasks
      .filter((task) => match(task.title || t('common.noTitle')))
      .map(
        (task): PaletteItem => ({
          id: `active:${task.id}`,
          kind: 'task',
          label: task.title || t('common.noTitle'),
          running: isTaskStreaming(task.id),
          onSelect: () =>
            exec(() => {
              setActiveTask(task.id);
              setMainView('chat');
            }),
        }),
      );
    if (activeOnly.length > 0) {
      result.push({ key: 'active', title: t('commandPalette.activeTasks'), items: activeOnly });
    }

    return result;
  }, [query, recentTasks, activeTasks, actionItems, t, exec, setActiveTask, setMainView, isTaskStreaming]);

  const flatItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
          break;
        case 'Enter':
          e.preventDefault();
          flatItems[selectedIndex]?.onSelect();
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [flatItems, selectedIndex, close],
  );

  const overlayMotion = safeMotion(commandPaletteMotion.overlay);
  const panelMotion = safeMotion(commandPaletteMotion.panel);
  const itemMotion = safeMotion(commandPaletteMotion.item);

  let globalIdx = 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--overlay-scrim)]"
      style={{ paddingTop: '15vh' }}
      {...overlayMotion}
      onClick={close}
    >
      <motion.div
        className="w-full rounded-2xl glass-command glow-3 overflow-hidden"
        style={{ maxWidth: 580 }}
        {...panelMotion}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-5 border-b border-[var(--border-subtle)]">
          <Search size={18} className="text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('commandPalette.placeholder')}
            className="type-label flex-1 h-12 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            style={{ caretColor: 'var(--accent)' }}
          />
          <kbd className="type-meta px-1.5 py-0.5 rounded border border-[var(--border-subtle)] text-[var(--text-muted)]">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 'min(400px, 50vh)' }}>
          {flatItems.length === 0 && query && (
            <div className="px-5 py-8 text-center type-support text-[var(--text-muted)]">
              {t('commandPalette.noResults')}
            </div>
          )}

          {sections.map((section) => (
            <div key={section.key} className="py-1.5">
              <div className="type-meta px-5 py-1.5 text-[var(--text-muted)] uppercase tracking-wider select-none">
                {section.title}
              </div>
              {section.items.map((item) => {
                const idx = globalIdx++;
                const isSelected = idx === selectedIndex;
                return (
                  <motion.div
                    key={item.id}
                    ref={isSelected ? selectedRef : undefined}
                    role="option"
                    aria-selected={isSelected}
                    {...itemMotion}
                    transition={{
                      ...itemMotion.transition,
                      delay: idx * STAGGER_STEP,
                    }}
                    className={cn(
                      'flex items-center gap-3 px-5 py-2 cursor-pointer select-none transition-colors',
                      isSelected
                        ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                    )}
                    onClick={() => item.onSelect()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    {item.icon && (
                      <span
                        className={cn('shrink-0', isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="type-body truncate flex-1">{item.label}</span>
                    {item.running && <ActivityBars className="shrink-0 ml-auto" />}
                    {item.secondary && !item.running && (
                      <span className="type-meta text-[var(--text-muted)] shrink-0 ml-auto">{item.secondary}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="type-meta flex gap-4 border-t border-[var(--border-subtle)] px-5 py-2 text-[var(--text-muted)]">
          <span>
            <kbd className="font-mono">↑↓</kbd> {t('common.navigate')}
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> {t('common.select')}
          </span>
          <span>
            <kbd className="font-mono">Esc</kbd> {t('common.close')}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
