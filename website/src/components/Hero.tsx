import { Download } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { useLatestRelease, detectPlatform } from '../hooks/useLatestRelease';

const REPO = 'clawwork-ai/clawwork';

interface DownloadButtonProps {
  label: string;
  href: string | null;
  primary: boolean;
}

function DownloadButton({ label, href, primary }: DownloadButtonProps) {
  const bg = primary ? 'rgba(15, 253, 13, 0.12)' : 'transparent';
  const border = primary ? '1px solid rgba(15, 253, 13, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)';
  const color = primary ? '#0ffd0d' : '#9ca3af';

  return (
    <a
      href={href ?? `https://github.com/${REPO}/releases/latest`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
        fontSize: '13px',
        padding: '8px 18px',
        borderRadius: '6px',
        border,
        color,
        background: bg,
        textDecoration: 'none',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = primary ? 'rgba(15, 253, 13, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        el.style.borderColor = primary ? 'rgba(15, 253, 13, 0.5)' : 'rgba(255, 255, 255, 0.25)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = bg;
        el.style.borderColor = primary ? 'rgba(15, 253, 13, 0.3)' : 'rgba(255, 255, 255, 0.12)';
      }}
    >
      <Download size={14} />
      {label}
    </a>
  );
}

export function Hero() {
  const { t } = useI18n();
  const release = useLatestRelease();
  const platform = detectPlatform();

  const buttons: { label: string; href: string | null; platformKey: string }[] = [
    { label: t.hero.download.macOS, href: release?.macARM ?? null, platformKey: 'mac-arm' },
    { label: t.hero.download.macOSIntel, href: release?.macIntel ?? null, platformKey: 'mac-intel' },
    { label: t.hero.download.windows, href: release?.windows ?? null, platformKey: 'win' },
    { label: t.hero.download.linux, href: release?.linux ?? null, platformKey: 'linux' },
  ];

  const sorted = [...buttons].sort((a, b) => {
    const aMatch = a.platformKey === platform;
    const bMatch = b.platformKey === platform;
    return aMatch === bMatch ? 0 : aMatch ? -1 : 1;
  });

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
          {release?.version ?? '...'}
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
        {sorted.map(({ label, href, platformKey }) => {
          return <DownloadButton key={platformKey} label={label} href={href} primary={platformKey === platform} />;
        })}
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
