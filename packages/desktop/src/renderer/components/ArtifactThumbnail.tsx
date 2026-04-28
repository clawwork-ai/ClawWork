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

function thumbnailResult(value: unknown): { dataUrl: string } | null {
  if (!value || typeof value !== 'object') return null;
  const result = value as { dataUrl?: unknown };
  if (typeof result.dataUrl !== 'string') return null;
  return { dataUrl: result.dataUrl };
}

const thumbnailCache = new Map<string, string | null>();
const thumbnailRequests = new Map<string, Promise<string | null>>();

function loadThumbnail(localPath: string): Promise<string | null> {
  if (thumbnailCache.has(localPath)) return Promise.resolve(thumbnailCache.get(localPath) ?? null);
  const existing = thumbnailRequests.get(localPath);
  if (existing) return existing;

  const request = window.clawwork
    .readArtifactThumbnail(localPath, 128)
    .then((res) => {
      const data = res.ok ? thumbnailResult(res.result) : null;
      const src = data?.dataUrl ?? null;
      thumbnailCache.set(localPath, src);
      return src;
    })
    .catch(() => {
      thumbnailCache.set(localPath, null);
      return null;
    })
    .finally(() => {
      thumbnailRequests.delete(localPath);
    });

  thumbnailRequests.set(localPath, request);
  return request;
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

    loadThumbnail(artifact.localPath).then((thumbnailSrc) => {
      if (!cancelled) setSrc(thumbnailSrc);
    });

    return () => {
      cancelled = true;
    };
  }, [artifact.localPath, image]);

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
