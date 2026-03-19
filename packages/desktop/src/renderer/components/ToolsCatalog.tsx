import { Wrench, Plug } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { ToolGroup, ToolEntry } from '@clawwork/shared';

interface ToolsCatalogProps {
  groups: ToolGroup[];
  onToolSelect?: (tool: ToolEntry) => void;
}

export default function ToolsCatalog({ groups, onToolSelect }: ToolsCatalogProps) {
  const { t } = useTranslation();
  if (groups.length === 0) return null;

  const totalTools = groups.reduce((sum, g) => sum + g.tools.length, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm',
            'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            'hover:bg-[var(--bg-hover)] transition-colors',
          )}
        >
          <Wrench size={14} className="flex-shrink-0" />
          <span>{t('rightPanel.toolCount', { count: totalTools })}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[360px] overflow-y-auto w-[280px]">
        {groups.map((group, gi) => (
          <div key={group.id}>
            {gi > 0 && <DropdownMenuSeparator />}
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              {group.source === 'plugin' ? (
                <Plug size={14} className="text-[var(--text-muted)]" />
              ) : (
                <Wrench size={14} className="text-[var(--text-muted)]" />
              )}
              <span className="text-xs font-medium text-[var(--text-primary)]">{group.label}</span>
              <span className="text-[11px] text-[var(--text-muted)] ml-auto">{group.tools.length}</span>
            </div>
            {group.tools.map((tool) => (
              <DropdownMenuItem
                key={tool.id}
                className="flex flex-col items-start gap-0 py-1.5"
                onSelect={() => onToolSelect?.(tool)}
              >
                <span className="text-xs text-[var(--text-secondary)]">{tool.label}</span>
                {tool.description && (
                  <span className="text-xs text-[var(--text-muted)] line-clamp-1">{tool.description}</span>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
