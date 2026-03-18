import { memo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@clawwork/shared';
import { Bot, User, Brain, ChevronDown, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import ToolCallCard from './ToolCallCard';
import MarkdownContent from './MarkdownContent';

interface ChatMessageProps {
  message: Message;
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
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs mb-1.5 mr-1.5',
        'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors',
      )}
    >
      <FileCode size={13} className="text-[var(--accent)] flex-shrink-0" />
      <span className="text-[var(--text-secondary)] font-medium truncate max-w-[200px]">{fileName}</span>
      <span className="text-[var(--text-muted)] flex-shrink-0">{file.lineCount}L</span>
    </button>
  );
}

const ChatMessage = memo(function ChatMessage({
  message,
  highlighted,
  onHighlightDone,
  onImageClick,
  onFileClick,
}: ChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const ref = useRef<HTMLDivElement>(null);
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const parsedFiles = isUser ? parseFileBlocks(message.content) : null;

  useEffect(() => {
    if (!highlighted || !ref.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => onHighlightDone?.(), 2000);
    return () => clearTimeout(timer);
  }, [highlighted, onHighlightDone]);

  if (isSystem) {
    return (
      <div className="flex justify-center py-3">
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const images = message.imageAttachments;

  return (
    <motion.div
      ref={ref}
      initial={motionPresets.listItem.initial}
      animate={motionPresets.listItem.animate}
      transition={motionPresets.listItem.transition}
      className={cn('flex gap-3.5 py-4', isUser && 'flex-row-reverse', highlighted && 'animate-highlight rounded-lg')}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--accent-dim)]',
        )}
      >
        {isUser ? (
          <User size={16} className="text-[var(--text-secondary)]" />
        ) : (
          <Bot size={16} className="text-[var(--accent)]" />
        )}
      </div>

      <div className={cn('min-w-0 max-w-[80%]', isUser && 'text-right')}>
        {/* Thinking content (collapsible) */}
        {!isUser && message.thinkingContent && (
          <div className="mb-2">
            <button
              onClick={() => setThinkingOpen((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs',
                'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors',
              )}
            >
              <Brain size={12} className="text-[var(--accent)] opacity-70" />
              <span>{t('chatMessage.thinkingProcess')}</span>
              <ChevronDown size={11} className={cn('transition-transform', thinkingOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {thinkingOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      'mt-1.5 px-3 py-2 rounded-lg text-xs leading-relaxed',
                      'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                      'border-l-2 border-[var(--accent)] border-opacity-30',
                      'max-h-60 overflow-y-auto',
                    )}
                  >
                    <MarkdownContent content={message.thinkingContent} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Text content */}
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
              showMessageCopy
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
                  images.length === 1 ? 'max-w-[280px] max-h-[200px]' : 'w-20 h-20',
                )}
                onClick={() => onImageClick?.(img.dataUrl)}
              />
            ))}
          </div>
        ) : null}
        {message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default ChatMessage;
