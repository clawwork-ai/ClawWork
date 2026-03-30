import { useState, useEffect } from 'react';
import { Github, Star } from 'lucide-react';
import { useI18n } from '../i18n/context';

const REPO = 'clawwork-ai/clawwork';

const ANCHOR_LINKS = [
  { key: 'features' as const, href: '#features' },
  { key: 'architecture' as const, href: '#architecture' },
];

const linkStyle = {
  fontSize: '14px',
  color: '#9ca3af',
  textDecoration: 'none' as const,
  padding: '6px 12px',
  borderRadius: '4px',
  transition: 'color 0.15s',
};

function hoverIn(e: React.MouseEvent) {
  (e.currentTarget as HTMLElement).style.color = '#f3f4f4';
}
function hoverOut(e: React.MouseEvent) {
  (e.currentTarget as HTMLElement).style.color = '#9ca3af';
}

function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(count);
}

function useStarCount() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}`)
      .then((r) => r.json())
      .then((d: { stargazers_count?: number }) => {
        if (d.stargazers_count != null) setStars(d.stargazers_count);
      })
      .catch(() => {});
  }, []);

  return stars;
}

interface HeaderProps {
  navigate: (to: string) => void;
}

export function Header({ navigate }: HeaderProps) {
  const { t, locale, toggle } = useI18n();
  const stars = useStarCount();

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
        <a
          href={import.meta.env.BASE_URL}
          onClick={(e) => handleLink(e, '')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
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
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {ANCHOR_LINKS.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              onClick={(e) => handleLink(e, href)}
              style={linkStyle}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              {t.nav[key]}
            </a>
          ))}

          <a
            href="blogs"
            onClick={(e) => handleLink(e, 'blogs')}
            style={linkStyle}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            {t.nav.blogs}
          </a>

          <a
            href={`${import.meta.env.BASE_URL}keynote/`}
            style={linkStyle}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            {t.nav.keynote}
          </a>

          <a
            href="https://cpwa.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            {t.nav.pwa}
            <span
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
                fontSize: '10px',
                fontWeight: 600,
                color: '#0ffd0d',
                background: 'rgba(15, 253, 13, 0.1)',
                border: '1px solid rgba(15, 253, 13, 0.2)',
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: '#f3f4f4',
              textDecoration: 'none',
              padding: '5px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              marginLeft: '8px',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'rgba(255, 255, 255, 0.35)';
              el.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              el.style.background = 'transparent';
            }}
          >
            <Github size={15} />
            {stars != null && (
              <>
                <Star size={12} fill="#f3f4f4" />
                <span
                  style={{
                    fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
                    fontSize: '12px',
                  }}
                >
                  {formatStars(stars)}
                </span>
              </>
            )}
            {stars == null && t.nav.github}
          </a>

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
              marginLeft: '4px',
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
        </nav>
      </div>
    </header>
  );
}
