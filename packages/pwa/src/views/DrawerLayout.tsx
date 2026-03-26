import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { Menu, Plus, Settings, LogOut, Bot } from 'lucide-react';
import { useUiStore, useTaskStore } from '../stores/hooks';
import { AgentSelector } from '../components/AgentSelector';
import { destroyAllClients } from '../gateway/client';
import { clearAll } from '../persistence/db';
import { TaskList } from '../components/TaskList';
import { GatewayStatus } from '../components/GatewayStatus';
import { ChatView } from './ChatView';
import { ensureHydrationReady } from '../stores';

interface DrawerLayoutProps {
  onSignedOut: () => void;
}

export function DrawerLayout({ onSignedOut }: DrawerLayoutProps) {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [agentSelectorOpen, setAgentSelectorOpen] = useState(false);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const pendingNewTask = useTaskStore((s) => s.pendingNewTask);
  const tasks = useTaskStore((s) => s.tasks);
  const activeTask = tasks.find((tk) => tk.id === activeTaskId);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
    <LazyMotion features={domAnimation}>
      <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="safe-area-top" />

        <header
          className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            ref={menuButtonRef}
            onClick={() => setDrawerOpen(true)}
            aria-label={t('drawer.menuButton')}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--text-secondary)', minHeight: 44, minWidth: 44 }}
          >
            <Menu size={22} />
          </button>
          <span className="type-label flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
            {activeTask?.title || (pendingNewTask ? t('tasks.newTask') : t('app.name', { defaultValue: 'ClawWork' }))}
          </span>
          <button
            onClick={() => setAgentSelectorOpen(true)}
            aria-label={t('agents.selectTitle')}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--text-secondary)', minHeight: 44, minWidth: 44 }}
          >
            <Bot size={18} />
          </button>
          <GatewayStatusCompact />
        </header>

        <main className="flex-1 overflow-hidden">
          <ChatView />
        </main>

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
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col"
                style={{ backgroundColor: 'var(--bg-secondary)', maxWidth: '80vw' }}
              >
                <div className="safe-area-top" />
                <div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <GatewayStatus />
                  <button
                    onClick={handleNewTask}
                    aria-label={t('drawer.newTaskButton')}
                    className="rounded-lg p-1.5 transition-colors"
                    style={{ color: 'var(--accent)', minHeight: 44, minWidth: 44 }}
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TaskList onSelect={closeDrawer} />
                </div>

                <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => {
                      useUiStore.getState().setSettingsOpen(true);
                      closeDrawer();
                    }}
                    aria-label={t('drawer.settings')}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 type-body transition-colors"
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
    </LazyMotion>
  );
}

function GatewayStatusCompact() {
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

  return <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-label={label} role="status" />;
}
