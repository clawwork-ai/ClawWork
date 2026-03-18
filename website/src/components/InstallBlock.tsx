import { useI18n } from '../i18n/context';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { CodeBlock } from './CodeBlock';

export function InstallBlock() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <div ref={ref}>
      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px 80px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
            fontSize: '24px',
            fontWeight: 600,
            color: '#f3f4f4',
            margin: '0 0 24px 0',
          }}
        >
          {t.install.title}
        </h2>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <CodeBlock code={'brew tap clawwork-ai/clawwork\nbrew install --cask clawwork'} />
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>
            {t.install.orDownload}{' '}
            <a
              href="https://github.com/clawwork-ai/clawwork/releases"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#0ffd0d',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(15, 253, 13, 0.3)',
              }}
            >
              {t.install.githubReleases}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
