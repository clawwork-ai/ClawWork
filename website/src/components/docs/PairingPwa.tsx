import { useI18n } from '../../i18n/context';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2
        style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
          fontSize: '20px',
          fontWeight: 600,
          color: '#f3f4f4',
          margin: '0 0 16px 0',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {steps.map((step, i) => (
        <li key={i} style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7 }}>
          {step}
        </li>
      ))}
    </ol>
  );
}

export function PairingPwa() {
  const { t } = useI18n();
  const d = t.docs.pairingPwa;

  return (
    <article>
      <h1
        style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
          fontSize: '28px',
          fontWeight: 700,
          color: '#f3f4f4',
          margin: '0 0 16px 0',
        }}
      >
        {d.title}
      </h1>
      <p style={{ fontSize: '16px', color: '#9ca3af', lineHeight: 1.7, marginBottom: '40px' }}>{d.intro}</p>

      <Section title={d.whatIsPwaTitle}>
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7, margin: 0 }}>{d.whatIsPwaContent}</p>
      </Section>

      <Section title={d.installTitle}>
        <StepList steps={d.installSteps} />
      </Section>

      <Section title={d.connectTitle}>
        <StepList steps={d.connectSteps} />
      </Section>

      <Section title={d.pairingTitle}>
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7, margin: '0 0 12px 0' }}>{d.pairingDesc}</p>
        <StepList steps={d.pairingSteps} />
      </Section>

      <Section title={d.tipsTitle}>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {d.tips.map((tip, i) => (
            <li key={i} style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7 }}>
              {tip}
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
