import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { Message } from '@clawwork/shared';
import { ToolCallCard } from './ToolCallCard';
import { AlertCircle } from 'lucide-react';

const MarkdownContent = lazy(() => import('./MarkdownContent').then((m) => ({ default: m.MarkdownContent })));

interface ChatMessageProps {
  message: Message;
}

function MarkdownFallback({ content }: { content: string }) {
  return (
    <p className="whitespace-pre-wrap type-body" style={{ color: 'var(--text-primary)' }}>
      {content}
    </p>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { t } = useTranslation();

  if (message.role === 'system') {
    return (
      <div
        role="article"
        aria-label={t('chat.systemMessage', { defaultValue: 'System message' })}
        className="mb-3 flex items-start gap-2 rounded-lg px-3 py-2"
        style={{ backgroundColor: 'var(--bg-tertiary)', opacity: 0.7 }}
      >
        <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} aria-hidden="true" />
        <span className="type-support" style={{ color: 'var(--text-secondary)' }}>
          {message.content}
        </span>
      </div>
    );
  }

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div
        role="article"
        aria-label={t('chat.userMessage', { defaultValue: 'Your message' })}
        className="mb-4 flex justify-end"
      >
        <div className="rounded-2xl px-4 py-2.5" style={{ backgroundColor: 'var(--user-bubble-bg)', maxWidth: '85%' }}>
          <p className="whitespace-pre-wrap type-body" style={{ color: 'var(--text-primary)' }}>
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div role="article" aria-label={t('chat.assistantMessage', { defaultValue: 'Assistant message' })} className="mb-4">
      {message.content && (
        <div className="prose-chat type-body">
          <Suspense fallback={<MarkdownFallback content={message.content} />}>
            <MarkdownContent content={message.content} />
          </Suspense>
        </div>
      )}

      {message.toolCalls.length > 0 && (
        <div className="mt-2 space-y-1">
          {message.toolCalls.map((toolCall) => (
            <ToolCallCard key={toolCall.id} toolCall={toolCall} />
          ))}
        </div>
      )}
    </div>
  );
}
