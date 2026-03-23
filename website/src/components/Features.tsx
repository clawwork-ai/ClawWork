import { Layers, Columns3, HardDrive, Search, Eye, Network } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { FeatureCard } from './FeatureCard';

const ICONS: LucideIcon[] = [Layers, Columns3, HardDrive, Search, Eye, Network];

function RevealCard({
  delay,
  Icon,
  title,
  description,
}: {
  delay: number;
  Icon: LucideIcon;
  title: string;
  description: string;
}) {
  const ref = useScrollReveal(delay);
  return (
    <div ref={ref}>
      <FeatureCard Icon={Icon} title={title} description={description} />
    </div>
  );
}

export function Features() {
  const { t } = useI18n();
  const titleRef = useScrollReveal();

  return (
    <section id="features" style={{ padding: '80px 24px', background: '#1a1a1a' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div ref={titleRef}>
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
            {t.features.title}
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {t.features.items.map((item, i) => (
            <RevealCard key={i} delay={i * 80} Icon={ICONS[i]} title={item.title} description={item.description} />
          ))}
        </div>
      </div>
    </section>
  );
}
