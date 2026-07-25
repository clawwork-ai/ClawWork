import { describe, expect, it } from 'vitest';
import {
  hasPreferencesShortcutConflict,
  isTextInputElement,
  resolveGlobalShortcutAction,
  shouldDeferGlobalShortcut,
} from '../src/lib/global-shortcuts.js';

function keyEvent(
  partial: Partial<KeyboardEvent> & Pick<KeyboardEvent, 'code'>,
  target: EventTarget | null = null,
): KeyboardEvent {
  return {
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    target,
    ...partial,
  } as KeyboardEvent;
}

function mockTextInput(): EventTarget {
  return {
    matches: () => true,
    closest: () => null,
  } as unknown as EventTarget;
}

function mockNonInput(): EventTarget {
  return {
    matches: () => false,
    closest: () => null,
  } as unknown as EventTarget;
}

const defaultConfig = {
  leftNavShortcut: 'Comma' as const,
  rightPanelShortcut: 'Period' as const,
};

describe('resolveGlobalShortcutAction', () => {
  it('does not bind Ctrl/Cmd+P', () => {
    expect(resolveGlobalShortcutAction(keyEvent({ ctrlKey: true, code: 'KeyP' }), defaultConfig)).toBeNull();
    expect(resolveGlobalShortcutAction(keyEvent({ metaKey: true, code: 'KeyP' }), defaultConfig)).toBeNull();
  });

  it('resolves built-in shortcuts', () => {
    expect(resolveGlobalShortcutAction(keyEvent({ metaKey: true, shiftKey: true, code: 'KeyO' }), defaultConfig)).toBe(
      'new-task',
    );
    expect(resolveGlobalShortcutAction(keyEvent({ metaKey: true, shiftKey: true, code: 'KeyF' }), defaultConfig)).toBe(
      'open-files',
    );
    expect(resolveGlobalShortcutAction(keyEvent({ metaKey: true, code: 'KeyK' }), defaultConfig)).toBe(
      'toggle-command-palette',
    );
  });

  it('respects configurable panel shortcuts', () => {
    expect(resolveGlobalShortcutAction(keyEvent({ metaKey: true, code: 'Comma' }), defaultConfig)).toBe(
      'toggle-left-nav',
    );
    expect(resolveGlobalShortcutAction(keyEvent({ metaKey: true, code: 'Period' }), defaultConfig)).toBe(
      'toggle-right-panel',
    );
  });

  it('skips panel shortcuts when set to None', () => {
    const disabled = { leftNavShortcut: 'None' as const, rightPanelShortcut: 'None' as const };
    expect(resolveGlobalShortcutAction(keyEvent({ metaKey: true, code: 'Comma' }), disabled)).toBeNull();
    expect(resolveGlobalShortcutAction(keyEvent({ metaKey: true, code: 'Period' }), disabled)).toBeNull();
  });
});

describe('shouldDeferGlobalShortcut', () => {
  it('defers panel shortcuts while typing in a text field', () => {
    expect(shouldDeferGlobalShortcut(keyEvent({ metaKey: true, code: 'Comma' }, mockTextInput()))).toBe(true);
  });

  it('still allows Cmd/Ctrl+K inside text fields', () => {
    expect(shouldDeferGlobalShortcut(keyEvent({ metaKey: true, code: 'KeyK' }, mockTextInput()))).toBe(false);
  });

  it('does not defer shortcuts outside text inputs', () => {
    expect(shouldDeferGlobalShortcut(keyEvent({ metaKey: true, code: 'Comma' }, mockNonInput()))).toBe(false);
  });

  it('defers Ctrl/Cmd+P inside text fields so print can pass through', () => {
    expect(shouldDeferGlobalShortcut(keyEvent({ ctrlKey: true, code: 'KeyP' }, mockTextInput()))).toBe(true);
  });
});

describe('isTextInputElement', () => {
  it('detects editable targets', () => {
    expect(isTextInputElement(mockTextInput())).toBe(true);
    expect(isTextInputElement(mockNonInput())).toBe(false);
  });
});

describe('hasPreferencesShortcutConflict', () => {
  it('flags Cmd+, on macOS', () => {
    expect(hasPreferencesShortcutConflict('Comma', 'darwin')).toBe(true);
    expect(hasPreferencesShortcutConflict('BracketLeft', 'darwin')).toBe(false);
    expect(hasPreferencesShortcutConflict('Comma', 'win32')).toBe(false);
  });
});
