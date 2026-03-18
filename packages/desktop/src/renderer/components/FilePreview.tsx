import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Artifact } from '@clawwork/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion as motionPresets } from '@/styles/design-tokens';
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

export default function FilePreview({ artifact, onNavigateToTask }: FilePreviewProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState<string | null>(null);
  const [encoding, setEncoding] = useState<'utf-8' | 'base64'>('utf-8');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <motion.div className="flex flex-col h-full" {...motionPresets.slideIn}>
      <header className="flex items-center px-4 h-11 border-b border-[var(--border)] flex-shrink-0">
        <h3 className="text-sm font-medium text-[var(--text-primary)] truncate min-w-0">{artifact.name}</h3>
      </header>

      <ScrollArea className="flex-1">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
          </div>
        )}
        {error && <p className="text-sm text-[var(--danger)] text-center py-8 px-4">{error}</p>}
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
          <ExternalLink size={13} />
          <span className="text-xs">{t('filePreview.goToSource')}</span>
        </Button>
      </div>
    </motion.div>
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
          className="max-w-full max-h-[60vh] rounded-lg object-contain"
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
    const fenced = lang ? `\`\`\`${lang}\n${content}\n\`\`\`` : `\`\`\`\n${content}\n\`\`\``;
    return <MarkdownContent content={fenced} />;
  }

  return (
    <p className="text-sm text-[var(--text-muted)] text-center py-8 px-4">
      {t('filePreview.cannotPreview')} ({mimeType})
    </p>
  );
}
