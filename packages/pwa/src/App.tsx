import { useEffect, useState, lazy, Suspense, Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { isPaired } from './persistence/db';
import { reportDebugEvent } from './lib/debug';
import { useGatewayBootstrap } from './hooks/useGatewayBootstrap';
import { useUiStore } from './stores/hooks';
import { reconnectAllClients } from './gateway/client';
import { DrawerLayout } from './views/DrawerLayout';
import { Toaster } from 'sonner';

const PairingViewLazy = lazy(() => import('./views/PairingView').then((m) => ({ default: m.PairingView })));

const THEME_STORAGE_KEY = 'clawwork-theme';

type ThemeValue = 'dark' | 'light';

function resolveTheme(): ThemeValue {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch (err) {
    reportDebugEvent({
      level: 'warn',
      domain: 'app',
      event: 'theme.storage.read.failed',
      error: { message: err instanceof Error ? err.message : 'theme storage read failed' },
    });
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: ThemeValue): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export default function App() {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [paired, setPaired] = useState(false);
  const [theme, setThemeState] = useState<ThemeValue>(resolveTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      try {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          setThemeState(mq.matches ? 'light' : 'dark');
        }
      } catch {
        setThemeState(mq.matches ? 'light' : 'dark');
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    isPaired()
      .then((p) => {
        setPaired(p);
        setReady(true);
      })
      .catch((err: unknown) => {
        reportDebugEvent({
          level: 'error',
          domain: 'app',
          event: 'app.isPaired.failed',
          error: { message: err instanceof Error ? err.message : 'Failed to check pairing status' },
        });
        setReady(true);
      });
  }, []);

  if (!ready) return <LoadingSpinner text={t('app.loading')} />;

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner text={t('app.loading')} />}>
        {paired ? (
          <AppShell onSignedOut={() => setPaired(false)} />
        ) : (
          <PairingViewLazy onPaired={() => setPaired(true)} />
        )}
      </Suspense>
      <Toaster theme={theme} richColors position="top-center" />
    </ErrorBoundary>
  );
}

function AppShell({ onSignedOut }: { onSignedOut: () => void }) {
  useGatewayBootstrap();
  const { t } = useTranslation();
  const gatewaysLoaded = useUiStore((s) => s.gatewaysLoaded);
  const statusMap = useUiStore((s) => s.gatewayStatusMap);

  const entries = Object.entries(statusMap);
  const anyConnected = entries.some(([, s]) => s === 'connected');
  const gaveUp = entries.length > 0 && entries.every(([, s]) => s === 'disconnected');

  if (gatewaysLoaded && !anyConnected) {
    return (
      <div
        className="safe-area-top safe-area-bottom flex h-full flex-col items-center justify-center gap-4 px-8"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <img src="/icons/logo.png" alt="ClawWork" className="mb-2 h-16 w-16" />
        {!gaveUp && (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        )}
        <p className="text-center type-body" style={{ color: 'var(--text-secondary)' }}>
          {gaveUp ? t('gateway.disconnected') : t('chat.authorizationPending')}
        </p>
        <p className="max-w-sm text-center type-support" style={{ color: 'var(--text-muted)' }}>
          {t('pairing.instruction')}
        </p>
        <button
          onClick={reconnectAllClients}
          className="rounded-xl px-6 type-body"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-foreground)',
            minHeight: 44,
          }}
        >
          {t('shell.reconnect', { defaultValue: 'Reconnect' })}
        </button>
      </div>
    );
  }

  return <DrawerLayout onSignedOut={onSignedOut} />;
}

function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      {text && (
        <span className="type-support" style={{ color: 'var(--text-muted)' }}>
          {text}
        </span>
      )}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    reportDebugEvent({
      level: 'error',
      domain: 'app',
      event: 'app.error-boundary',
      error: { message: error.message, stack: error.stack },
    });
  }

  override render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error }) {
  const { t } = useTranslation();

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 px-8"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      role="alert"
    >
      <p className="text-center type-body font-medium" style={{ color: 'var(--danger)' }}>
        {t('app.error')}
      </p>
      <pre
        className="max-w-full overflow-x-auto rounded-lg px-4 py-2 type-support"
        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
      >
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        aria-label={t('app.reload')}
        className="rounded-lg px-4 type-body"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-foreground)',
          minHeight: 44,
          minWidth: 44,
        }}
      >
        {t('app.reload')}
      </button>
    </div>
  );
}
