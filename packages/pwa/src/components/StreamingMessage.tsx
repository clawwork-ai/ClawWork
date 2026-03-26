import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveTurn } from '@clawwork/core';
import { ToolCallCard } from './ToolCallCard';

const MarkdownContent = lazy(() => import('./MarkdownContent').then((m) => ({ default: m.MarkdownContent })));

interface StreamingMessageProps {
  turn: ActiveTurn;
}

export function StreamingMessage({ turn }: StreamingMessageProps) {
  const { t } = useTranslation();
  const text = turn.streamingText || turn.content;

  return (
    <div className="mb-4" role="article" aria-label={t('chat.assistantMessage', { defaultValue: 'Assistant message' })}>
      {!text && !turn.finalized && (
        <div className="flex items-center gap-1.5 py-3" aria-label={t('chat.thinking')}>
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
          <div
            className="h-2 w-2 animate-pulse rounded-full"
            style={{ backgroundColor: 'var(--text-muted)', animationDelay: '150ms' }}
          />
          <div
            className="h-2 w-2 animate-pulse rounded-full"
            style={{ backgroundColor: 'var(--text-muted)', animationDelay: '300ms' }}
          />
        </div>
      )}

      <div aria-live="polite" aria-atomic="false">
        {text && (
          <div className="prose-chat type-body">
            <Suspense fallback={<p className="whitespace-pre-wrap">{text}</p>}>
              <MarkdownContent content={text} />
            </Suspense>
            {!turn.finalized && (
              <span
                className="ml-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full align-middle"
                style={{ backgroundColor: 'var(--accent)' }}
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </div>

      {turn.toolCalls.length > 0 && (
        <div className="mt-2 space-y-1">
          {turn.toolCalls.map((tc) => (
            <ToolCallCard key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}
    </div>
  );
}
