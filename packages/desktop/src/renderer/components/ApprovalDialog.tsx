import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApprovalStore } from '../stores/approvalStore';

function RiskBadge({ security }: { security?: string | null }) {
  const { t } = useTranslation();
  if (security === 'full') {
    return (
      <span
        className="type-badge rounded px-1.5 py-0.5"
        style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
      >
        {t('approval.riskHigh')}
      </span>
    );
  }
  if (!security || security === 'allowlist') {
    return (
      <span
        className="type-badge rounded px-1.5 py-0.5"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
      >
        {t('approval.riskMedium')}
      </span>
    );
  }
  return null;
}

function Countdown({ expiresAtMs }: { expiresAtMs: number }) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(interval);
  }, [expiresAtMs]);

  const pct = Math.min(100, (remaining / 120) * 100);
  const color = remaining > 60 ? 'var(--accent)' : remaining > 20 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="space-y-1">
      <span className="type-support" style={{ color: 'var(--text-secondary)' }}>
        {t('approval.expiresIn', { seconds: remaining })}
      </span>
      <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function ApprovalDialog() {
  const { t } = useTranslation();
  const pendingApprovals = useApprovalStore((s) => s.pendingApprovals);
  const resolveApproval = useApprovalStore((s) => s.resolveApproval);
  const current = pendingApprovals[0];

  if (!current) return null;

  const { id, request, expiresAtMs } = current;

  return (
    <Dialog open modal>
      <DialogContent
        className="max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" style={{ color: 'var(--warning)' }} />
            {t('approval.title')}
            <RiskBadge security={request.security} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="type-meta mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {t('approval.command')}
            </p>
            <pre
              className="type-code-block overflow-x-auto rounded-lg px-3 py-2.5"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {request.command}
            </pre>
          </div>

          {(request.cwd || request.host) && (
            <div className="type-support flex flex-wrap gap-4" style={{ color: 'var(--text-secondary)' }}>
              {request.cwd && (
                <span>
                  <span className="font-medium">{t('approval.cwd')}: </span>
                  <span className="type-code-inline">{request.cwd}</span>
                </span>
              )}
              {request.host && (
                <span>
                  <span className="font-medium">{t('approval.host')}: </span>
                  <span className="type-code-inline">{request.host}</span>
                </span>
              )}
            </div>
          )}

          <Countdown expiresAtMs={expiresAtMs} />

          {pendingApprovals.length > 1 && (
            <p className="type-support" style={{ color: 'var(--text-secondary)' }}>
              {t('approval.queueMore', { count: pendingApprovals.length - 1 })}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <Button variant="danger" onClick={() => resolveApproval(id, 'deny')}>
            {t('approval.deny')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => resolveApproval(id, 'allow-always')}>
              {t('approval.allowAlways')}
            </Button>
            <Button
              onClick={() => resolveApproval(id, 'allow-once')}
              style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
            >
              {t('approval.allowOnce')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
