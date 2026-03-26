import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Square } from 'lucide-react';
import { composer } from '../stores';
import { useMessageStore, useTaskStore, useUiStore } from '../stores/hooks';

interface ChatInputProps {
  taskId: string;
}

const MIN_HEIGHT = 44;
const MAX_HEIGHT = 120;

export function ChatInput({ taskId }: ChatInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendShortcut = useUiStore((s) => s.sendShortcut);
  const storeTaskId = taskId === '__pending__' ? '' : taskId;
  const processing = useMessageStore((s) => (storeTaskId ? s.processingTasks.has(storeTaskId) : false));
  const hasActiveTurn = useMessageStore((s) => (storeTaskId ? !!s.activeTurnByTask[storeTaskId] : false));
  const isStreaming = processing || hasActiveTurn;

  const pendingNewTask = useTaskStore((s) => s.pendingNewTask);
  const task = useTaskStore((s) => s.tasks.find((tk) => tk.id === taskId));
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
      textareaRef.current.style.height = MIN_HEIGHT + 'px';
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
    <div
      className="safe-area-bottom border-t"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex items-end gap-2 px-3 py-2">
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
          className="type-body flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 outline-none"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            minHeight: MIN_HEIGHT,
          }}
        />
        {isStreaming ? (
          <button
            onClick={handleAbort}
            aria-label={t('chat.abortButton')}
            className="shrink-0 rounded-lg p-2 transition-colors"
            style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              minHeight: MIN_HEIGHT,
              minWidth: MIN_HEIGHT,
            }}
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() || !connected}
            aria-label={t('chat.sendButton')}
            className="shrink-0 rounded-lg p-2 transition-colors disabled:opacity-30"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-foreground)',
              minHeight: MIN_HEIGHT,
              minWidth: MIN_HEIGHT,
            }}
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
