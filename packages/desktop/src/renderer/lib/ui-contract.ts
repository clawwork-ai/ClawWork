export type ThemeMode = 'light' | 'dark' | 'system';
export type SurfaceKind = 'page' | 'panel' | 'card' | 'elevated' | 'floating' | 'dialog' | 'overlay';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type StatusKind = 'success' | 'warning' | 'error' | 'neutral' | 'accent';
export type DataColumnKind = 'text' | 'numeric' | 'status' | 'time' | 'action';

export const surfaceClass: Record<SurfaceKind, string> = {
  page: 'surface-page',
  panel: 'surface-panel',
  card: 'surface-card',
  elevated: 'surface-elevated',
  floating: 'surface-floating',
  dialog: 'surface-dialog',
  overlay: 'surface-overlay',
};
