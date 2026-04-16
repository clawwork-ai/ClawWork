import type { ModelCatalogEntry } from '@clawwork/shared';

export const MAX_ATTACHMENT_SIZE = 100 * 1024 * 1024;
export const MAX_TEXT_TOTAL = 500 * 1024;
export const ACCEPTED_TYPES = [
  'image/*',
  '.txt,.md,.csv,.json,.xml,.yaml,.yml,.log',
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
  '.zip,.tar,.gz,.7z,.rar',
].join(',');
export const GATEWAY_INJECTED_MODEL = 'gateway-injected';
export const EMPTY_MODELS_CATALOG: ModelCatalogEntry[] = [];

export const MENTION_ALL_AGENT_ID = '__all__';

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
