import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveTurn } from '@clawwork/core';
import { ToolCallCard } from './ToolCallCard';
import { Bot } from 'lucide-react';

const MarkdownContent = lazy(() => import('./MarkdownContent').then((m) => ({ default: m.MarkdownContent })));

interface StreamingMessageProps {
  turn: ActiveTurn;
}

export function StreamingMessage({ turn }: StreamingMessageProps) {
  const { t } = useTranslation();
  const text = turn.streamingText || turn.content;

  return (
    <div className="mb-4" role="article" aria-label={t('chat.assistantMessage', { defaultValue: 'Assistant message' })}>
      <div className="mb-1 flex items-center gap-2">
        <Bot size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
        <span className="type-support font-medium" style={{ color: 'var(--text-muted)' }}>
          {t('chat.assistant', { defaultValue: 'Assistant' })}
        </span>
        {!turn.finalized && (
          <div
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ backgroundColor: 'var(--accent)' }}
            aria-hidden="true"
          />
        )}
      </div>

      <div aria-live="polite" aria-atomic="false">
        {text && (
          <div className="prose-chat pl-5 type-body">
            <Suspense fallback={<p className="whitespace-pre-wrap">{text}</p>}>
              <MarkdownContent content={text} />
            </Suspense>
          </div>
        )}
      </div>

      {turn.toolCalls.length > 0 && (
        <div className="mt-2 space-y-1 pl-5">
          {turn.toolCalls.map((tc) => (
            <ToolCallCard key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}
    </div>
  );
}
