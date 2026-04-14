import { useTranslation } from 'react-i18next';
import type { ClawProfileData } from '@clawwork/shared';

interface HeroCardProps {
  data: ClawProfileData;
}

export default function HeroCard({ data }: HeroCardProps) {
  const { t } = useTranslation();

  return (
    <div
      data-theme="dark"
      className="relative flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl p-8 shadow-[var(--shadow-floating)]"
      style={{
        aspectRatio: '4 / 5',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'var(--ambient-orb-1), var(--ambient-orb-2)',
        }}
      />

      <div className="relative flex h-full flex-col justify-between">
        <div className="type-support uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          {t('dashboard.heading')}
        </div>

        <div className="flex flex-col items-start gap-1">
          <div className="text-7xl font-bold leading-none text-[var(--accent)]">{data.totalTasks}</div>
          <div className="type-body text-[var(--text-muted)]">{t('dashboard.tasks')}</div>
        </div>

        <div className="flex flex-col gap-3">
          {data.signatureSkill && (
            <div>
              <div className="type-meta text-[var(--text-muted)]">✦ {t('dashboard.signatureSkill')}</div>
              <div className="type-body mt-0.5 text-[var(--text-primary)]">{data.signatureSkill.name}</div>
            </div>
          )}
          {data.mvpAgent && (
            <div>
              <div className="type-meta text-[var(--text-muted)]">◇ {t('dashboard.mvpAgent')}</div>
              <div className="type-body mt-0.5 text-[var(--text-primary)]">{data.mvpAgent.agentId}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
