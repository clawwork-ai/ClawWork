import { Download } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { useRepoInfo, REPO, detectPlatform } from '../hooks/useLatestRelease';

const platform = detectPlatform();

interface DownloadButtonProps {
  label: string;
  href: string | null;
  primary: boolean;
}

function DownloadButton({ label, href, primary }: DownloadButtonProps) {
  return (
    <a
      href={href ?? `https://github.com/${REPO}/releases/latest`}
      target="_blank"
      rel="noopener noreferrer"
      className={`mono ${primary ? 'download-primary' : 'download-btn'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        padding: '8px 18px',
        borderRadius: '6px',
      }}
    >
      <Download size={14} />
      {label}
    </a>
  );
}

export function Hero() {
  const { t } = useI18n();
  const info = useRepoInfo();

  const buttons: { label: string; href: string | null; platformKey: string }[] = [
    { label: t.hero.download.macOS, href: info?.macARM ?? null, platformKey: 'mac-arm' },
    { label: t.hero.download.macOSIntel, href: info?.macIntel ?? null, platformKey: 'mac-intel' },
    { label: t.hero.download.windows, href: info?.windows ?? null, platformKey: 'win' },
    { label: t.hero.download.linux, href: info?.linux ?? null, platformKey: 'linux' },
  ];

  const sorted = [...buttons].sort((a, b) => {
    if (a.platformKey === platform) return -1;
    if (b.platformKey === platform) return 1;
    return 0;
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
        className="version-pill"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '20px',
          padding: '4px 14px',
          marginBottom: '32px',
          textDecoration: 'none',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            background: 'var(--color-accent)',
            borderRadius: '50%',
            display: 'inline-block',
          }}
        />
        <span className="mono" style={{ fontSize: '12px', color: 'var(--color-accent)' }}>
          {info?.version ?? '...'}
        </span>
      </a>

      <h1
        className="mono"
        style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
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
          color: 'var(--color-text-secondary)',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: '1.7',
        }}
      >
        {t.hero.tagline}
      </p>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {sorted.map(({ label, href, platformKey }) => (
          <DownloadButton key={platformKey} label={label} href={href} primary={platformKey === platform} />
        ))}
      </div>

      <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        <img
          src={`${import.meta.env.BASE_URL}screenshot.png`}
          alt="ClawWork Desktop"
          style={{
            flex: '1 1 0',
            minWidth: 0,
            maxWidth: '780px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          }}
        />
        <img
          src={`${import.meta.env.BASE_URL}screenshot-mobile.png`}
          alt="ClawWork PWA"
          style={{
            flex: '0 0 auto',
            height: '420px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          }}
        />
      </div>
    </section>
  );
}
