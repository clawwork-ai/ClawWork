import { useI18n } from '../../i18n/context';
import { CodeBlock } from '../CodeBlock';

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

export function PairingGateway() {
  const { t } = useI18n();
  const d = t.docs.pairingGateway;

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

      <Section title={d.prereqTitle}>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {d.prereqItems.map((item, i) => (
            <li key={i} style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7 }}>
              {item}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '16px' }}>
          <CodeBlock code="openclaw gateway start" />
        </div>
      </Section>

      <Section title={d.addGatewayTitle}>
        <StepList steps={d.addGatewaySteps} />
      </Section>

      <Section title={d.tokenTitle}>
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7, margin: '0 0 12px 0' }}>{d.tokenDesc}</p>
        <StepList steps={d.tokenSteps} />
      </Section>

      <Section title={d.passwordTitle}>
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7, margin: '0 0 12px 0' }}>{d.passwordDesc}</p>
        <StepList steps={d.passwordSteps} />
      </Section>

      <Section title={d.pairingTitle}>
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7, margin: '0 0 12px 0' }}>{d.pairingDesc}</p>
        <StepList steps={d.pairingSteps} />
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(15, 253, 13, 0.06)',
            border: '1px solid rgba(15, 253, 13, 0.15)',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#9ca3af',
            lineHeight: 1.7,
          }}
        >
          {d.pairingNote}
        </div>
      </Section>

      <Section title={d.verifyTitle}>
        <StepList steps={d.verifySteps} />
      </Section>
    </article>
  );
}
