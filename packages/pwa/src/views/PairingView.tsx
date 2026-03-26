import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const QrScanner = lazy(() => import('../components/QrScanner').then((m) => ({ default: m.QrScanner })));

const ERROR_AUTO_CLEAR_MS = 5000;

interface PairingViewProps {
  onPaired: () => void;
}

export function PairingView({ onPaired }: PairingViewProps) {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pairingRef = useRef(false);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), ERROR_AUTO_CLEAR_MS);
    return () => clearTimeout(timer);
  }, [error]);

  const handleScanResult = useCallback(
    async (data: string) => {
      if (pairingRef.current) return;
      pairingRef.current = true;
      try {
        const { parseQrPayload } = await import('../lib/qr-decode');
        const payload = parseQrPayload(data);

        const { saveIdentity, saveGateway, saveScopeId, clearAll } = await import('../persistence/db');
        await clearAll();
        const { exportDeviceIdentity, generateDeviceIdentity } = await import('../gateway/device-identity');
        const identity = await generateDeviceIdentity();
        const record = await exportDeviceIdentity(identity);
        await saveIdentity(record);

        if (payload.s) {
          await saveScopeId(payload.s);
        }

        for (const gw of payload.g) {
          await saveGateway({
            id: crypto.randomUUID(),
            name: gw.n,
            url: gw.u,
            token: gw.m === 'token' || !gw.m ? gw.t : undefined,
            password: gw.m === 'password' ? gw.p : undefined,
            pairingCode: gw.m === 'pairingCode' ? gw.c : undefined,
            authMode: gw.m ?? 'token',
          });
        }

        setScanning(false);
        onPaired();
      } catch (e) {
        pairingRef.current = false;
        setError(e instanceof Error ? e.message : t('pairing.invalidQr'));
        setScanning(false);
      }
    },
    [onPaired, t],
  );

  if (scanning) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-primary)' }}>
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
              {t('pairing.loadingCamera')}
            </div>
          }
        >
          <QrScanner onScan={handleScanResult} onError={(msg) => setError(msg)} />
        </Suspense>
        <div className="safe-area-top" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setScanning(false)}
              aria-label={t('pairing.cancelButton')}
              className="type-label rounded-lg px-3"
              style={{
                color: 'var(--accent)',
                backgroundColor: 'var(--overlay-scrim)',
                borderRadius: 8,
                minHeight: 44,
                minWidth: 44,
              }}
            >
              {t('pairing.cancelButton')}
            </button>
          </div>
        </div>
        {error && (
          <div
            className="type-body rounded-lg px-4 py-3"
            role="alert"
            style={{
              position: 'absolute',
              bottom: 'env(safe-area-inset-bottom, 40px)',
              left: 16,
              right: 16,
              zIndex: 10,
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="safe-area-top safe-area-bottom flex h-full flex-col items-center justify-center px-8"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <img src="/icons/logo.png" alt="ClawWork" className="mb-6 h-20 w-20" />
      <h1 className="type-page-title mb-2" style={{ color: 'var(--text-primary)' }}>
        ClawWork
      </h1>
      <p className="mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>
        {t('pairing.subtitle')}
      </p>
      <p className="type-body mb-8 max-w-sm text-center" style={{ color: 'var(--text-muted)' }}>
        {t('pairing.instruction')}
      </p>

      {error && (
        <div
          className="type-body mb-4 w-full max-w-sm rounded-lg px-4 py-3"
          style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        onClick={() => {
          setError(null);
          setScanning(true);
        }}
        aria-label={t('pairing.scanButton')}
        className="type-section-title flex items-center gap-2 rounded-xl px-8 transition-colors"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-foreground)',
          minHeight: 52,
        }}
      >
        <ScanLine size={24} />
        {t('pairing.scanButton')}
      </button>
    </div>
  );
}
