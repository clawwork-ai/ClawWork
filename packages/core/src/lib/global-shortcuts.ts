import type { PanelShortcutLeft, PanelShortcutRight } from '../stores/ui-store.js';

export type GlobalShortcutAction =
  | 'new-task'
  | 'open-files'
  | 'toggle-command-palette'
  | 'toggle-left-nav'
  | 'toggle-right-panel';

export interface GlobalShortcutConfig {
  leftNavShortcut: PanelShortcutLeft;
  rightPanelShortcut: PanelShortcutRight;
}

const TEXT_INPUT_SELECTOR =
  'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=reset]), textarea, select, [contenteditable=""], [contenteditable="true"]';

type SelectorCapableElement = EventTarget & {
  matches: (selector: string) => boolean;
  closest: (selector: string) => Element | null;
};

function isElementWithSelectorSupport(target: EventTarget | null): target is SelectorCapableElement {
  return (
    typeof target === 'object' &&
    target !== null &&
    'matches' in target &&
    typeof (target as { matches?: unknown }).matches === 'function' &&
    'closest' in target &&
    typeof (target as { closest?: unknown }).closest === 'function'
  );
}

export function isTextInputElement(target: EventTarget | null): boolean {
  if (!isElementWithSelectorSupport(target)) return false;
  if (target.matches(TEXT_INPUT_SELECTOR)) return true;
  return Boolean(target.closest('[contenteditable="true"], [contenteditable=""]'));
}

export function shouldDeferGlobalShortcut(
  event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'code' | 'target'>,
): boolean {
  if (!isTextInputElement(event.target)) return false;
  const meta = event.metaKey || event.ctrlKey;
  if (meta && !event.shiftKey && event.code === 'KeyK') return false;
  return true;
}

export function resolveGlobalShortcutAction(
  event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'code'>,
  config: GlobalShortcutConfig,
): GlobalShortcutAction | null {
  const meta = event.metaKey || event.ctrlKey;
  if (!meta) return null;

  if (event.shiftKey && event.code === 'KeyO') return 'new-task';
  if (event.shiftKey && event.code === 'KeyF') return 'open-files';
  if (!event.shiftKey && event.code === 'KeyK') return 'toggle-command-palette';

  if (!event.shiftKey && config.leftNavShortcut !== 'None' && event.code === config.leftNavShortcut) {
    return 'toggle-left-nav';
  }

  if (!event.shiftKey && config.rightPanelShortcut !== 'None' && event.code === config.rightPanelShortcut) {
    return 'toggle-right-panel';
  }

  return null;
}

export function hasPreferencesShortcutConflict(leftNavShortcut: PanelShortcutLeft, platform: string): boolean {
  return platform === 'darwin' && leftNavShortcut === 'Comma';
}
