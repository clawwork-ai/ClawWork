import { type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { FileText, FileCode, Image, File, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Artifact, ArtifactType } from '@clawwork/shared';
import { cn, formatRelativeTime, formatFileSize } from '@/lib/utils';
import { motion as motionPresets, motionDuration, motionEase } from '@/styles/design-tokens';

interface FileCardProps {
  artifact: Artifact;
  taskTitle: string;
  selected: boolean;
  isNew?: boolean;
  onClick: () => void;
  onContextMenu: (e: MouseEvent) => void;
}

function getTypeConfig(type: ArtifactType, name: string) {
  if (type === 'image') return { Icon: Image, color: 'text-[var(--info)]', bg: 'bg-[var(--info)]/10' };
  if (type === 'code') return { Icon: FileCode, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-dim)]' };
  if (name.endsWith('.md') || name.endsWith('.txt'))
    return { Icon: FileText, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10' };
  return { Icon: File, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-tertiary)]' };
}

function extBadge(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot !== -1 ? name.slice(dot + 1).toUpperCase() : '';
}

export default function FileCard({ artifact, taskTitle, selected, isNew, onClick, onContextMenu }: FileCardProps) {
  const { t } = useTranslation();
  const { Icon, color, bg } = getTypeConfig(artifact.type, artifact.name);
  const ext = extBadge(artifact.name);

  return (
    <div className="relative">
      {isNew && (
        <motion.div
          className="pointer-events-none absolute -inset-0.5 rounded-xl"
          style={{ boxShadow: 'var(--glow-ring), var(--glow-diffuse)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: motionDuration.ambient * 3, delay: motionDuration.moderate, ease: motionEase.gentle }}
          aria-hidden
        />
      )}
      <motion.button
        onClick={onClick}
        onContextMenu={onContextMenu}
        {...motionPresets.cardHover}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'relative w-full text-left rounded-xl border transition-all duration-150 overflow-hidden group',
          selected
            ? 'border-[var(--border-accent)] bg-[var(--accent-dim)] shadow-[var(--shadow-card)]'
            : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-accent)]/50 hover:bg-[var(--bg-hover)]',
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}
          aria-label={t('common.moreActions')}
          className={cn(
            'absolute top-2 right-2 z-10 p-1 rounded-md',
            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150',
            'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
          )}
        >
          <MoreHorizontal size={14} />
        </button>
        <div className="p-3">
          <div className="flex items-start gap-2.5">
            <div className={cn('flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
              <Icon size={18} className={color} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="type-label truncate leading-snug text-[var(--text-primary)]">{artifact.name}</p>
              <p className="type-support mt-0.5 text-[var(--text-muted)]">{formatFileSize(artifact.size)}</p>
            </div>
            {ext && (
              <span className="type-badge flex-shrink-0 rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-muted)] leading-none">
                {ext}
              </span>
            )}
          </div>
        </div>
        <div className="px-3 pb-2.5 flex items-center gap-1.5">
          <span className="type-support flex-1 truncate text-[var(--text-muted)]">{taskTitle}</span>
          <span className="type-meta flex-shrink-0 text-[var(--text-muted)]">
            {formatRelativeTime(new Date(artifact.createdAt))}
          </span>
        </div>
      </motion.button>
    </div>
  );
}
