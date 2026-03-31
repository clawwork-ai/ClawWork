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
    <div className="safe-area-bottom px-3 py-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div
        className="flex items-end gap-2 rounded-[22px] px-2 py-1.5"
        style={{ backgroundColor: 'var(--input-bar-bg)' }}
      >
        <button
          onClick={handleNewTask}
          aria-label={t('drawer.newTaskButton')}
          className="flex shrink-0 items-center justify-center rounded-full transition-colors"
          style={{ color: 'var(--text-secondary)', width: 32, height: 32 }}
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
          className="type-body flex-1 resize-none bg-transparent py-1 outline-none"
          style={{ color: 'var(--text-primary)', minHeight: 32 }}
        />
        {isStreaming ? (
          <button
            onClick={handleAbort}
            aria-label={t('chat.abortButton')}
            className="flex shrink-0 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', width: 32, height: 32 }}
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() || !connected}
            aria-label={t('chat.sendButton')}
            className="flex shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', width: 32, height: 32 }}
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
