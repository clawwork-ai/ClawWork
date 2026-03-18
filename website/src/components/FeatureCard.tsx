import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ Icon, title, description }: FeatureCardProps) {
  return (
    <div
      style={{
        background: '#1c1c1c',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '6px',
        padding: '24px',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(15, 253, 13, 0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          background: 'rgba(15, 253, 13, 0.08)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={20} color="#0ffd0d" />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono Variable", monospace)',
          fontSize: '15px',
          fontWeight: 600,
          color: '#f3f4f4',
          margin: '0 0 8px 0',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: '#9ca3af',
          margin: 0,
          lineHeight: '1.6',
        }}
      >
        {description}
      </p>
    </div>
  );
}
