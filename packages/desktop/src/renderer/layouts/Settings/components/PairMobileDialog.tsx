import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/uiStore';

interface QrPayload {
  v: 1;
  s?: string;
  g: {
    u: string;
    n: string;
    t?: string;
    p?: string;
    c?: string;
    m?: 'token' | 'password' | 'pairingCode';
  }[];
}

const QR_TTL_SECONDS = 60;

export default function PairMobileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const gatewayStatusMap = useUiStore((s) => s.gatewayStatusMap);

  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [generating, setGenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gatewayEntries = useMemo(() => Object.entries(gatewayInfoMap), [gatewayInfoMap]);

  useEffect(() => {
    if (!open) return;
    const firstConnectedId = Object.entries(gatewayStatusMap).find(([, s]) => s === 'connected')?.[0] ?? null;
    const firstGatewayId = gatewayEntries[0]?.[0] ?? null;
    setSelectedGatewayId(firstConnectedId ?? firstGatewayId);
    setQrData(null);
    setCountdown(0);
    setGenerating(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [open, gatewayStatusMap, gatewayEntries]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedGatewayId) return;
    setGenerating(true);

    try {
      const settings = await window.clawwork.getSettings();
      if (!settings) return;

      const deviceId = await window.clawwork.getDeviceId();
      const payload: QrPayload = { v: 1, s: deviceId, g: [] };

      const cfg = settings.gateways.find((g: { id: string }) => g.id === selectedGatewayId);
      if (!cfg) return;

      const mode: 'token' | 'password' | 'pairingCode' =
        cfg.authMode ?? (cfg.pairingCode ? 'pairingCode' : cfg.password ? 'password' : 'token');
      payload.g.push({
        u: cfg.url.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:'),
        t: mode === 'token' ? (cfg.token ?? '') : undefined,
        p: mode === 'password' ? cfg.password : undefined,
        c: mode === 'pairingCode' ? cfg.pairingCode : undefined,
        m: mode,
        n: cfg.name,
      });

      setQrData(JSON.stringify(payload));
      setCountdown(QR_TTL_SECONDS);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setQrData(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setGenerating(false);
    }
  }, [selectedGatewayId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone size={18} />
            {t('settings.pairMobile')}
          </DialogTitle>
          <DialogDescription>{t('settings.pairMobileDesc')}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 type-label text-[var(--text-primary)]">{t('settings.pairSelectGateways')}</p>
            <div className="space-y-2">
              {gatewayEntries.length === 0 && (
                <p className="type-body text-[var(--text-muted)]">{t('settings.noGateways')}</p>
              )}
              {gatewayEntries.map(([id, info]) => {
                const status = gatewayStatusMap[id] ?? 'disconnected';
                return (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <input
                      type="radio"
                      name="pair-mobile-gateway"
                      checked={selectedGatewayId === id}
                      onChange={() => setSelectedGatewayId(id)}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className="flex-1 truncate type-body text-[var(--text-primary)]">{info.name}</span>
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${
                        status === 'connected'
                          ? 'bg-[var(--accent)]'
                          : status === 'connecting'
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--text-muted)]'
                      }`}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {qrData ? (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--surface-qr-bg)' }}>
                <QRCodeSVG value={qrData} size={280} level="L" />
              </div>
              <p className="type-body text-[var(--text-muted)]">
                {t('settings.pairExpiresIn', { seconds: countdown })}
              </p>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={!selectedGatewayId || generating} className="w-full">
              {generating ? <Loader2 size={16} className="animate-spin" /> : t('settings.pairGenerate')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
