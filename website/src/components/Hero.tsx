import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/context';

const REPO = 'clawwork-ai/clawwork';

function useLatestRelease() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then((r) => r.json())
      .then((d: { tag_name?: string }) => {
        if (d.tag_name) setVersion(d.tag_name);
      })
      .catch(() => {});
  }, []);

  return version;
}

export function Hero() {
  const { t } = useI18n();
  const version = useLatestRelease();

  return (
    <section
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '96px 24px 80px',
        textAlign: 'center',
        animation: 'fadeInUp 0.6s ease forwards',
      }}
    >
      <a
        href={`https://github.com/${REPO}/releases/latest`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 253, 13, 0.08)',
          border: '1px solid rgba(15, 253, 13, 0.15)',
          borderRadius: '20px',
          padding: '4px 14px',
          marginBottom: '32px',
          textDecoration: 'none',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background = 'rgba(15, 253, 13, 0.15)';
          el.style.borderColor = 'rgba(15, 253, 13, 0.35)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background = 'rgba(15, 253, 13, 0.08)';
          el.style.borderColor = 'rgba(15, 253, 13, 0.15)';
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            background: '#0ffd0d',
            borderRadius: '50%',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
            fontSize: '12px',
            color: '#0ffd0d',
          }}
        >
          {version ?? '...'}
        </span>
      </a>

      <h1
        style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 700,
          color: '#f3f4f4',
          margin: '0 0 24px 0',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
      >
        {t.hero.headline}
      </h1>

      <p
        style={{
          fontSize: '18px',
          color: '#9ca3af',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: '1.7',
        }}
      >
        {t.hero.tagline}
      </p>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: t.hero.badgeMacOS, available: true },
          { label: t.hero.badgeWindows, available: true },
          { label: t.hero.badgeLinux, available: false },
        ].map(({ label, available }) => (
          <span
            key={label}
            style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
              fontSize: '12px',
              padding: '5px 14px',
              borderRadius: '4px',
              border: available ? '1px solid rgba(15, 253, 13, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: available ? '#0ffd0d' : '#6b7280',
              background: available ? 'rgba(15, 253, 13, 0.06)' : 'transparent',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div style={{ marginTop: '48px' }}>
        <img
          src={`${import.meta.env.BASE_URL}screenshot.png`}
          alt="ClawWork screenshot"
          style={{
            maxWidth: '100%',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          }}
        />
      </div>
    </section>
  );
}
