import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVoiceIntroOptions {
  loadIntroSeen: () => Promise<boolean>;
  markIntroSeen: () => Promise<void>;
}

interface UseVoiceIntroResult {
  isIntroOpen: boolean;
  hasSeenIntro: () => boolean;
  openIntro: () => void;
  confirmIntro: () => Promise<void>;
  dismissIntro: () => void;
}

export function useVoiceIntro({ loadIntroSeen, markIntroSeen }: UseVoiceIntroOptions): UseVoiceIntroResult {
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const introSeenRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadIntroSeen()
      .then((seen) => {
        if (cancelled) return;
        introSeenRef.current = seen;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('[voice-input] Failed to load intro seen state', error);
        introSeenRef.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, [loadIntroSeen]);

  const hasSeenIntro = useCallback(() => introSeenRef.current, []);

  const openIntro = useCallback(() => {
    setIsIntroOpen(true);
  }, []);

  const confirmIntro = useCallback(async () => {
    await markIntroSeen();
    introSeenRef.current = true;
    setIsIntroOpen(false);
  }, [markIntroSeen]);

  const dismissIntro = useCallback(() => {
    setIsIntroOpen(false);
  }, []);

  return {
    isIntroOpen,
    hasSeenIntro,
    openIntro,
    confirmIntro,
    dismissIntro,
  };
}
