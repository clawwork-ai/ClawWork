import type { Artifact } from '@clawwork/shared';

export type ArtifactKindFilter = 'all' | 'image' | 'code' | 'file' | 'other';

type Translate = (key: string) => string;

function normalizedName(artifact: Pick<Artifact, 'name'>): string {
  return artifact.name.toLowerCase();
}

export function getArtifactKindFilter(artifact: Pick<Artifact, 'type' | 'mimeType' | 'name'>): ArtifactKindFilter {
  if (artifact.type === 'image' || artifact.mimeType.startsWith('image/')) return 'image';
  if (artifact.type === 'code') return 'code';
  if (artifact.type === 'file') return 'file';
  return 'other';
}

function getArtifactLabelKey(artifact: Pick<Artifact, 'type' | 'mimeType' | 'name'>): string {
  const name = normalizedName(artifact);
  if (artifact.type === 'image' || artifact.mimeType.startsWith('image/')) return 'artifactKinds.image';
  if (artifact.type === 'code') return 'artifactKinds.code';
  if (artifact.type === 'link') return 'artifactKinds.link';
  if (artifact.type === 'structured_data') return 'artifactKinds.data';
  if (artifact.mimeType === 'text/markdown' || name.endsWith('.md')) return 'artifactKinds.markdown';
  if (artifact.mimeType.startsWith('text/') || name.endsWith('.txt')) return 'artifactKinds.text';
  return 'artifactKinds.file';
}

export function getArtifactLabel(artifact: Pick<Artifact, 'type' | 'mimeType' | 'name'>, t: Translate): string {
  return t(getArtifactLabelKey(artifact));
}
