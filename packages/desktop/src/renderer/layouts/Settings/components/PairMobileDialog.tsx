import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const QR_EXPIRY_MS = 60_000;
const ED25519_SPKI_PREFIX_LENGTH = 12;

function base64Encode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function generateMobileIdentity(): Promise<{ id: string; pub: string; priv: string }> {
  const keyPair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const raw = new Uint8Array(spki).slice(ED25519_SPKI_PREFIX_LENGTH);
  const hash = await crypto.subtle.digest('SHA-256', raw);
  const hexChars: string[] = [];
  const view = new Uint8Array(hash);
  for (let i = 0; i < view.byteLength; i++) {
    hexChars.push(view[i]!.toString(16).padStart(2, '0'));
  }
  return {
    id: hexChars.join(''),
    pub: base64Encode(spki),
    priv: base64Encode(pkcs8),
  };
}

interface PairMobileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PairMobileDialog({ open, onOpenChange }: PairMobileDialogProps) {
  const { t } = useTranslation();
  const [qrData, setQrData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateQr = useCallback(async () => {
    try {
      setError(null);
      setQrData(null);

      const [identity, gateways] = await Promise.all([generateMobileIdentity(), window.clawwork.listGateways()]);

      const connectedGateways = gateways.filter((gw) => gw.connected);
      if (connectedGateways.length === 0) {
        setError(t('settings.pairNoGateways'));
        return;
      }

      const payload = {
        v: 1,
        d: identity,
        g: connectedGateways.map((gw) => {
          const wsUrl = gw.url.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
          return {
            u: wsUrl,
            t: gw.authMode === 'token' || !gw.authMode ? gw.token : undefined,
            p: gw.authMode === 'password' ? gw.password : undefined,
            c: gw.authMode === 'pairingCode' ? gw.pairingCode : undefined,
            m: gw.authMode ?? 'token',
            n: gw.name,
          };
        }),
      };

      setQrData(JSON.stringify(payload));

      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = setTimeout(() => {
        setQrData(null);
        setError(t('settings.pairExpired'));
      }, QR_EXPIRY_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.pairFailed'));
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      generateQr();
    } else {
      setQrData(null);
      setError(null);
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    }
    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };
  }, [open, generateQr]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone size={20} />
            {t('settings.pairMobile')}
          </DialogTitle>
          <DialogDescription>{t('settings.pairMobileDesc')}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col items-center gap-4">
          {qrData && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-qr-bg)' }}>
              <QRCodeSVG value={qrData} size={220} level="M" />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="type-body w-full rounded-lg px-4 py-3"
              style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          {qrData && (
            <p className="type-support text-center text-[var(--text-muted)]">{t('settings.pairInstruction')}</p>
          )}

          {!qrData && !error && (
            <div className="flex items-center justify-center" style={{ height: 220 }}>
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
              />
            </div>
          )}

          {error && (
            <button
              onClick={generateQr}
              className="type-label rounded-lg px-4"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-foreground)',
                minHeight: 36,
              }}
            >
              {t('settings.pairRetry')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
