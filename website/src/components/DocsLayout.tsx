import { ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n/context';
import type { ReactNode } from 'react';

interface DocsLayoutProps {
  navigate: (to: string) => void;
  children: ReactNode;
}

export function DocsLayout({ navigate, children }: DocsLayoutProps) {
  const { t, locale, toggle } = useI18n();

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(20, 20, 20, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 24px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => navigate('')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="ClawWork" style={{ width: '28px', height: '28px' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
                fontSize: '16px',
                fontWeight: 700,
                color: '#f3f4f4',
              }}
            >
              ClawWork
            </span>
          </button>

          <button
            onClick={toggle}
            style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
              fontSize: '12px',
              color: '#0ffd0d',
              background: 'rgba(15, 253, 13, 0.08)',
              border: '1px solid rgba(15, 253, 13, 0.2)',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15, 253, 13, 0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15, 253, 13, 0.08)';
            }}
          >
            {locale === 'en' ? '中' : 'EN'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <button
          onClick={() => navigate('')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: '#0ffd0d',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '32px',
          }}
        >
          <ArrowLeft size={16} />
          {t.docs.backToHome}
        </button>

        {children}
      </main>
    </>
  );
}
