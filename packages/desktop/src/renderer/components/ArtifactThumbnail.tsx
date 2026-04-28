import { useEffect, useState } from 'react';
import { File, FileCode, FileText, Image } from 'lucide-react';
import type { Artifact, ArtifactType } from '@clawwork/shared';
import { cn } from '@/lib/utils';

interface ArtifactThumbnailProps {
  artifact: Artifact;
  className?: string;
  iconSize?: number;
}

function getTypeConfig(type: ArtifactType, name: string) {
  if (type === 'image') return { Icon: Image, color: 'text-[var(--info)]', bg: 'bg-[var(--info)]/10' };
  if (type === 'code') return { Icon: FileCode, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-dim)]' };
  if (name.endsWith('.md') || name.endsWith('.txt'))
    return { Icon: FileText, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10' };
  return { Icon: File, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-tertiary)]' };
}

function isImageArtifact(artifact: Artifact): boolean {
  return artifact.type === 'image' || artifact.mimeType.startsWith('image/');
}

function readResult(value: unknown): { content: string; encoding: string } | null {
  if (!value || typeof value !== 'object') return null;
  const result = value as { content?: unknown; encoding?: unknown };
  if (typeof result.content !== 'string' || typeof result.encoding !== 'string') return null;
  return { content: result.content, encoding: result.encoding };
}

export default function ArtifactThumbnail({ artifact, className, iconSize = 18 }: ArtifactThumbnailProps) {
  const { Icon, color, bg } = getTypeConfig(artifact.type, artifact.name);
  const [src, setSrc] = useState<string | null>(null);
  const image = isImageArtifact(artifact);

  useEffect(() => {
    if (!image) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    setSrc(null);

    window.clawwork
      .readArtifactFile(artifact.localPath)
      .then((res) => {
        if (cancelled || !res.ok) return;
        const data = readResult(res.result);
        if (!data || data.encoding !== 'base64') return;
        setSrc(`data:${artifact.mimeType};base64,${data.content}`);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [artifact.localPath, artifact.mimeType, image]);

  return (
    <div className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg', bg, className)}>
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setSrc(null)} />
      ) : (
        <Icon size={iconSize} className={color} />
      )}
    </div>
  );
}
