import { useState, useCallback } from 'react';
import { ChevronRight, FileText, FolderOpen, Folder, Puzzle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface TreeFile {
  id: string;
  label: string;
  kind: 'team-md' | 'agent-file' | 'agent-skills' | 'skill-item';
  agentId?: string;
  agentName?: string;
  skillId?: string;
}

interface AgentNode {
  agentId: string;
  name: string;
  role: string;
  isManager: boolean;
  model?: string;
  files: TreeFile[];
  skillCount: number;
}

interface SkillNode {
  id: string;
  name: string;
}

interface TeamFileTreeProps {
  agents: AgentNode[];
  skills: SkillNode[];
  selectedFileId: string | null;
  onSelectFile: (file: TreeFile) => void;
}

const ITEM_BASE =
  'glow-focus type-support flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-tertiary)]';
const ICON_CLS = 'flex-shrink-0 text-[var(--text-muted)]';

function TreeItem({
  label,
  icon,
  depth,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  depth: number;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        ITEM_BASE,
        selected ? 'bg-[var(--bg-tertiary)] font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
      )}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function FolderItem({
  label,
  badge,
  depth,
  open,
  onToggle,
  children,
}: {
  label: string;
  badge?: React.ReactNode;
  depth: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Icon = open ? FolderOpen : Folder;
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={cn(ITEM_BASE, 'text-[var(--text-secondary)]')}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <ChevronRight size={12} className={cn('flex-shrink-0 transition-transform', open && 'rotate-90')} />
        <Icon size={13} className={ICON_CLS} />
        <span className="truncate">{label}</span>
        {badge}
      </button>
      {open && children}
    </>
  );
}

export default function TeamFileTree({ agents, skills, selectedFileId, onSelectFile }: TeamFileTreeProps) {
  const { t } = useTranslation();
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ agents: true });
  const toggle = useCallback((key: string) => setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] })), []);

  return (
    <div className="w-48 flex-shrink-0 space-y-0.5 overflow-y-auto border-r border-[var(--border)] py-2 px-1">
      <TreeItem
        label="TEAM.md"
        icon={<FileText size={13} className={ICON_CLS} />}
        depth={0}
        selected={selectedFileId === 'team-md'}
        onClick={() => onSelectFile({ id: 'team-md', label: 'TEAM.md', kind: 'team-md' })}
      />

      <FolderItem
        label={t('teams.detail.agents')}
        depth={0}
        open={!!openFolders.agents}
        onToggle={() => toggle('agents')}
      >
        {agents.map((agent) => (
          <FolderItem
            key={agent.agentId}
            label={agent.name}
            badge={
              <>
                {agent.isManager && (
                  <span className="type-meta flex-shrink-0 rounded-full bg-[var(--bg-tertiary)] px-1.5 py-px text-[var(--accent)]">
                    {t('teams.wizard.coordinator')}
                  </span>
                )}
                {agent.model && (
                  <span className="type-meta flex-shrink-0 truncate max-w-24 text-[var(--text-muted)]">
                    {agent.model}
                  </span>
                )}
              </>
            }
            depth={1}
            open={!!openFolders[`agent-${agent.agentId}`]}
            onToggle={() => toggle(`agent-${agent.agentId}`)}
          >
            {agent.files.map((file) => (
              <TreeItem
                key={file.id}
                label={file.label}
                icon={<FileText size={12} className={ICON_CLS} />}
                depth={2}
                selected={selectedFileId === file.id}
                onClick={() => onSelectFile(file)}
              />
            ))}
            {agent.skillCount > 0 && (
              <TreeItem
                label={`${agent.skillCount} skills`}
                icon={<Puzzle size={12} className={ICON_CLS} />}
                depth={2}
                selected={selectedFileId === `agent-skills-${agent.agentId}`}
                onClick={() =>
                  onSelectFile({
                    id: `agent-skills-${agent.agentId}`,
                    label: `${agent.name} Skills`,
                    kind: 'agent-skills',
                    agentId: agent.agentId,
                    agentName: agent.name,
                  })
                }
              />
            )}
          </FolderItem>
        ))}
      </FolderItem>

      <FolderItem
        label={t('teams.detail.skills')}
        depth={0}
        open={!!openFolders.skills}
        onToggle={() => toggle('skills')}
      >
        {skills.length === 0 ? (
          <div className="type-meta px-2 py-1 text-[var(--text-muted)]" style={{ paddingLeft: '22px' }}>
            {t('teams.detail.noSkills')}
          </div>
        ) : (
          skills.map((skill) => (
            <TreeItem
              key={skill.id}
              label={skill.name}
              icon={<Puzzle size={12} className={ICON_CLS} />}
              depth={1}
              selected={selectedFileId === `skill-${skill.id}`}
              onClick={() =>
                onSelectFile({ id: `skill-${skill.id}`, label: skill.name, kind: 'skill-item', skillId: skill.id })
              }
            />
          ))
        )}
      </FolderItem>
    </div>
  );
}
