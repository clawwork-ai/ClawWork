import { isValidElement, type ReactNode, useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { copyTextToClipboard } from '@/lib/clipboard';

interface MarkdownContentProps {
  content: string;
  onImageClick?: (src: string) => void;
  showMessageCopy?: boolean;
  showCursor?: boolean;
  taskId?: string;
  messageId?: string;
}

function flattenTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenTextContent).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return flattenTextContent(node.props.children);
  }
  return '';
}

function extractLang(children: ReactNode): string {
  if (!isValidElement<{ className?: string }>(children)) return '';
  const cls = children.props.className ?? '';
  const match = /language-(\S+)/.exec(cls);
  return match ? match[1] : '';
}

interface CopyActionButtonProps {
  label: string;
  copiedLabel: string;
  text: string;
  className?: string;
}

function CopyActionButton({ label, copiedLabel, text, className }: CopyActionButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async (): Promise<void> => {
    await copyTextToClipboard(text);
    setCopied(true);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      className={cn(
        'h-7 w-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)]/90 backdrop-blur-sm',
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        void handleCopy();
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </Button>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveActionButtonProps {
  className?: string;
  onSave: () => Promise<void>;
}

function SaveActionButton({ className, onSave }: SaveActionButtonProps) {
  const [state, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    if (state !== 'saved' && state !== 'error') return;
    const timer = window.setTimeout(() => setSaveState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const handleSave = async (): Promise<void> => {
    if (state === 'saving') return;
    setSaveState('saving');
    try {
      await onSave();
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={state === 'saving'}
      className={cn(
        'h-7 w-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)]/90 backdrop-blur-sm',
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        state === 'saved' && 'text-[var(--accent)]',
        state === 'error' && 'text-red-400',
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        void handleSave();
      }}
    >
      {state === 'saving' ? (
        <Loader2 size={14} className="animate-spin" />
      ) : state === 'saved' ? (
        <Check size={14} />
      ) : (
        <Save size={14} />
      )}
    </Button>
  );
}

const REMARK_PLUGINS = [remarkGfm] as const;
const REHYPE_PLUGINS = [rehypeHighlight] as const;

export default function MarkdownContent({
  content,
  onImageClick,
  showMessageCopy = false,
  showCursor = false,
  taskId,
  messageId,
}: MarkdownContentProps) {
  const { t } = useTranslation();
  const copyMessageLabel = t('chatMessage.copyMessage');
  const copyCodeLabel = t('chatMessage.copyCode');
  const copiedLabel = t('chatMessage.copied');

  return (
    <div className="group min-w-0">
      <div className={cn('flex min-w-0 items-start gap-2', showMessageCopy && 'justify-between')}>
        <div className="prose-chat min-w-0 flex-1">
          <Markdown
            remarkPlugins={[...REMARK_PLUGINS]}
            rehypePlugins={[...REHYPE_PLUGINS]}
            components={{
              table: ({ children }: ComponentPropsWithoutRef<'table'>) => (
                <div className="overflow-x-auto my-2">
                  <table>{children}</table>
                </div>
              ),
              a: ({ href, children }: ComponentPropsWithoutRef<'a'>) => (
                <a
                  href={href}
                  onClick={(e) => {
                    if (href && /^https?:\/\//.test(href)) {
                      e.preventDefault();
                      window.open(href, '_blank');
                    }
                  }}
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }: ComponentPropsWithoutRef<'img'>) => {
                const actualSrc = src?.startsWith('clawwork-media://')
                  ? `file://${src.replace('clawwork-media://', '')}`
                  : src;
                return (
                  <span className="group/img relative inline-block">
                    <img
                      src={actualSrc}
                      alt={alt ?? ''}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      className="max-w-full max-h-80 rounded-lg mt-2 cursor-pointer"
                      onClick={() => actualSrc && onImageClick?.(actualSrc)}
                    />
                    {taskId && messageId && actualSrc && (
                      <span className="absolute top-3 right-2 opacity-0 transition-opacity group-hover/img:opacity-100">
                        <SaveActionButton
                          onSave={() =>
                            window.clawwork
                              .saveImageFromUrl({ taskId, messageId, url: src ?? '', alt: alt ?? '' })
                              .then((r) => {
                                if (!r.ok) throw new Error(r.error);
                              })
                          }
                        />
                      </span>
                    )}
                  </span>
                );
              },
              pre: ({ children }: ComponentPropsWithoutRef<'pre'>) => {
                const code = flattenTextContent(children).replace(/\n$/, '');
                const lang = extractLang(children);
                return (
                  <div className="group/code relative max-w-full">
                    {lang && (
                      <span className="absolute left-3 top-2.5 text-xs text-[var(--text-muted)] select-none pointer-events-none">
                        {lang}
                      </span>
                    )}
                    <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover/code:opacity-100 focus-within:opacity-100">
                      {taskId && messageId && (
                        <SaveActionButton
                          onSave={() =>
                            window.clawwork
                              .saveCodeBlock({ taskId, messageId, content: code, language: lang || undefined })
                              .then((r) => {
                                if (!r.ok) throw new Error(r.error);
                              })
                          }
                        />
                      )}
                      <CopyActionButton label={copyCodeLabel} copiedLabel={copiedLabel} text={code} />
                    </div>
                    <pre className="pt-10">{children}</pre>
                  </div>
                );
              },
            }}
          >
            {content}
          </Markdown>
        </div>
        {showMessageCopy && content.trim() && (
          <div className="flex gap-1 mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100">
            {taskId && messageId && (
              <SaveActionButton
                onSave={() =>
                  window.clawwork.saveCodeBlock({ taskId, messageId, content, language: 'md' }).then((r) => {
                    if (!r.ok) throw new Error(r.error);
                  })
                }
              />
            )}
            <CopyActionButton label={copyMessageLabel} copiedLabel={copiedLabel} text={content} />
          </div>
        )}
      </div>
      {showCursor && (
        <span className="inline-block w-1.5 h-4 bg-[var(--accent)] animate-pulse ml-0.5 align-middle rounded-sm" />
      )}
    </div>
  );
}
