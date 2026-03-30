import { Github, Star } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { useRepoInfo, REPO } from '../hooks/useLatestRelease';

const ANCHOR_LINKS = [
  { key: 'features' as const, href: '#features' },
  { key: 'architecture' as const, href: '#architecture' },
];

function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(count);
}

interface HeaderProps {
  navigate: (to: string) => void;
}

export function Header({ navigate }: HeaderProps) {
  const { t, locale, toggle } = useI18n();
  const info = useRepoInfo();

  const handleLink = (e: React.MouseEvent, to: string) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(20, 20, 20, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
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
        <a
          href={import.meta.env.BASE_URL}
          onClick={(e) => handleLink(e, '')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
        >
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="ClawWork" style={{ width: '28px', height: '28px' }} />
          <span className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            ClawWork
          </span>
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {ANCHOR_LINKS.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              onClick={(e) => handleLink(e, href)}
              className="link"
              style={{ fontSize: '14px', padding: '6px 12px', borderRadius: '4px' }}
            >
              {t.nav[key]}
            </a>
          ))}

          <a
            href="blogs"
            onClick={(e) => handleLink(e, 'blogs')}
            className="link"
            style={{ fontSize: '14px', padding: '6px 12px', borderRadius: '4px' }}
          >
            {t.nav.blogs}
          </a>

          <a
            href={`${import.meta.env.BASE_URL}keynote/`}
            className="link"
            style={{ fontSize: '14px', padding: '6px 12px', borderRadius: '4px' }}
          >
            {t.nav.keynote}
          </a>

          <a
            href="https://cpwa.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
            style={{
              fontSize: '14px',
              padding: '6px 12px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {t.nav.pwa}
            <span
              className="mono badge-accent"
              style={{
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '3px',
                padding: '1px 5px',
                lineHeight: '14px',
                letterSpacing: '0.03em',
              }}
            >
              BETA
            </span>
          </a>

          <a
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            aria-label="GitHub"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              textDecoration: 'none',
              padding: '5px 12px',
              borderRadius: '4px',
              marginLeft: '8px',
            }}
          >
            <Github size={15} />
            {info?.stars != null ? (
              <>
                <Star size={12} fill="currentColor" aria-hidden="true" />
                <span className="mono" style={{ fontSize: '12px' }}>
                  {formatStars(info.stars)}
                </span>
              </>
            ) : (
              t.nav.github
            )}
          </a>

          <button
            onClick={toggle}
            className="mono btn-accent"
            aria-label={locale === 'en' ? 'Switch to Chinese' : 'Switch to English'}
            style={{ fontSize: '12px', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', marginLeft: '4px' }}
          >
            {locale === 'en' ? '中' : 'EN'}
          </button>
        </nav>
      </div>
    </header>
  );
}
