import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2, Copy, Check } from 'lucide-react';
import hljs from 'highlight.js';
import { useTranslation } from 'react-i18next';
import type { Artifact } from '@clawwork/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion as motionPresets } from '@/styles/design-tokens';
import { cn, formatFileSize } from '@/lib/utils';
import { copyTextToClipboard } from '@/lib/clipboard';
import MarkdownContent from './MarkdownContent';

interface FilePreviewProps {
  artifact: Artifact;
  onNavigateToTask: (taskId: string, messageId: string) => void;
}

function isImage(mime: string): boolean {
  return mime.startsWith('image/');
}

function isMarkdown(name: string): boolean {
  return name.endsWith('.md');
}

function langFromName(name: string): string {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    html: 'html',
    css: 'css',
    sql: 'sql',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    sh: 'bash',
    bash: 'bash',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    toml: 'toml',
    txt: '',
  };
  return map[ext] ?? '';
}

function extFromName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot !== -1 ? name.slice(dot + 1).toUpperCase() : '';
}

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      onClick={() => {
        void copyTextToClipboard(text);
        setCopied(true);
      }}
      title={copied ? t('chatMessage.copied') : t('chatMessage.copyCode')}
      className={cn(
        'type-support flex items-center gap-1 rounded-md px-2 py-1 transition-colors',
        'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
        copied && 'text-[var(--accent)]',
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function FilePreview({ artifact, onNavigateToTask }: FilePreviewProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState<string | null>(null);
  const [encoding, setEncoding] = useState<'utf-8' | 'base64'>('utf-8');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ext = extFromName(artifact.name);
  const isCode = encoding === 'utf-8' && !isMarkdown(artifact.name) && !isImage(artifact.mimeType);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setContent(null);
    window.clawwork.readArtifactFile(artifact.localPath).then((res) => {
      if (res.ok && res.result) {
        const r = res.result as { content: string; encoding: string };
        setContent(r.content);
        setEncoding(r.encoding as 'utf-8' | 'base64');
      } else {
        setError(res.error ?? 'failed to read file');
      }
      setLoading(false);
    });
  }, [artifact.localPath]);

  return (
    <motion.div className="glass-card flex flex-col h-full" {...motionPresets.slideIn}>
      <header className="flex items-center justify-between gap-2 px-4 h-11 border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {ext && (
            <span className="type-badge flex-shrink-0 rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-muted)] leading-none">
              {ext}
            </span>
          )}
          <h3 className="type-label min-w-0 truncate text-[var(--text-primary)]">{artifact.name}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="type-meta text-[var(--text-muted)]">{formatFileSize(artifact.size)}</span>
          {isCode && content !== null && <CopyButton text={content} />}
        </div>
      </header>

      <ScrollArea className="flex-1">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
          </div>
        )}
        {error && <p className="type-support px-4 py-8 text-center text-[var(--danger)]">{error}</p>}
        {!loading && !error && content !== null && (
          <PreviewContent content={content} encoding={encoding} mimeType={artifact.mimeType} name={artifact.name} />
        )}
      </ScrollArea>

      <div className="flex-shrink-0 border-t border-[var(--border)] px-4 py-2.5">
        <Button
          variant="soft"
          size="sm"
          onClick={() => onNavigateToTask(artifact.taskId, artifact.messageId)}
          className="w-full gap-2"
        >
          <ExternalLink size={14} />
          {t('filePreview.goToSource')}
        </Button>
      </div>
    </motion.div>
  );
}

function CodePreview({ content, lang }: { content: string; lang: string }) {
  const highlighted = useMemo(() => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(content, { language: lang }).value;
    }
    return hljs.highlightAuto(content).value;
  }, [content, lang]);

  return (
    <div className="overflow-x-auto">
      <pre className="type-code-block p-4 leading-relaxed">
        <code
          className={cn('hljs', lang && `language-${lang}`)}
          style={{ background: 'none', padding: 0 }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}

function PreviewContent({
  content,
  encoding,
  mimeType,
  name,
}: {
  content: string;
  encoding: string;
  mimeType: string;
  name: string;
}) {
  const { t } = useTranslation();

  if (isImage(mimeType) && encoding === 'base64') {
    return (
      <div className="flex items-center justify-center p-4">
        <img
          src={`data:${mimeType};base64,${content}`}
          alt={name}
          className="max-w-full max-h-96 rounded-lg object-contain"
        />
      </div>
    );
  }

  if (isMarkdown(name)) {
    return (
      <div className="p-4">
        <MarkdownContent content={content} />
      </div>
    );
  }

  if (encoding === 'utf-8') {
    const lang = langFromName(name);
    return <CodePreview content={content} lang={lang} />;
  }

  return (
    <p className="type-support px-4 py-8 text-center text-[var(--text-muted)]">
      {t('filePreview.cannotPreview')} ({mimeType})
    </p>
  );
}
