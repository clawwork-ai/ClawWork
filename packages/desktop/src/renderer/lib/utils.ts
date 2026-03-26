import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import i18n from '../i18n';
import { getLanguageConfig } from '../i18n/languages';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

function getRtf(): Intl.RelativeTimeFormat {
  return new Intl.RelativeTimeFormat(getLanguageConfig(i18n.language).intlLocale, { numeric: 'auto' });
}

export function formatRelativeTime(date: Date): string {
  const diff = date.getTime() - Date.now();
  const rtf = getRtf();
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return i18n.t('common.justNow');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTokenCount(tokens: number): string {
  if (tokens < 1_000) return String(tokens);
  if (tokens < 1_000_000) return `${(tokens / 1_000).toFixed(tokens < 100_000 ? 1 : 0)}K`;
  if (tokens < 1_000_000_000) return `${(tokens / 1_000_000).toFixed(tokens < 100_000_000 ? 1 : 0)}M`;
  return `${(tokens / 1_000_000_000).toFixed(1)}B`;
}

export function formatCost(usd: number): string {
  if (usd === 0) return '$0';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

const isMac = navigator.platform.toUpperCase().includes('MAC');

export const modKey = isMac ? '⌘' : 'Ctrl';
