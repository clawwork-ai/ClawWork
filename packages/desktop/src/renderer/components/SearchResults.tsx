import { motion } from 'framer-motion';
import { MessageSquare, FileText, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motionDuration, motionEase } from '@/styles/design-tokens';

export interface SearchResult {
  type: 'task' | 'message' | 'artifact';
  id: string;
  title: string;
  snippet: string;
  taskId?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
}

const ICON_MAP = {
  task: FolderOpen,
  message: MessageSquare,
  artifact: FileText,
} as const;

const LABEL_KEYS = {
  task: 'search.tasks',
  message: 'search.messages',
  artifact: 'search.files',
} as const;

const listItem = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: motionDuration.normal, ease: motionEase.standard },
};

const listItemStagger = motionDuration.fast / 3;

function highlightSnippet(text: string): React.ReactNode[] {
  const parts = text.split(/(<<.*?>>)/g);
  return parts.map((part, i) => {
    if (part.startsWith('<<') && part.endsWith('>>')) {
      return (
        <span key={i} className="text-[var(--accent)] font-medium">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

export default function SearchResults({ results, onSelect }: SearchResultsProps) {
  const { t } = useTranslation();

  const grouped = {
    task: results.filter((r) => r.type === 'task'),
    message: results.filter((r) => r.type === 'message'),
    artifact: results.filter((r) => r.type === 'artifact'),
  };

  const sections = (['task', 'message', 'artifact'] as const).filter((type) => grouped[type].length > 0);

  if (sections.length === 0) {
    return <div className="type-body px-4 py-6 text-center text-[var(--text-muted)]">{t('search.noResults')}</div>;
  }

  return (
    <ScrollArea className="max-h-96">
      <div className="p-2 space-y-3">
        {sections.map((type) => (
          <div key={type}>
            <p className="type-meta px-2 pb-1 text-[var(--text-muted)]">
              {t(LABEL_KEYS[type])} ({grouped[type].length})
            </p>
            {grouped[type].map((result, idx) => {
              const Icon = ICON_MAP[result.type];
              return (
                <motion.button
                  key={result.id}
                  {...listItem}
                  transition={{ ...listItem.transition, delay: idx * listItemStagger }}
                  onClick={() => onSelect(result)}
                  className={cn(
                    'w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left',
                    'transition-colors hover:bg-[var(--bg-hover)]',
                    'focus-visible:outline-none glow-focus',
                  )}
                >
                  <Icon size={15} className="mt-0.5 flex-shrink-0 text-[var(--text-muted)]" />
                  <div className="min-w-0 flex-1">
                    <p className="type-label truncate text-[var(--text-primary)]">
                      {result.title || t('common.noTitle')}
                    </p>
                    <p className="type-support mt-0.5 truncate text-[var(--text-secondary)]">
                      {highlightSnippet(result.snippet)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
