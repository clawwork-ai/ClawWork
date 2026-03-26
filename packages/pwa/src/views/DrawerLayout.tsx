import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, LazyMotion, domMax, m } from 'framer-motion';
import { Menu, Settings, LogOut, ChevronDown, Search, SquarePen } from 'lucide-react';
import { useUiStore, useTaskStore } from '../stores/hooks';
import { AgentSelector } from '../components/AgentSelector';
import { GatewayDebugLog } from '../components/GatewayDebugLog';
import { destroyAllClients } from '../gateway/client';
import { clearAll } from '../persistence/db';
import { TaskList } from '../components/TaskList';
import { GatewayStatus } from '../components/GatewayStatus';
import { ChatView } from './ChatView';
import { SettingsSheet } from '../components/SettingsSheet';
import { ensureHydrationReady } from '../stores';

interface DrawerLayoutProps {
  onSignedOut: () => void;
}

export function DrawerLayout({ onSignedOut }: DrawerLayoutProps) {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [agentSelectorOpen, setAgentSelectorOpen] = useState(false);
  const [debugLogOpen, setDebugLogOpen] = useState(false);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const pendingNewTask = useTaskStore((s) => s.pendingNewTask);
  const tasks = useTaskStore((s) => s.tasks);
  const activeTask = tasks.find((tk) => tk.id === activeTaskId);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const edgeTouchRef = useRef<number | null>(null);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => {
      const firstBtn = drawerRef.current?.querySelector<HTMLElement>('button');
      firstBtn?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen, closeDrawer]);

  const handleSignOut = useCallback(async () => {
    destroyAllClients();
    await clearAll();
    closeDrawer();
    onSignedOut();
  }, [closeDrawer, onSignedOut]);

  const handleNewTask = useCallback(async () => {
    await ensureHydrationReady();
    useTaskStore.getState().startNewTask();
    closeDrawer();
  }, [closeDrawer]);

  const handleAgentSelect = useCallback(async (agentId: string) => {
    await ensureHydrationReady();
    const gatewayId = useUiStore.getState().defaultGatewayId ?? undefined;
    useTaskStore.getState().startNewTask(gatewayId, agentId);
    setAgentSelectorOpen(false);
  }, []);

  return (
    <LazyMotion features={domMax}>
      <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="safe-area-top" />

        <header className="flex shrink-0 items-center gap-2 px-3 py-2">
          <button
            ref={menuButtonRef}
            onClick={() => setDrawerOpen(true)}
            aria-label={t('drawer.menuButton')}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--text-secondary)', minHeight: 44, minWidth: 44 }}
          >
            <Menu size={22} />
          </button>
          <button
            onClick={() => setAgentSelectorOpen(true)}
            className="flex flex-1 items-center gap-1 truncate"
            aria-label={t('agents.selectTitle')}
          >
            <span className="type-label truncate" style={{ color: 'var(--text-primary)' }}>
              {activeTask?.title || (pendingNewTask ? t('tasks.newTask') : t('app.name', { defaultValue: 'ClawWork' }))}
            </span>
            <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          </button>
          <GatewayStatusCompact onTap={() => setDebugLogOpen(true)} />
        </header>

        <main className="flex-1 overflow-hidden">
          <ChatView />
        </main>

        {!drawerOpen && (
          <div
            className="fixed inset-y-0 left-0 z-30"
            style={{ width: 20 }}
            onTouchStart={(e) => {
              edgeTouchRef.current = e.touches[0]!.clientX;
            }}
            onTouchMove={(e) => {
              if (edgeTouchRef.current !== null && e.touches[0]!.clientX - edgeTouchRef.current > 50) {
                edgeTouchRef.current = null;
                setDrawerOpen(true);
              }
            }}
            onTouchEnd={() => {
              edgeTouchRef.current = null;
            }}
          />
        )}

        <AnimatePresence>
          {drawerOpen && (
            <>
              <m.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 surface-overlay"
                onClick={closeDrawer}
                aria-hidden="true"
              />
              <m.aside
                key="drawer"
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label={t('drawer.title', { defaultValue: 'Navigation drawer' })}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                drag="x"
                dragConstraints={{ right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_e, info) => {
                  if (info.offset.x < -80 || info.velocity.x < -300) closeDrawer();
                }}
                className="fixed inset-y-0 left-0 z-50 flex w-80 flex-col"
                style={{ backgroundColor: 'var(--bg-secondary)', maxWidth: '80vw' }}
              >
                <div className="safe-area-top" />
                <div className="flex items-center gap-2 px-4 py-3">
                  <div
                    className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <Search size={16} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                    <span className="type-body" style={{ color: 'var(--text-muted)' }}>
                      {t('drawer.search', { defaultValue: 'Search' })}
                    </span>
                  </div>
                  <button
                    onClick={handleNewTask}
                    aria-label={t('drawer.newTaskButton')}
                    className="flex shrink-0 items-center justify-center rounded-lg transition-colors"
                    style={{ color: 'var(--accent)', minHeight: 44, minWidth: 44 }}
                  >
                    <SquarePen size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TaskList onSelect={closeDrawer} />
                </div>

                <div className="px-4 py-3">
                  <GatewayStatus />
                  <button
                    onClick={() => {
                      useUiStore.getState().setSettingsOpen(true);
                      closeDrawer();
                    }}
                    aria-label={t('drawer.settings')}
                    className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 type-body transition-colors"
                    style={{ color: 'var(--text-secondary)', minHeight: 44 }}
                  >
                    <Settings size={16} aria-hidden="true" />
                    {t('drawer.settings')}
                  </button>
                  <button
                    onClick={handleSignOut}
                    aria-label={t('drawer.signOut')}
                    className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 type-body transition-colors"
                    style={{ color: 'var(--danger)', minHeight: 44 }}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    {t('drawer.signOut')}
                  </button>
                </div>
                <div className="safe-area-bottom" />
              </m.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      <AgentSelector
        open={agentSelectorOpen}
        onClose={() => setAgentSelectorOpen(false)}
        onSelect={handleAgentSelect}
      />

      <GatewayDebugLog open={debugLogOpen} onClose={() => setDebugLogOpen(false)} />

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} onSignOut={handleSignOut} />
    </LazyMotion>
  );
}

function GatewayStatusCompact({ onTap }: { onTap?: () => void }) {
  const { t } = useTranslation();
  const statusMap = useUiStore((s) => s.gatewayStatusMap);
  const entries = Object.entries(statusMap);
  if (entries.length === 0) return null;

  const allConnected = entries.every(([, s]) => s === 'connected');
  const anyConnecting = entries.some(([, s]) => s === 'connecting');

  const color = allConnected ? 'var(--accent)' : anyConnecting ? 'var(--warning)' : 'var(--danger)';
  const label = allConnected
    ? t('gateway.connected')
    : anyConnecting
      ? t('gateway.connecting')
      : t('gateway.disconnected');

  return (
    <button
      onClick={onTap}
      className="flex items-center justify-center rounded-lg p-2 transition-colors"
      style={{ minHeight: 44, minWidth: 44 }}
      aria-label={`${label} — tap for log`}
      role="status"
    >
      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
    </button>
  );
}
