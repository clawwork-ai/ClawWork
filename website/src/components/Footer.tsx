import { useI18n } from '../i18n/context';

interface FooterProps {
  navigate: (to: string) => void;
}

export function Footer({ navigate }: FooterProps) {
  const { t } = useI18n();
  const cols = [t.footer.product, t.footer.community, t.footer.resources];

  const isExternal = (href: string) => href.startsWith('http');
  const isAnchor = (href: string) => href.startsWith('#');

  const handleClick = (e: React.MouseEvent, href: string) => {
    if (!isExternal(href) && !isAnchor(href)) {
      e.preventDefault();
      navigate(href);
    }
  };

  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', padding: '48px 24px 32px' }}>
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
                className="mono"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
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
                      href={isExternal(link.href) ? link.href : `${import.meta.env.BASE_URL}${link.href}`}
                      target={isExternal(link.href) ? '_blank' : undefined}
                      rel={isExternal(link.href) ? 'noopener noreferrer' : undefined}
                      onClick={(e) => handleClick(e, link.href)}
                      className="link"
                      style={{ fontSize: '14px' }}
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
            borderTop: '1px solid var(--color-border)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="ClawWork" style={{ width: '20px', height: '20px' }} />
          <span className="mono" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {t.footer.copyright}
          </span>
        </div>
      </div>
    </footer>
  );
}
