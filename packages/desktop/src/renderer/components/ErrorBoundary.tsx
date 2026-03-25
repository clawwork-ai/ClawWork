import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4 max-w-md px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-dim)] flex items-center justify-center">
            <AlertTriangle size={22} className="text-[var(--accent)]" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[var(--text-primary)] font-medium">{i18n.t('errors.boundaryTitle')}</p>
            <p className="text-[var(--text-muted)] text-sm font-mono break-all">{this.state.error?.message}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={14} />
            {i18n.t('errors.reload')}
          </button>
        </div>
      </div>
    );
  }
}
