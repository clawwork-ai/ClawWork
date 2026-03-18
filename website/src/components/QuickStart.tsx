import { useI18n } from '../i18n/context';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { CodeBlock } from './CodeBlock';

export function QuickStart() {
  const { t } = useI18n();
  const ref = useScrollReveal();

  return (
    <section id="quick-start" style={{ padding: '80px 24px', background: '#1a1a1a' }}>
      <div ref={ref} style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
            fontSize: '28px',
            fontWeight: 700,
            color: '#f3f4f4',
            margin: '0 0 48px 0',
            textAlign: 'center',
          }}
        >
          {t.quickStart.title}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {t.quickStart.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(15, 253, 13, 0.08)',
                  border: '1px solid rgba(15, 253, 13, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0ffd0d',
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#f3f4f4',
                    margin: '0 0 10px 0',
                    paddingTop: '4px',
                  }}
                >
                  {step.title}
                </p>
                {step.code && <CodeBlock code={step.code} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
