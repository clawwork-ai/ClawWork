import type { AppError, ErrorSource, ErrorStage, Retryable } from '@clawwork/shared';
import { RETRYABLE_ERROR_CODES, NON_RETRYABLE_ERROR_CODES } from '@clawwork/shared';

function classifyRetryable(code?: string): Retryable {
  if (!code) return 'unknown';
  if (RETRYABLE_ERROR_CODES.has(code)) return 'yes';
  if (NON_RETRYABLE_ERROR_CODES.has(code)) return 'no';
  return 'unknown';
}

export function buildAppError(opts: {
  source: ErrorSource;
  stage: ErrorStage;
  rawMessage: string;
  code?: string;
  details?: Record<string, unknown>;
}): AppError {
  return {
    source: opts.source,
    stage: opts.stage,
    code: opts.code,
    rawMessage: opts.rawMessage,
    details: opts.details,
    retryable: classifyRetryable(opts.code),
  };
}

export type TranslateFn = (key: string, opts?: Record<string, unknown>) => string;

export function formatErrorForUser(err: AppError, t: TranslateFn): string {
  const stageLabel = t(`errors.stage.${err.stage}`, { defaultValue: err.stage });
  if (err.rawMessage) return `${stageLabel}: ${err.rawMessage}`;
  if (err.code) return `${stageLabel}: [${err.code}]`;
  return `${stageLabel}: ${t('errors.unknown', { defaultValue: 'Unknown error' })}`;
}

export function formatErrorForToast(err: AppError, t: TranslateFn): { title: string; description: string } {
  const stageKey = `errors.stage.${err.stage}`;
  const stageLabel = t(stageKey, { defaultValue: err.stage });
  const title = `${stageLabel} ${t('errors.failed', { defaultValue: 'failed' })}`;
  const description = err.rawMessage || err.code || t('errors.unknown', { defaultValue: 'Unknown error' });
  return { title, description };
}
