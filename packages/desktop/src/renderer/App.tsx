import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import LeftNav from './layouts/LeftNav';
import MainArea from './layouts/MainArea';
import RightPanel from './layouts/RightPanel';
import Setup from './layouts/Setup';
import Settings from './layouts/Settings';
import ApprovalDialog from './components/ApprovalDialog';
import CommandPalette from './components/CommandPalette';
import { useUiStore } from './stores/uiStore';
import { useTaskStore } from './stores/taskStore';
import { useFileStore } from './stores/fileStore';
import { composer } from './platform';
import { useGatewayBootstrap } from './hooks/useGatewayBootstrap';
import { useUpdateCheck } from './hooks/useUpdateCheck';
import { useTraySync } from './hooks/useTraySync';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { motionDuration, motionEase } from '@/styles/design-tokens';
import AmbientShell from '@/components/ambient/AmbientShell';

export default function App() {
  const [ready, setReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const mainView = useUiStore((s) => s.mainView);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const setMainView = useUiStore((s) => s.setMainView);
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const commandPaletteOpen = useUiStore((s) => s.commandPaletteOpen);
  const startNewTask = useTaskStore((s) => s.startNewTask);
  const createTask = useTaskStore((s) => s.createTask);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);

  const leftNavCollapsed = useUiStore((s) => s.leftNavCollapsed);
  const toggleLeftNavCollapsed = useUiStore((s) => s.toggleLeftNavCollapsed);
  const leftNavWidth = useUiStore((s) => s.leftNavWidth);
  const setLeftNavWidth = useUiStore((s) => s.setLeftNavWidth);
  const rightPanelWidth = useUiStore((s) => s.rightPanelWidth);
  const setRightPanelWidth = useUiStore((s) => s.setRightPanelWidth);
  const leftNavShortcut = useUiStore((s) => s.leftNavShortcut);
  const rightPanelShortcut = useUiStore((s) => s.rightPanelShortcut);
  const themeMode = useUiStore((s) => s.theme);

  useGatewayBootstrap();
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
    const cleanup = window.clawwork.onArtifactSaved((artifact) => {
      useFileStore.getState().addArtifactIfNew(artifact as import('@clawwork/shared').Artifact);
    });
    return cleanup;
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
      if (settings?.devMode) {
        useUiStore.setState({ devMode: true });
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
        toggleCommandPalette();
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
      toggleCommandPalette,
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
    window.clawwork.setWindowButtonVisibility(!leftNavCollapsed);
  }, [leftNavCollapsed]);

  useEffect(() => {
    return window.clawwork.onQuickLaunchSubmit((message) => {
      const task = createTask();
      composer.send(task.id, { content: message, titleHint: message });
    });
  }, [createTask]);

  useEffect(() => {
    const navigateToTask = (taskId: string): void => {
      setActiveTask(taskId);
      setSettingsOpen(false);
      setMainView('chat');
    };
    const cleanupNav = window.clawwork.onTrayNavigateTask(navigateToTask);
    const cleanupNotification = window.clawwork.onNotificationNavigateTask(navigateToTask);
    const cleanupSettings = window.clawwork.onTrayOpenSettings(() => {
      setSettingsOpen(true);
    });
    return () => {
      cleanupNav();
      cleanupNotification();
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
          theme={themeMode === 'auto' ? 'system' : themeMode}
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
      <AnimatePresence>{commandPaletteOpen && <CommandPalette />}</AnimatePresence>
      <div
        className="relative flex h-screen overflow-hidden bg-[var(--bg-primary)]"
        style={{ backgroundImage: 'var(--bg-ambient)' }}
      >
        <AmbientShell />
        <motion.aside
          animate={{ width: leftNavCollapsed ? 52 : leftNavWidth }}
          transition={{ duration: motionDuration.moderate, ease: motionEase.standard }}
          className={cn('glass-heavy noise relative flex-shrink-0 overflow-hidden z-[1] border-r-0')}
          style={{ minWidth: leftNavCollapsed ? 52 : 180 }}
        >
          <LeftNav />
        </motion.aside>

        {!leftNavCollapsed && (
          <div
            className="group w-1.5 flex-shrink-0 cursor-col-resize z-10 -mx-[3px]"
            onMouseDown={(e) => startPanelDrag(e, leftNavWidth, setLeftNavWidth, 1)}
          >
            <div className="h-full w-px mx-auto bg-[var(--border)] group-hover:bg-[var(--accent)] transition-colors" />
          </div>
        )}

        <main className="relative flex-1 min-w-0 flex flex-col z-[1]">
          {settingsOpen ? <Settings /> : <MainArea onTogglePanel={toggleRightPanel} />}
        </main>

        <AnimatePresence>
          {rightPanelOpen && !settingsOpen && mainView === 'chat' && (
            <>
              <div
                className="group w-1.5 flex-shrink-0 cursor-col-resize z-10 -mx-[3px]"
                onMouseDown={(e) => startPanelDrag(e, rightPanelWidth, setRightPanelWidth, -1)}
              >
                <div className="h-full w-px mx-auto bg-[var(--border)] group-hover:bg-[var(--accent)] transition-colors" />
              </div>
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: rightPanelWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: motionDuration.moderate, ease: motionEase.standard }}
                className={cn('glass-heavy noise relative flex-shrink-0 overflow-hidden z-[1] border-l-0')}
              >
                <RightPanel />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        <Toaster
          theme={themeMode === 'auto' ? 'system' : themeMode}
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
