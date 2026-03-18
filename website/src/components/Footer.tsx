import { useI18n } from '../i18n/context';

export function Footer() {
  const { t } = useI18n();
  const cols = [t.footer.product, t.footer.community, t.footer.resources];

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '48px 24px 32px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          {cols.map((col) => (
            <div key={col.title}>
              <h4
                style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f3f4f4',
                  margin: '0 0 16px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {col.title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {col.links.map((link) => (
                  <li key={link.label} style={{ marginBottom: '10px' }}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      style={{
                        fontSize: '14px',
                        color: '#9ca3af',
                        textDecoration: 'none',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = '#f3f4f4';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <img src="/logo.png" alt="ClawWork" style={{ width: '20px', height: '20px' }} />
          <span
            style={{
              fontSize: '13px',
              color: '#6b7280',
              fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
            }}
          >
            {t.footer.copyright}
          </span>
        </div>
      </div>
    </footer>
  );
}
