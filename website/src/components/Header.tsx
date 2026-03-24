import { Github } from 'lucide-react';
import { useI18n } from '../i18n/context';

const NAV_LINKS = [
  { key: 'features' as const, href: '#features' },
  { key: 'architecture' as const, href: '#architecture' },
  { key: 'quickStart' as const, href: '#quick-start' },
];

export function Header() {
  const { t, locale, toggle } = useI18n();

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
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
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
          {NAV_LINKS.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              style={{
                fontSize: '14px',
                color: '#9ca3af',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#f3f4f4';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
              }}
            >
              {t.nav[key]}
            </a>
          ))}

          <a
            href="https://github.com/clawwork-ai/clawwork"
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
            {t.nav.github}
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
