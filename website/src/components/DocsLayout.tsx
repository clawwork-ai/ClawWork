import { ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { Header } from './Header';
import type { ReactNode } from 'react';

interface DocsLayoutProps {
  navigate: (to: string) => void;
  backTo?: string;
  children: ReactNode;
}

export function DocsLayout({ navigate, backTo, children }: DocsLayoutProps) {
  const { t } = useI18n();

  return (
    <>
      <Header navigate={navigate} />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 96px' }}>
        {backTo != null && (
          <button
            onClick={() => navigate(backTo)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: 'var(--color-accent)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '32px',
            }}
          >
            <ArrowLeft size={16} />
            {t.docs.backToList}
          </button>
        )}
        {children}
      </main>
    </>
  );
}
