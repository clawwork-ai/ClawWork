import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const IDEAL_WIDTH = 1280;
const IDEAL_HEIGHT = 720;
const FRAME_SIZE = 224;
const FRAME_RADIUS = 16;
const OVERLAY_ALPHA = 'var(--overlay-scrim)';

interface QrScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const stoppedRef = useRef(false);
  const [ready, setReady] = useState(false);

  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId = 0;
    stoppedRef.current = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onErrorRef.current?.(t('pairing.scannerUnsupported'));
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: IDEAL_WIDTH },
            height: { ideal: IDEAL_HEIGHT },
          },
          audio: false,
        });
      } catch (err) {
        onErrorRef.current?.(err instanceof Error ? err.message : t('pairing.cameraError'));
        return;
      }

      const video = videoRef.current;
      if (!video || stoppedRef.current) {
        stopTracks(stream);
        return;
      }

      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) {
          resolve();
          return;
        }
        video.addEventListener('loadedmetadata', () => resolve(), { once: true });
      });

      try {
        await video.play();
      } catch (err) {
        onErrorRef.current?.(err instanceof Error ? err.message : t('pairing.videoError'));
        return;
      }

      setReady(true);

      if ('BarcodeDetector' in window) {
        scanWithBarcodeDetector(video);
      } else {
        scanWithCanvas(video);
      }
    }

    function scanWithBarcodeDetector(video: HTMLVideoElement) {
      const BDCtor = (window as unknown as Record<string, unknown>)['BarcodeDetector'] as new (opts: {
        formats: string[];
      }) => {
        detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
      };
      const detector = new BDCtor({ formats: ['qr_code'] });
      let consecutiveErrors = 0;
      const MAX_CONSECUTIVE_ERRORS = 5;

      function tick() {
        if (stoppedRef.current) return;
        detector
          .detect(video)
          .then((codes) => {
            if (stoppedRef.current) return;
            consecutiveErrors = 0;
            if (codes.length > 0 && codes[0].rawValue) {
              stopTracks(stream);
              onScanRef.current(codes[0].rawValue);
              return;
            }
            rafId = requestAnimationFrame(tick);
          })
          .catch((err: unknown) => {
            if (stoppedRef.current) return;
            consecutiveErrors++;
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              onErrorRef.current?.(err instanceof Error ? err.message : t('pairing.scannerUnsupported'));
              return;
            }
            rafId = requestAnimationFrame(tick);
          });
      }
      rafId = requestAnimationFrame(tick);
    }

    function scanWithCanvas(video: HTMLVideoElement) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        onErrorRef.current?.(t('pairing.scannerUnsupported'));
        return;
      }

      let jsQR: typeof import('jsqr').default | null = null;

      import('jsqr')
        .then((m) => {
          jsQR = m.default;
        })
        .catch((err: unknown) => {
          onErrorRef.current?.(err instanceof Error ? err.message : t('pairing.scannerUnsupported'));
        });

      function tick() {
        if (stoppedRef.current) return;
        if (!jsQR || video.readyState < video.HAVE_ENOUGH_DATA) {
          rafId = requestAnimationFrame(tick);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        ctx!.drawImage(video, 0, 0);
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          stopTracks(stream);
          onScanRef.current(code.data);
          return;
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }

    start();

    return () => {
      stoppedRef.current = true;
      cancelAnimationFrame(rafId);
      if (stream) stopTracks(stream);
    };
  }, [t]);

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--bg-primary)' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label={t('qrScanner.videoLabel')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {ready && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            role="img"
            aria-label={t('qrScanner.scanFrameLabel')}
            style={{
              width: FRAME_SIZE,
              height: FRAME_SIZE,
              borderRadius: FRAME_RADIUS,
              border: '2px solid var(--accent)',
              boxShadow: `0 0 0 9999px ${OVERLAY_ALPHA}`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function stopTracks(stream: MediaStream | null) {
  if (stream) {
    for (const track of stream.getTracks()) track.stop();
  }
}
