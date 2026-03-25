export type ThemeMode = 'light' | 'dark' | 'system';
export type TypographyRole =
  | 'title-lg'
  | 'title-md'
  | 'title-sm'
  | 'body-md'
  | 'body-sm'
  | 'label-md'
  | 'label-sm'
  | 'meta'
  | 'badge'
  | 'code-inline'
  | 'code-block';
export type SurfaceKind = 'page' | 'panel' | 'card' | 'elevated' | 'floating' | 'dialog' | 'overlay';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type StatusKind = 'success' | 'warning' | 'error' | 'neutral' | 'accent';
export type DataColumnKind = 'text' | 'numeric' | 'status' | 'time' | 'action';

export const typographyRoleClass: Record<TypographyRole, string> = {
  'title-lg': 'text-2xl font-semibold tracking-tight text-[var(--text-primary)]',
  'title-md': 'text-xl font-semibold tracking-tight text-[var(--text-primary)]',
  'title-sm': 'text-base font-semibold tracking-tight text-[var(--text-primary)]',
  'body-md': 'text-sm leading-6 text-[var(--text-primary)]',
  'body-sm': 'text-xs leading-5 text-[var(--text-secondary)]',
  'label-md': 'text-sm font-medium text-[var(--text-secondary)]',
  'label-sm': 'text-xs font-medium text-[var(--text-secondary)]',
  meta: 'text-2xs uppercase tracking-[0.08em] text-[var(--text-muted)]',
  badge: 'text-2xs font-semibold uppercase tracking-[0.08em]',
  'code-inline': 'font-mono text-xs text-[var(--text-secondary)]',
  'code-block': 'font-mono text-xs text-[var(--text-primary)]',
};

export const surfaceClass: Record<SurfaceKind, string> = {
  page: 'surface-page',
  panel: 'surface-panel',
  card: 'surface-card',
  elevated: 'surface-elevated',
  floating: 'surface-floating',
  dialog: 'surface-dialog',
  overlay: 'surface-overlay',
};
