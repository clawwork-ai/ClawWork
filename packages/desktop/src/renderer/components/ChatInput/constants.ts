import type { ModelCatalogEntry } from '@clawwork/shared';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_TEXT_TOTAL = 500 * 1024;
export const ACCEPTED_TYPES = 'image/png,image/jpeg,image/gif,image/webp';
export const GATEWAY_INJECTED_MODEL = 'gateway-injected';
export const EMPTY_MODELS_CATALOG: ModelCatalogEntry[] = [];

export const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'adaptive'] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

export const THINKING_LABEL_KEYS: Record<ThinkingLevel, string> = {
  off: 'chatInput.thinkingOff',
  minimal: 'chatInput.thinkingMinimal',
  low: 'chatInput.thinkingLow',
  medium: 'chatInput.thinkingMedium',
  high: 'chatInput.thinkingHigh',
  adaptive: 'chatInput.thinkingAdaptive',
};
