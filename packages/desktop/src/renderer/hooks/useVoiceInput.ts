import { useCallback, useEffect, type KeyboardEvent, type RefObject } from 'react';
import type { MainView } from '@clawwork/core';
import {
  insertTranscriptAtCaret,
  resolveVoicePressAction,
  shouldHandleVoiceHotkey,
} from '@/lib/voice/voice-input-utils';
import type {
  CreateVoiceSessionHandlers,
  VoiceErrorCode,
  VoicePermissionStatus,
  VoiceSession,
} from '@/lib/voice/types';
import { usePressHoldTiming } from '@/hooks/usePressHoldTiming';
import { useVoiceIntro } from '@/hooks/useVoiceIntro';
import { useVoiceSession } from '@/hooks/useVoiceSession';

export type { VoicePermissionStatus } from '@/lib/voice/types';

interface UseVoiceInputOptions {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  hasActiveTask: boolean;
  activeTaskKey?: string | null;
  mainView: MainView;
  settingsOpen: boolean;
  loadIntroSeen: () => Promise<boolean>;
  markIntroSeen: () => Promise<void>;
  requestPermission: () => Promise<VoicePermissionStatus>;
  createSession: (handlers: CreateVoiceSessionHandlers) => VoiceSession | null;
  pressHoldDelayMs?: number;
  isSupported?: boolean;
  onTextInserted?: () => void;
}

interface UseVoiceInputResult {
  isSupported: boolean;
  isListening: boolean;
  isTranscribing: boolean;
  isIntroOpen: boolean;
  interimTranscript: string;
  errorCode: VoiceErrorCode | null;
  handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleKeyUp: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  confirmIntro: () => Promise<void>;
  dismissIntro: () => void;
  startFromTrigger: () => Promise<void>;
  stopListening: () => void;
}

export function useVoiceInput({
  textareaRef,
  hasActiveTask,
  activeTaskKey,
  mainView,
  settingsOpen,
  loadIntroSeen,
  markIntroSeen,
  requestPermission,
  createSession,
  pressHoldDelayMs = 220,
  isSupported = true,
  onTextInserted,
}: UseVoiceInputOptions): UseVoiceInputResult {
  const { isIntroOpen, hasSeenIntro, openIntro, confirmIntro, dismissIntro } = useVoiceIntro({
    loadIntroSeen,
    markIntroSeen,
  });
  const { clearHoldTimer, beginPress, releasePress, resetPress, isPressActive, markStartedFromCurrentPress } =
    usePressHoldTiming(pressHoldDelayMs);

  const canStartAfterPermission = useCallback(
    (requiresActivePress: boolean) => !requiresActivePress || isPressActive(),
    [isPressActive],
  );

  const handleSessionStarted = useCallback(
    (requiresActivePress: boolean) => {
      markStartedFromCurrentPress(requiresActivePress);
    },
    [markStartedFromCurrentPress],
  );

  const insertIntoTextarea = useCallback(
    (transcript: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const result = insertTranscriptAtCaret({
        value: textarea.value,
        selectionStart: textarea.selectionStart ?? textarea.value.length,
        selectionEnd: textarea.selectionEnd ?? textarea.value.length,
        transcript,
      });

      textarea.value = result.value;
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      onTextInserted?.();
    },
    [textareaRef, onTextInserted],
  );

  const insertLiteralSpace = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selectionStart = textarea.selectionStart ?? textarea.value.length;
    const selectionEnd = textarea.selectionEnd ?? textarea.value.length;
    const nextValue = `${textarea.value.slice(0, selectionStart)} ${textarea.value.slice(selectionEnd)}`;
    const nextCaret = selectionStart + 1;
    textarea.value = nextValue;
    textarea.setSelectionRange(nextCaret, nextCaret);
    textarea.focus();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    onTextInserted?.();
  }, [textareaRef, onTextInserted]);

  const {
    isListening,
    isTranscribing,
    interimTranscript,
    errorCode,
    beginListening,
    stopListening,
    cleanup,
    isListeningActive,
    reportUnsupported,
  } = useVoiceSession({
    isSupported,
    requestPermission,
    createSession,
    canStartAfterPermission,
    onSessionStarted: handleSessionStarted,
    onFinalTranscript: insertIntoTextarea,
  });

  const handleLongPress = useCallback(() => {
    if (!hasSeenIntro()) {
      openIntro();
      return;
    }
    void beginListening(true);
  }, [beginListening, hasSeenIntro, openIntro]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === ' ' && isPressActive()) {
        event.preventDefault();
        return;
      }
      if (!isSupported) return;
      if (
        !shouldHandleVoiceHotkey({
          key: event.key,
          repeat: event.repeat,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          isComposing: event.nativeEvent.isComposing,
          hasActiveTask,
          mainView,
          settingsOpen,
        })
      ) {
        return;
      }

      event.preventDefault();
      beginPress(handleLongPress);
    },
    [beginPress, handleLongPress, hasActiveTask, isPressActive, isSupported, mainView, settingsOpen],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== ' ') return;
      const { pressDuration, startedFromCurrentPress } = releasePress();
      if (pressDuration == null) return;

      event.preventDefault();
      if (isListeningActive() || startedFromCurrentPress) {
        stopListening();
        return;
      }

      if (resolveVoicePressAction(pressDuration, pressHoldDelayMs) === 'insert-space') {
        insertLiteralSpace();
      }
    },
    [insertLiteralSpace, isListeningActive, pressHoldDelayMs, releasePress, stopListening],
  );

  const startFromTrigger = useCallback(async () => {
    if (!hasActiveTask || mainView !== 'chat' || settingsOpen) return;
    if (!isSupported) {
      reportUnsupported();
      return;
    }
    if (!hasSeenIntro()) {
      openIntro();
      return;
    }
    await beginListening(false);
  }, [beginListening, hasActiveTask, hasSeenIntro, isSupported, mainView, openIntro, reportUnsupported, settingsOpen]);

  useEffect(() => {
    if (!isListening) return;
    const onWindowKeyUp = (event: globalThis.KeyboardEvent): void => {
      if (event.key !== ' ') return;
      if (!isListeningActive()) return;
      event.preventDefault();
      resetPress();
      stopListening();
    };
    window.addEventListener('keyup', onWindowKeyUp);
    return () => window.removeEventListener('keyup', onWindowKeyUp);
  }, [isListening, isListeningActive, resetPress, stopListening]);

  useEffect(() => {
    if (!hasActiveTask || mainView !== 'chat' || settingsOpen) {
      clearHoldTimer();
      stopListening();
    }
  }, [activeTaskKey, clearHoldTimer, hasActiveTask, mainView, settingsOpen, stopListening]);

  useEffect(() => {
    return () => {
      clearHoldTimer();
      cleanup();
    };
  }, [cleanup, clearHoldTimer]);

  return {
    isSupported,
    isListening,
    isTranscribing,
    isIntroOpen,
    interimTranscript,
    errorCode,
    handleKeyDown,
    handleKeyUp,
    confirmIntro,
    dismissIntro,
    startFromTrigger,
    stopListening,
  };
}
