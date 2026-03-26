import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Message } from '@clawwork/shared';
import { EMPTY_MESSAGES } from '@clawwork/core';
import { Virtuoso } from 'react-virtuoso';
import { useTaskStore, useMessageStore, useUiStore } from '../stores/hooks';
import { ChatMessage } from '../components/ChatMessage';
import { StreamingMessage } from '../components/StreamingMessage';
import { ChatInput } from '../components/ChatInput';

const VIRTUALIZATION_THRESHOLD = 100;

export function ChatView() {
  const { t } = useTranslation();
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const pendingNewTask = useTaskStore((s) => s.pendingNewTask);
  const activeTask = useTaskStore((s) => s.tasks.find((tk) => tk.id === activeTaskId));
  const gatewayStatus = useUiStore((s) =>
    activeTask?.gatewayId ? s.gatewayStatusMap[activeTask.gatewayId] : undefined,
  );
  const messages: Message[] = useMessageStore((s) =>
    activeTaskId ? (s.messagesByTask[activeTaskId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  );
  const activeTurn = useMessageStore((s) => (activeTaskId ? s.activeTurnByTask[activeTaskId] : undefined));
  const processing = useMessageStore((s) => activeTaskId !== null && s.processingTasks.has(activeTaskId));
  const scrollRef = useRef<HTMLDivElement>(null);
  const useVirtualization = messages.length >= VIRTUALIZATION_THRESHOLD;

  const messageItems = useMemo(
    () => messages.map((msg) => ({ type: 'message' as const, id: msg.id, message: msg })),
    [messages],
  );

  const scrollToBottom = useCallback(() => {
    if (!useVirtualization && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [useVirtualization]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, activeTurn?.streamingText, scrollToBottom]);

  if (!activeTaskId && !pendingNewTask) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center px-8"
        role="main"
        aria-label={t('chat.mainArea', { defaultValue: 'Chat' })}
      >
        <p className="text-center type-body" style={{ color: 'var(--text-muted)' }}>
          {t('chat.emptyState')}
        </p>
      </div>
    );
  }

  if (!activeTaskId && pendingNewTask) {
    return (
      <div className="flex h-full flex-col" role="main" aria-label={t('chat.mainArea', { defaultValue: 'Chat' })}>
        <div className="flex-1" />
        <ChatInput taskId="__pending__" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" role="main" aria-label={t('chat.mainArea', { defaultValue: 'Chat' })}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {useVirtualization ? (
          <Virtuoso
            style={{ height: '100%' }}
            data={messageItems}
            followOutput="smooth"
            alignToBottom
            aria-label={t('chat.virtualizedList')}
            computeItemKey={(_index, item) => item.id}
            itemContent={(_index, item) => <ChatMessage message={item.message} />}
          />
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}
        {activeTurn && (activeTurn.streamingText || activeTurn.toolCalls.length > 0) && (
          <StreamingMessage turn={activeTurn} />
        )}
        {processing && !activeTurn && (
          <div className="flex items-center gap-2 py-3" role="status">
            <div
              className="h-2 w-2 animate-pulse rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
              aria-hidden="true"
            />
            <span className="type-support" style={{ color: 'var(--text-muted)' }}>
              {t('chat.thinking')}
            </span>
          </div>
        )}
        {gatewayStatus === 'connecting' && (
          <p className="px-3 py-3 type-support" style={{ color: 'var(--text-muted)' }}>
            {t('chat.authorizationPending')}
          </p>
        )}
      </div>
      <ChatInput taskId={activeTaskId ?? '__pending__'} />
    </div>
  );
}
