import { ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface DocIndexProps {
  navigate: (to: string) => void;
}

export function DocIndex({ navigate }: DocIndexProps) {
  const { t } = useI18n();

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
          fontSize: '28px',
          fontWeight: 700,
          color: '#f3f4f4',
          margin: '0 0 40px 0',
        }}
      >
        {t.docs.title}
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {t.docs.articles.map((article) => (
          <button
            key={article.slug}
            onClick={() => navigate(`docs/${article.slug}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              background: '#1c1c1c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '20px 24px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(15, 253, 13, 0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#f3f4f4',
                  margin: '0 0 6px 0',
                }}
              >
                {article.title}
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>{article.description}</p>
            </div>
            <ChevronRight size={18} color="#6b7280" style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
