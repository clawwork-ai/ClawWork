import { ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { getArticleList } from '../docs/registry';

interface DocIndexProps {
  navigate: (to: string) => void;
}

export function DocIndex({ navigate }: DocIndexProps) {
  const { t, locale } = useI18n();
  const articles = getArticleList(locale);

  return (
    <div>
      <h1
        className="mono"
        style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 40px 0' }}
      >
        {t.docs.title}
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {articles.map((article) => (
          <button
            key={article.slug}
            onClick={() => navigate(`blogs/${article.slug}`)}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              background: 'var(--color-bg-card)',
              borderRadius: '6px',
              padding: '20px 24px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>
              <h2
                className="mono"
                style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}
              >
                {article.title}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                {article.description}
              </p>
              {article.date && (
                <time
                  className="mono"
                  style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}
                >
                  {article.date}
                </time>
              )}
            </div>
            <ChevronRight size={18} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}
