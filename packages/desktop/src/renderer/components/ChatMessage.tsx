import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@clawwork/shared';
import { Check, ChevronDown, ChevronRight, Copy, FileCode, Loader2, Save, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { copyTextToClipboard } from '@/lib/clipboard';
import { Button } from '@/components/ui/button';
import MessageAvatar from './MessageAvatar';
import ThinkingSection from './ThinkingSection';
import ToolCallCard from './ToolCallCard';
import MarkdownContent from './MarkdownContent';

interface ChatMessageProps {
  message: Message;
  messageLayout?: 'centered' | 'wide';
  highlighted?: boolean;
  onHighlightDone?: () => void;
  onImageClick?: (src: string) => void;
  onFileClick?: (file: { path: string; content: string }) => void;
}

function parseFileBlocks(content: string): {
  files: { path: string; content: string; lineCount: number }[];
  text: string;
} {
  const fileRegex = /<file path="([^"]+)">\n([\s\S]*?)\n<\/file>/g;
  const files: { path: string; content: string; lineCount: number }[] = [];
  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    const fileContent = match[2];
    files.push({ path: match[1], content: fileContent, lineCount: fileContent.split('\n').length });
  }
  const text = content.replace(fileRegex, '').trim();
  return { files, text };
}

function FileBlockChip({
  file,
  onClick,
}: {
  file: { path: string; content: string; lineCount: number };
  onClick?: () => void;
}) {
  const fileName = file.path.split('/').pop() ?? file.path;

  return (
    <button
      onClick={onClick}
      className={cn(
        'type-support mb-1.5 mr-1.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
        'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors',
        'glow-focus',
      )}
    >
      <FileCode size={13} className="text-[var(--accent)] flex-shrink-0" />
      <span className="text-[var(--text-secondary)] font-medium truncate max-w-48">{fileName}</span>
      <span className="text-[var(--text-muted)] flex-shrink-0">{file.lineCount}L</span>
    </button>
  );
}

function ToolCallSummary({ toolCalls }: { toolCalls: Message['toolCalls'] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const errorCount = toolCalls.filter((tc) => tc.status === 'error').length;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'type-label mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-2',
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors',
            'glow-focus',
          )}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Wrench size={14} />
          <span>
            {errorCount > 0
              ? t('chatMessage.toolCallSummaryWithErrors', { count: toolCalls.length, errorCount })
              : t('chatMessage.toolCallSummary', { count: toolCalls.length })}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent forceMount>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={motionPresets.collapse.initial}
              animate={motionPresets.collapse.animate}
              exit={motionPresets.collapse.exit}
              transition={motionPresets.collapse.transition}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {toolCalls.map((tc) => (
                  <ToolCallCard key={tc.id} toolCall={tc} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MessageActionButton({
  title,
  onClick,
  children,
  disabled = false,
  tone = 'default',
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  tone?: 'default' | 'accent' | 'danger';
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={title}
      title={title}
      disabled={disabled}
      className={cn(
        'h-7 w-7 rounded-md border-none bg-transparent shadow-none',
        tone === 'default' && 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
        tone === 'accent' && 'text-[var(--accent)] hover:text-[var(--accent)]',
        tone === 'danger' && 'text-[var(--danger)] hover:text-[var(--danger)]',
      )}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}

const ChatMessage = memo(function ChatMessage({
  message,
  messageLayout = 'centered',
  highlighted,
  onHighlightDone,
  onImageClick,
  onFileClick,
}: ChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const ref = useRef<HTMLDivElement>(null);
  const parsedFiles = isUser ? parseFileBlocks(message.content) : null;
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (!highlighted || !ref.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => onHighlightDone?.(), 2000);
    return () => clearTimeout(timer);
  }, [highlighted, onHighlightDone]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') return;
    const timer = window.setTimeout(() => setSaveState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  if (!isUser && !isSystem && !message.content && message.toolCalls.length === 0 && !message.thinkingContent) {
    return null;
  }

  if (isSystem) {
    return (
      <div className="flex justify-center py-3">
        <span className="type-support rounded-full bg-[var(--bg-tertiary)] px-3 py-1 text-[var(--text-muted)]">
          {message.content}
        </span>
      </div>
    );
  }

  const images = message.imageAttachments;
  const canSaveMessage = Boolean(message.content.trim()) && Boolean(message.taskId) && Boolean(message.id);

  const handleCopy = (): void => {
    void copyTextToClipboard(message.content).then(() => setCopied(true));
  };

  const handleSaveMessage = (): void => {
    if (!canSaveMessage || saveState === 'saving') return;
    setSaveState('saving');
    window.clawwork
      .saveCodeBlock({
        taskId: message.taskId,
        messageId: message.id,
        content: message.content,
        language: 'md',
      })
      .then((r) => {
        if (!r.ok) throw new Error(r.error);
        setSaveState('saved');
      })
      .catch(() => setSaveState('error'));
  };

  return (
    <motion.div
      ref={ref}
      initial={motionPresets.messageEnter.initial}
      animate={motionPresets.messageEnter.animate}
      transition={motionPresets.messageEnter.transition}
      className={cn(
        'group/message flex gap-3.5 py-4',
        isUser && 'flex-row-reverse mt-5',
        highlighted && 'animate-highlight rounded-lg',
      )}
    >
      <MessageAvatar role={isUser ? 'user' : 'assistant'} />

      <div
        className={cn(
          'min-w-0',
          messageLayout === 'centered' ? 'max-w-[var(--content-max-width)]' : 'w-full max-w-none',
          isUser && 'text-right',
        )}
      >
        {!isUser && message.thinkingContent && <ThinkingSection content={message.thinkingContent} />}

        {isUser && parsedFiles && (parsedFiles.files.length > 0 || parsedFiles.text) ? (
          <div
            className={cn(
              'inline-block leading-relaxed rounded-2xl px-4 py-3',
              'bg-[var(--bg-tertiary)] text-[var(--text-primary)]',
            )}
          >
            <div className="flex flex-wrap">
              {parsedFiles.files.map((f, i) => (
                <FileBlockChip
                  key={`${f.path}-${i}`}
                  file={f}
                  onClick={() => onFileClick?.({ path: f.path, content: f.content })}
                />
              ))}
            </div>
            {parsedFiles.text && <p className="whitespace-pre-wrap">{parsedFiles.text}</p>}
          </div>
        ) : message.content || !images?.length ? (
          <div className="inline-block leading-relaxed rounded-2xl px-4 py-3 text-[var(--text-primary)]">
            <MarkdownContent
              content={message.content}
              onImageClick={onImageClick}
              taskId={message.taskId}
              messageId={message.id}
            />
          </div>
        ) : null}
        {isUser && images?.length ? (
          <div className={cn('flex gap-2 mt-2 flex-wrap', 'justify-end')}>
            {images.map((img, i) => (
              <img
                key={`${img.fileName}-${i}`}
                src={img.dataUrl}
                alt={img.fileName}
                className={cn(
                  'rounded-xl object-cover cursor-pointer border border-[var(--border-subtle)]',
                  'hover:opacity-90 transition-opacity',
                  images.length === 1 ? 'max-w-72 max-h-48' : 'w-20 h-20',
                )}
                onClick={() => onImageClick?.(img.dataUrl)}
              />
            ))}
          </div>
        ) : null}
        {message.toolCalls.length > 0 && <ToolCallSummary toolCalls={message.toolCalls} />}
        {isUser
          ? message.content.trim() && (
              <div className="mt-1.5 flex justify-end gap-1 opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100">
                {canSaveMessage && (
                  <MessageActionButton
                    title={t('contextMenu.saveToMarkdown')}
                    onClick={handleSaveMessage}
                    disabled={saveState === 'saving'}
                    tone={saveState === 'saved' ? 'accent' : saveState === 'error' ? 'danger' : 'default'}
                  >
                    {saveState === 'saving' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saveState === 'saved' ? (
                      <Check size={14} />
                    ) : (
                      <Save size={14} />
                    )}
                  </MessageActionButton>
                )}
                <MessageActionButton
                  title={copied ? t('chatMessage.copied') : t('chatMessage.copyMessage')}
                  onClick={handleCopy}
                  tone={copied ? 'accent' : 'default'}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </MessageActionButton>
              </div>
            )
          : message.content.trim() && (
              <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100">
                {canSaveMessage && (
                  <MessageActionButton
                    title={t('contextMenu.saveToMarkdown')}
                    onClick={handleSaveMessage}
                    disabled={saveState === 'saving'}
                    tone={saveState === 'saved' ? 'accent' : saveState === 'error' ? 'danger' : 'default'}
                  >
                    {saveState === 'saving' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saveState === 'saved' ? (
                      <Check size={14} />
                    ) : (
                      <Save size={14} />
                    )}
                  </MessageActionButton>
                )}
                <MessageActionButton
                  title={copied ? t('chatMessage.copied') : t('chatMessage.copyMessage')}
                  onClick={handleCopy}
                  tone={copied ? 'accent' : 'default'}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </MessageActionButton>
              </div>
            )}
      </div>
    </motion.div>
  );
});

export default ChatMessage;
