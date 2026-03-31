import { useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Message } from '@clawwork/shared';
import type { ActiveTurn } from '@clawwork/core';
import { EMPTY_MESSAGES } from '@clawwork/core';
import { Virtuoso } from 'react-virtuoso';
import { useTaskStore, useMessageStore, useUiStore } from '../stores/hooks';
import { ChatMessage } from '../components/ChatMessage';
import { StreamingMessage } from '../components/StreamingMessage';
import { ChatInput } from '../components/ChatInput';

const VIRTUALIZATION_THRESHOLD = 100;

interface TailContext {
  activeTurn: ActiveTurn | undefined;
  processing: boolean;
  gatewayStatus: string | undefined;
  t: (key: string, options?: Record<string, string>) => string;
}

function ChatTail({ context }: { context?: TailContext }) {
  if (!context) return null;
  const { activeTurn, processing, gatewayStatus, t } = context;
  return (
    <>
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
    </>
  );
}

const VIRTUOSO_COMPONENTS = { Footer: ChatTail };

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
  const activeTurn = useMessageStore((s) =>
    activeTask?.sessionKey ? s.activeTurnBySession[activeTask.sessionKey] : undefined,
  );
  const processing = useMessageStore((s) =>
    activeTask?.sessionKey ? s.processingBySession.has(activeTask.sessionKey) : false,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const useVirtualization = messages.length >= VIRTUALIZATION_THRESHOLD;

  const messageItems = useMemo(
    () => messages.map((msg) => ({ type: 'message' as const, id: msg.id, message: msg })),
    [messages],
  );

  const tailContext = useMemo<TailContext>(
    () => ({ activeTurn, processing, gatewayStatus, t }),
    [activeTurn, processing, gatewayStatus, t],
  );

  useEffect(() => {
    const container = scrollRef.current;
    const content = contentRef.current;
    if (!container || !content || useVirtualization) return;

    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    });
    ro.observe(content);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [useVirtualization]);

  if (!activeTaskId && !pendingNewTask) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center px-8"
        role="main"
        aria-label={t('chat.mainArea')}
      >
        <p className="text-center type-body" style={{ color: 'var(--text-muted)' }}>
          {t('chat.emptyState')}
        </p>
      </div>
    );
  }

  if (!activeTaskId && pendingNewTask) {
    return (
      <div className="flex h-full flex-col" role="main" aria-label={t('chat.mainArea')}>
        <div className="flex-1" />
        <ChatInput taskId="__pending__" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" role="main" aria-label={t('chat.mainArea')}>
      <div
        ref={useVirtualization ? undefined : scrollRef}
        className={`flex-1 px-4 py-4 ${useVirtualization ? 'overflow-hidden' : 'overflow-y-auto'}`}
      >
        {useVirtualization ? (
          <Virtuoso
            style={{ height: '100%' }}
            data={messageItems}
            followOutput="smooth"
            alignToBottom
            context={tailContext}
            aria-label={t('chat.virtualizedList')}
            computeItemKey={(_index, item) => item.id}
            itemContent={(_index, item) => <ChatMessage message={item.message} />}
            components={VIRTUOSO_COMPONENTS}
          />
        ) : (
          <div ref={contentRef}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <ChatTail context={tailContext} />
          </div>
        )}
      </div>
      <ChatInput taskId={activeTaskId ?? '__pending__'} />
    </div>
  );
}
