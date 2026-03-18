import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import LeftNav from './layouts/LeftNav';
import MainArea from './layouts/MainArea';
import RightPanel from './layouts/RightPanel';
import Setup from './layouts/Setup';
import Settings from './layouts/Settings';
import ApprovalDialog from './components/ApprovalDialog';
import { useUiStore } from './stores/uiStore';
import { useTaskStore } from './stores/taskStore';
import { useMessageStore } from './stores/messageStore';
import { useFileStore } from './stores/fileStore';
import { useGatewayEventDispatcher } from './hooks/useGatewayDispatcher';
import { useTheme } from './hooks/useTheme';
import { useUpdateCheck } from './hooks/useUpdateCheck';
import { useTraySync } from './hooks/useTraySync';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  const [ready, setReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const mainView = useUiStore((s) => s.mainView);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const theme = useUiStore((s) => s.theme);
  const setMainView = useUiStore((s) => s.setMainView);
  const focusSearch = useUiStore((s) => s.focusSearch);
  const startNewTask = useTaskStore((s) => s.startNewTask);
  const createTask = useTaskStore((s) => s.createTask);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const updateTaskTitle = useTaskStore((s) => s.updateTaskTitle);
  const addMessage = useMessageStore((s) => s.addMessage);
  const setProcessing = useMessageStore((s) => s.setProcessing);

  const leftNavCollapsed = useUiStore((s) => s.leftNavCollapsed);
  const toggleLeftNavCollapsed = useUiStore((s) => s.toggleLeftNavCollapsed);
  const leftNavWidth = useUiStore((s) => s.leftNavWidth);
  const setLeftNavWidth = useUiStore((s) => s.setLeftNavWidth);
  const rightPanelWidth = useUiStore((s) => s.rightPanelWidth);
  const setRightPanelWidth = useUiStore((s) => s.setRightPanelWidth);
  const leftNavShortcut = useUiStore((s) => s.leftNavShortcut);
  const rightPanelShortcut = useUiStore((s) => s.rightPanelShortcut);

  useGatewayEventDispatcher();
  useTheme();
  useUpdateCheck();
  useTraySync();

  const startPanelDrag = useCallback(
    (e: React.MouseEvent, startWidth: number, setWidth: (w: number) => void, dir: 1 | -1) => {
      e.preventDefault();
      const ox = e.clientX;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      const onMove = (ev: MouseEvent) => setWidth(startWidth + dir * (ev.clientX - ox));
      const onUp = () => {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [],
  );

  useEffect(() => {
    window.clawwork.onArtifactSaved((artifact) => {
      useFileStore.getState().addArtifactIfNew(artifact as import('@clawwork/shared').Artifact);
    });
  }, []);

  useEffect(() => {
    window.clawwork.isWorkspaceConfigured().then((configured) => {
      if (configured) {
        setReady(true);
      } else {
        setNeedsSetup(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.clawwork.getSettings().then((settings) => {
      if (settings?.sendShortcut) {
        useUiStore.setState({ sendShortcut: settings.sendShortcut });
      }
      if (settings?.leftNavShortcut) {
        useUiStore.setState({ leftNavShortcut: settings.leftNavShortcut });
      }
      if (settings?.rightPanelShortcut) {
        useUiStore.setState({ rightPanelShortcut: settings.rightPanelShortcut });
      }
    });
  }, [ready]);

  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      if (e.shiftKey && e.code === 'KeyO') {
        e.preventDefault();
        startNewTask();
        return;
      }

      if (e.shiftKey && e.code === 'KeyF') {
        e.preventDefault();
        setMainView('files');
        return;
      }

      if (!e.shiftKey && e.code === 'KeyK') {
        e.preventDefault();
        if (leftNavCollapsed) toggleLeftNavCollapsed();
        focusSearch();
        return;
      }

      const leftCode = leftNavShortcut;
      const rightCode = rightPanelShortcut;

      if (!e.shiftKey && e.code === leftCode) {
        e.preventDefault();
        toggleLeftNavCollapsed();
        return;
      }

      if (!e.shiftKey && e.code === rightCode) {
        e.preventDefault();
        if (useUiStore.getState().mainView === 'chat') toggleRightPanel();
      }
    },
    [
      startNewTask,
      setMainView,
      focusSearch,
      leftNavCollapsed,
      leftNavShortcut,
      rightPanelShortcut,
      toggleLeftNavCollapsed,
      toggleRightPanel,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  useEffect(() => {
    return window.clawwork.onQuickLaunchSubmit((message) => {
      const task = createTask();
      const title = message.slice(0, 30).replace(/\n/g, ' ').trim();
      updateTaskTitle(task.id, title + (message.length > 30 ? '\u2026' : ''));
      addMessage(task.id, 'user', message);
      setProcessing(task.id, true);
      window.clawwork
        .sendMessage(task.gatewayId, task.sessionKey, message)
        .then((result) => {
          if (result && !result.ok) {
            setProcessing(task.id, false);
          }
        })
        .catch(() => {
          setProcessing(task.id, false);
        });
    });
  }, [createTask, updateTaskTitle, addMessage, setProcessing]);

  useEffect(() => {
    const cleanupNav = window.clawwork.onTrayNavigateTask((taskId) => {
      setActiveTask(taskId);
      setSettingsOpen(false);
      setMainView('chat');
    });
    const cleanupSettings = window.clawwork.onTrayOpenSettings(() => {
      setSettingsOpen(true);
    });
    return () => {
      cleanupNav();
      cleanupSettings();
    };
  }, [setActiveTask, setSettingsOpen, setMainView]);

  if (needsSetup) {
    return (
      <TooltipProvider>
        <Setup
          onSetupComplete={() => {
            setNeedsSetup(false);
            setReady(true);
          }}
        />
        <Toaster
          theme={theme === 'auto' ? 'system' : theme}
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </TooltipProvider>
    );
  }

  if (!ready) return null;

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
        <div className="titlebar-drag fixed top-0 left-0 right-0 h-8 z-50" />

        <motion.aside
          animate={{ width: leftNavCollapsed ? 52 : leftNavWidth }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className={cn('flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden')}
          style={{ minWidth: leftNavCollapsed ? 52 : 180 }}
        >
          <LeftNav />
        </motion.aside>

        {!leftNavCollapsed && (
          <div
            className="w-1.5 flex-shrink-0 cursor-col-resize hover:bg-[var(--accent)]/20 transition-colors z-10"
            onMouseDown={(e) => startPanelDrag(e, leftNavWidth, setLeftNavWidth, 1)}
          />
        )}

        <main className="flex-1 min-w-0 flex flex-col">
          {settingsOpen ? (
            <Settings onClose={() => setSettingsOpen(false)} />
          ) : (
            <MainArea onTogglePanel={toggleRightPanel} />
          )}
        </main>

        <AnimatePresence>
          {rightPanelOpen && !settingsOpen && mainView === 'chat' && (
            <>
              <div
                className="w-1.5 flex-shrink-0 cursor-col-resize hover:bg-[var(--accent)]/20 transition-colors z-10"
                onMouseDown={(e) => startPanelDrag(e, rightPanelWidth, setRightPanelWidth, -1)}
              />
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: rightPanelWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                className={cn('flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden')}
              >
                <RightPanel />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        <Toaster
          theme={theme === 'auto' ? 'system' : theme}
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            },
          }}
        />
        <ApprovalDialog />
      </div>
    </TooltipProvider>
  );
}
