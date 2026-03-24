import { useI18n } from '../i18n/context';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function Architecture() {
  const { t } = useI18n();
  const titleRef = useScrollReveal();
  const imgRef = useScrollReveal(120);

  return (
    <section id="architecture" style={{ padding: '80px 24px', background: '#111' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div ref={titleRef}>
          <h2
            style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
              fontSize: '28px',
              fontWeight: 700,
              color: '#f3f4f4',
              margin: '0 0 12px 0',
              textAlign: 'center',
            }}
          >
            {t.architecture.title}
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: '#9ca3af',
              textAlign: 'center',
              margin: '0 0 40px 0',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            {t.architecture.subtitle}
          </p>
        </div>
        <div ref={imgRef} style={{ textAlign: 'center' }}>
          <img
            src={`${import.meta.env.BASE_URL}architecture.svg`}
            alt="ClawWork Architecture"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '840px',
              margin: '0 auto',
              borderRadius: '12px',
            }}
          />
        </div>
      </div>
    </section>
  );
}
