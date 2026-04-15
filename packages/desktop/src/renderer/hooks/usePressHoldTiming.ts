import { useCallback, useRef } from 'react';

interface PressReleaseResult {
  pressDuration: number | null;
  startedFromCurrentPress: boolean;
}

interface UsePressHoldTimingResult {
  clearHoldTimer: () => void;
  beginPress: (onLongPress: () => void) => void;
  releasePress: () => PressReleaseResult;
  resetPress: () => void;
  isPressActive: () => boolean;
  markStartedFromCurrentPress: (started: boolean) => void;
}

export function usePressHoldTiming(delayMs: number): UsePressHoldTimingResult {
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartedAtRef = useRef<number | null>(null);
  const pressActiveRef = useRef(false);
  const startedFromCurrentPressRef = useRef(false);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current != null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const beginPress = useCallback(
    (onLongPress: () => void) => {
      clearHoldTimer();
      pressActiveRef.current = true;
      pressStartedAtRef.current = Date.now();
      startedFromCurrentPressRef.current = false;
      holdTimerRef.current = setTimeout(() => {
        clearHoldTimer();
        onLongPress();
      }, delayMs);
    },
    [clearHoldTimer, delayMs],
  );

  const releasePress = useCallback((): PressReleaseResult => {
    if (pressStartedAtRef.current == null) {
      return { pressDuration: null, startedFromCurrentPress: startedFromCurrentPressRef.current };
    }

    const pressDuration = Date.now() - pressStartedAtRef.current;
    const startedFromCurrentPress = startedFromCurrentPressRef.current;
    pressStartedAtRef.current = null;
    pressActiveRef.current = false;
    clearHoldTimer();

    return { pressDuration, startedFromCurrentPress };
  }, [clearHoldTimer]);

  const resetPress = useCallback(() => {
    pressStartedAtRef.current = null;
    pressActiveRef.current = false;
    clearHoldTimer();
  }, [clearHoldTimer]);

  const isPressActive = useCallback(() => pressActiveRef.current, []);

  const markStartedFromCurrentPress = useCallback((started: boolean) => {
    startedFromCurrentPressRef.current = started;
  }, []);

  return {
    clearHoldTimer,
    beginPress,
    releasePress,
    resetPress,
    isPressActive,
    markStartedFromCurrentPress,
  };
}
