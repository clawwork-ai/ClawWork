import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, MessageSquare, Pencil, Check, X, Loader2, Puzzle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Team } from '@clawwork/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ConfirmDialog from '@/components/semantic/ConfirmDialog';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import TeamFileTree, { type TreeFile } from './TeamFileTree';

interface SkillStatusEntry {
  id: string;
  name: string;
  description?: string;
  eligible?: boolean;
}

interface TeamDetailViewProps {
  team: Team;
  onBack: () => void;
  onStartChat: () => void;
  onEdit: () => void;
}

export default function TeamDetailView({ team, onBack, onStartChat, onEdit }: TeamDetailViewProps) {
  const { t } = useTranslation();
  const agentCatalog = useUiStore((s) => s.agentCatalogByGateway[team.gatewayId]);
  const catalogById = useMemo(
    () => new Map((agentCatalog?.agents ?? []).map((a) => [a.id, a])),
    [agentCatalog?.agents],
  );
  const [selectedFile, setSelectedFile] = useState<TreeFile | null>(null);
  const [agentFilesMap, setAgentFilesMap] = useState<Record<string, { name: string }[]>>({});
  const [skillsMap, setSkillsMap] = useState<Record<string, SkillStatusEntry[]>>({});
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [discardTarget, setDiscardTarget] = useState<TreeFile | null>(null);
  const fetchedFiles = useRef(new Set<string>());
  const fetchedSkills = useRef(new Set<string>());
  const loadSeq = useRef(0);

  useEffect(() => {
    setSelectedFile({ id: 'team-md', label: 'TEAM.md', kind: 'team-md' });
    setFileContent(team.description || '');
    setEditingContent(null);
    fetchedFiles.current.clear();
    fetchedSkills.current.clear();
  }, [team.id]);

  useEffect(() => {
    if (selectedFile?.kind === 'team-md') {
      setFileContent(team.description || '');
    }
  }, [team.description, selectedFile?.kind]);

  useEffect(() => {
    for (const agent of team.agents) {
      if (fetchedFiles.current.has(agent.agentId)) continue;
      fetchedFiles.current.add(agent.agentId);
      const agentId = agent.agentId;
      window.clawwork.listAgentFiles(team.gatewayId, agentId).then((res) => {
        if (!res.ok || !res.result) {
          fetchedFiles.current.delete(agentId);
          return;
        }
        const data = res.result as { files: { name: string }[] };
        setAgentFilesMap((prev) => ({ ...prev, [agentId]: data.files ?? [] }));
      });
    }
  }, [team.agents, team.gatewayId]);

  useEffect(() => {
    for (const agent of team.agents) {
      if (fetchedSkills.current.has(agent.agentId)) continue;
      fetchedSkills.current.add(agent.agentId);
      const agentId = agent.agentId;
      window.clawwork.getSkillsStatus(team.gatewayId, agentId).then((res) => {
        if (!res.ok || !res.result) {
          fetchedSkills.current.delete(agentId);
          return;
        }
        const data = res.result as { skills?: SkillStatusEntry[] };
        setSkillsMap((prev) => ({ ...prev, [agentId]: data.skills ?? [] }));
      });
    }
  }, [team.agents, team.gatewayId]);

  const agentNodes = useMemo(
    () =>
      team.agents.map((a) => {
        const catalog = catalogById.get(a.agentId);
        return {
          agentId: a.agentId,
          name: catalog?.name ?? a.agentId,
          role: a.role,
          isManager: a.isManager,
          model: catalog?.model?.primary,
          files: (agentFilesMap[a.agentId] ?? []).map((f) => ({
            id: `agent-file-${a.agentId}-${f.name}`,
            label: f.name,
            kind: 'agent-file' as const,
            agentId: a.agentId,
          })),
          skillCount: (skillsMap[a.agentId] ?? []).length,
        };
      }),
    [team.agents, agentFilesMap, skillsMap, catalogById],
  );

  const allSkills = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string }[] = [];
    for (const agent of team.agents) {
      for (const skill of skillsMap[agent.agentId] ?? []) {
        if (seen.has(skill.id)) continue;
        seen.add(skill.id);
        result.push({ id: skill.id, name: skill.name || skill.id });
      }
    }
    return result;
  }, [team.agents, skillsMap]);

  const isDirty = editingContent !== null && editingContent !== fileContent;

  const loadFile = useCallback(
    async (file: TreeFile) => {
      setSelectedFile(file);
      setEditingContent(null);
      if (file.kind === 'team-md') {
        setFileContent(team.description || '');
        return;
      }
      if (file.kind === 'agent-file' && file.agentId) {
        const seq = ++loadSeq.current;
        setLoadingContent(true);
        const res = await window.clawwork.getAgentFile(team.gatewayId, file.agentId, file.label);
        if (seq !== loadSeq.current) return;
        setLoadingContent(false);
        const data = res.ok ? (res.result as { file?: { content?: string } }) : null;
        setFileContent(data?.file?.content ?? '');
        return;
      }
      setFileContent(null);
    },
    [team.gatewayId, team.description],
  );

  const handleSelectFile = useCallback(
    (file: TreeFile) => {
      if (isDirty) {
        setDiscardTarget(file);
        return;
      }
      loadFile(file);
    },
    [isDirty, loadFile],
  );

  const confirmDiscard = useCallback(() => {
    if (discardTarget) loadFile(discardTarget);
    setDiscardTarget(null);
  }, [discardTarget, loadFile]);

  const cancelDiscard = useCallback(() => {
    setDiscardTarget(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedFile?.agentId || selectedFile.kind !== 'agent-file' || editingContent === null) return;
    setSaving(true);
    try {
      const res = await window.clawwork.setAgentFile(
        team.gatewayId,
        selectedFile.agentId,
        selectedFile.label,
        editingContent,
      );
      if (res.ok) {
        toast.success(t('teams.detail.fileSaved'));
        setFileContent(editingContent);
        setEditingContent(null);
      } else {
        toast.error(res.error ?? t('teams.detail.fileSaveFailed'));
      }
    } finally {
      setSaving(false);
    }
  }, [selectedFile, editingContent, team.gatewayId, t]);

  const agentSkills =
    selectedFile?.kind === 'agent-skills' && selectedFile.agentId ? (skillsMap[selectedFile.agentId] ?? []) : [];
  const skillDetail = useMemo(() => {
    if (selectedFile?.kind !== 'skill-item' || !selectedFile.skillId) return null;
    for (const skills of Object.values(skillsMap)) {
      const found = skills.find((s) => s.id === selectedFile.skillId);
      if (found) return found;
    }
    return null;
  }, [selectedFile, skillsMap]);

  const isEditable = selectedFile?.kind === 'agent-file';
  const isEditing = editingContent !== null;

  return (
    <div className="flex h-full flex-col">
      <header className="titlebar-drag flex items-center justify-between border-b border-[var(--border)] px-5 h-[var(--density-toolbar-height)] flex-shrink-0">
        <div className="titlebar-no-drag flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft size={16} />
          </Button>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
            <span className="emoji-md">{team.emoji}</span>
          </span>
          <h2 className="type-section-title truncate text-[var(--text-primary)]">{team.name}</h2>
        </div>
        <div className="titlebar-no-drag flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil size={14} />
            {t('teams.editTeam')}
          </Button>
          <Button size="sm" onClick={onStartChat}>
            <MessageSquare size={14} />
            {t('teams.startChat')}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <TeamFileTree
          agents={agentNodes}
          skills={allSkills}
          selectedFileId={selectedFile?.id ?? null}
          onSelectFile={handleSelectFile}
        />

        <div className="flex flex-1 flex-col min-w-0">
          {selectedFile && (
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 flex-shrink-0">
              <span className="type-support text-[var(--text-muted)] truncate">{selectedFile.label}</span>
              {isEditable && !isEditing && (
                <Button variant="ghost" size="icon-sm" onClick={() => setEditingContent(fileContent ?? '')}>
                  <Pencil size={13} />
                </Button>
              )}
              {isEditing && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditingContent(null)} disabled={saving}>
                    <X size={14} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </Button>
                </div>
              )}
            </div>
          )}

          <ScrollArea className="flex-1 p-4">
            {loadingContent && (
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Loader2 size={14} className="animate-spin" />
                <span className="type-body">{t('common.loading')}</span>
              </div>
            )}

            {!loadingContent &&
              (selectedFile?.kind === 'team-md' || (selectedFile?.kind === 'agent-file' && !isEditing)) &&
              fileContent !== null && (
                <pre className="type-mono-data whitespace-pre-wrap break-words text-[var(--text-secondary)]">
                  {fileContent || (selectedFile.kind === 'team-md' ? t('teams.detail.noDescription') : '')}
                </pre>
              )}

            {!loadingContent && selectedFile?.kind === 'agent-file' && isEditing && (
              <textarea
                value={editingContent ?? ''}
                onChange={(e) => setEditingContent(e.target.value)}
                className={cn(
                  'type-mono-data h-full w-full resize-none overflow-auto whitespace-pre-wrap break-words',
                  'rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3',
                  'text-[var(--text-secondary)] outline-none ring-accent-focus',
                )}
              />
            )}

            {!loadingContent && selectedFile?.kind === 'agent-skills' && (
              <div className="space-y-2">
                {agentSkills.length === 0 ? (
                  <p className="type-body text-[var(--text-muted)]">{t('teams.detail.noSkills')}</p>
                ) : (
                  agentSkills.map((skill) => (
                    <div key={skill.id} className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3">
                      <Puzzle size={14} className="mt-0.5 flex-shrink-0 text-[var(--text-muted)]" />
                      <div className="min-w-0">
                        <p className="type-support font-medium text-[var(--text-primary)]">{skill.name || skill.id}</p>
                        {skill.description && (
                          <p className="type-meta text-[var(--text-secondary)]">{skill.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!loadingContent && selectedFile?.kind === 'skill-item' && skillDetail && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Puzzle size={16} className="text-[var(--text-muted)]" />
                  <h3 className="type-section-title text-[var(--text-primary)]">
                    {skillDetail.name || skillDetail.id}
                  </h3>
                </div>
                {skillDetail.description && (
                  <p className="type-body text-[var(--text-secondary)]">{skillDetail.description}</p>
                )}
                <div className="type-meta text-[var(--text-muted)]">
                  ID: <span className="type-code-inline">{skillDetail.id}</span>
                </div>
              </div>
            )}

            {!loadingContent && !selectedFile && (
              <p className="type-body text-[var(--text-muted)]">{t('teams.detail.selectFile')}</p>
            )}
          </ScrollArea>
        </div>
      </div>
      <ConfirmDialog
        open={!!discardTarget}
        variant="danger"
        title={t('teams.detail.unsavedTitle')}
        description={t('teams.detail.unsavedDesc')}
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </div>
  );
}
