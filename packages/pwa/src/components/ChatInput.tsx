import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, Square, Plus } from 'lucide-react';
import { composer, ensureHydrationReady } from '../stores';
import { useMessageStore, useTaskStore, useUiStore } from '../stores/hooks';

interface ChatInputProps {
  taskId: string;
}

const MAX_HEIGHT = 120;

export function ChatInput({ taskId }: ChatInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendShortcut = useUiStore((s) => s.sendShortcut);
  const pendingNewTask = useTaskStore((s) => s.pendingNewTask);
  const task = useTaskStore((s) => s.tasks.find((tk) => tk.id === taskId));
  const processing = useMessageStore((s) => (task?.sessionKey ? s.processingBySession.has(task.sessionKey) : false));
  const hasActiveTurn = useMessageStore((s) => (task?.sessionKey ? !!s.activeTurnBySession[task.sessionKey] : false));
  const isStreaming = processing || hasActiveTurn;
  const gatewayStatus = useUiStore((s) => (task?.gatewayId ? s.gatewayStatusMap[task.gatewayId] : undefined));
  const pendingGatewayStatus = useUiStore((s) =>
    pendingNewTask?.gatewayId ? s.gatewayStatusMap[pendingNewTask.gatewayId] : undefined,
  );
  const connected = taskId === '__pending__' ? pendingGatewayStatus === 'connected' : gatewayStatus === 'connected';

  const placeholder = !connected ? t('gateway.connecting') : t('chat.inputPlaceholder');

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content) return;

    const prev = text;
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '32px';
    }

    try {
      await composer.send(taskId === '__pending__' ? undefined : taskId, {
        content,
        titleHint: content,
      });
    } catch {
      setText(prev);
    }
  }, [text, taskId]);

  const handleAbort = useCallback(async () => {
    if (taskId === '__pending__') return;
    try {
      await composer.abort(taskId);
    } catch {
      /* abort is best-effort */
    }
  }, [taskId]);

  const handleNewTask = useCallback(async () => {
    await ensureHydrationReady();
    useTaskStore.getState().startNewTask();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const meta = e.metaKey || e.ctrlKey;
      const shouldSend = sendShortcut === 'cmdEnter' ? meta && !e.shiftKey : !meta && !e.shiftKey;
      if (!shouldSend) return;
      e.preventDefault();
      if (!isStreaming && text.trim()) {
        handleSend();
      }
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + 'px';
    }
  };

  return (
    <div className="safe-area-bottom bg-[var(--bg-primary)] px-3 py-2">
      <div className="flex items-end gap-2 rounded-[22px] bg-[var(--input-bar-bg)] px-2 py-1.5">
        <button
          onClick={handleNewTask}
          aria-label={t('drawer.newTaskButton')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors"
        >
          <Plus size={18} />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={!connected}
          rows={1}
          aria-label={t('chat.inputPlaceholder')}
          className="type-body min-h-8 flex-1 resize-none bg-transparent py-1 text-[var(--text-primary)] outline-none"
        />
        {isStreaming ? (
          <button
            onClick={handleAbort}
            aria-label={t('chat.abortButton')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--danger-bg)] text-[var(--danger)] transition-colors"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() || !connected}
            aria-label={t('chat.sendButton')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] transition-colors disabled:opacity-30"
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
