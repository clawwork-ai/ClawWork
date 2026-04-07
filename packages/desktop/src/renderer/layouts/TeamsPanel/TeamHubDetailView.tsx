import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Download, Check, Loader2, Package, User, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { TeamHubEntry, ParsedTeam, AgentFileSet } from '@clawwork/shared';
import { extractSkillSlugs } from '@clawwork/core';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUiStore } from '@/stores/uiStore';
import { useTeamStore } from '@/stores/teamStore';
import { cn } from '@/lib/utils';
import { inputClass } from './utils';
import TeamFileTree, { type TreeFile } from './TeamFileTree';
import InstallStep from './InstallStep';
import { useTeamHubInstall } from './useTeamHubInstall';
import type { AgentDraft } from './types';

interface TeamHubDetailViewProps {
  entry: TeamHubEntry & { _registryId: string };
  onBack: () => void;
}

export default function TeamHubDetailView({ entry, onBack }: TeamHubDetailViewProps) {
  const { t } = useTranslation();
  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const teamsMap = useTeamStore((s) => s.teams);
  const loadTeams = useTeamStore((s) => s.loadTeams);

  const gateways = useMemo(() => Object.entries(gatewayInfoMap), [gatewayInfoMap]);
  const [gatewayId, setGatewayId] = useState(() => gateways[0]?.[0] ?? '');

  const [parsedData, setParsedData] = useState<{ parsed: ParsedTeam; agentFiles: Record<string, AgentFileSet> } | null>(
    null,
  );
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [selectedFile, setSelectedFile] = useState<TreeFile | null>({
    id: 'team-md',
    label: 'TEAM.md',
    kind: 'team-md',
  });

  const installed = useMemo(
    () => Object.values(teamsMap).some((team) => team.hubSlug === entry.slug),
    [teamsMap, entry.slug],
  );

  const { phase, installEvents, error, install } = useTeamHubInstall(() => {
    loadTeams();
    toast.success(t('teamshub.installSuccess'));
  });

  useEffect(() => {
    let cancelled = false;
    setLoadingPreview(true);
    setParsedData(null);

    window.clawwork.hubDownloadTeam(entry._registryId, entry.slug).then((res) => {
      if (cancelled) return;
      setLoadingPreview(false);
      if (!res.ok || !res.result) return;
      const data = res.result as { parsed: ParsedTeam; agentFiles: Record<string, AgentFileSet> };
      setParsedData(data);
    });

    return () => {
      cancelled = true;
    };
  }, [entry._registryId, entry.slug]);

  const agentNodes = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.parsed.agents.map((a) => {
      const files = parsedData.agentFiles[a.id];
      const fileList: TreeFile[] = [];
      if (files?.agentMd)
        fileList.push({ id: `hub-file-${a.id}-IDENTITY.md`, label: 'IDENTITY.md', kind: 'agent-file', agentId: a.id });
      if (files?.soulMd)
        fileList.push({ id: `hub-file-${a.id}-SOUL.md`, label: 'SOUL.md', kind: 'agent-file', agentId: a.id });
      const skills = files ? extractSkillSlugs(files) : [];
      return {
        agentId: a.id,
        name: a.name,
        role: a.role,
        isManager: a.role === 'coordinator',
        files: fileList,
        skillCount: skills.length,
      };
    });
  }, [parsedData]);

  const allSkills = useMemo(() => {
    if (!parsedData) return [];
    const seen = new Set<string>();
    const result: { id: string; name: string }[] = [];
    for (const a of parsedData.parsed.agents) {
      const files = parsedData.agentFiles[a.id];
      if (!files) continue;
      for (const skill of extractSkillSlugs(files)) {
        if (seen.has(skill.id)) continue;
        seen.add(skill.id);
        result.push({ id: skill.id, name: skill.id });
      }
    }
    return result;
  }, [parsedData]);

  const fileContent = useMemo(() => {
    if (!selectedFile || !parsedData) return null;
    if (selectedFile.kind === 'team-md') return parsedData.parsed.body || parsedData.parsed.description || '';
    if (selectedFile.kind === 'agent-file' && selectedFile.agentId) {
      const files = parsedData.agentFiles[selectedFile.agentId];
      if (!files) return '';
      if (selectedFile.label === 'IDENTITY.md') return files.agentMd ?? '';
      if (selectedFile.label === 'SOUL.md') return files.soulMd ?? '';
    }
    return null;
  }, [selectedFile, parsedData]);

  const agentSkills = useMemo(() => {
    if (!selectedFile || selectedFile.kind !== 'agent-skills' || !selectedFile.agentId || !parsedData) return [];
    const files = parsedData.agentFiles[selectedFile.agentId];
    if (!files) return [];
    return extractSkillSlugs(files).map((s) => ({ id: s.id, name: s.id }));
  }, [selectedFile, parsedData]);

  const installAgentDrafts: AgentDraft[] = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.parsed.agents.map((a) => {
      const files = parsedData.agentFiles[a.id];
      const skills = files ? extractSkillSlugs(files) : [];
      return {
        uid: crypto.randomUUID(),
        name: a.name,
        description: '',
        role: a.role,
        model: '',
        agentMd: files?.agentMd ?? '',
        soulMd: files?.soulMd ?? '',
        skills: skills.map((s) => s.id),
      };
    });
  }, [parsedData]);

  const handleInstall = useCallback(() => {
    if (!gatewayId || phase !== 'idle') return;
    install(entry, gatewayId);
  }, [install, entry, gatewayId, phase]);

  const showProgress = phase === 'downloading' || phase === 'installing' || phase === 'done' || phase === 'error';

  return (
    <div className="flex h-full flex-col">
      <header className="titlebar-drag flex items-center justify-between border-b border-[var(--border)] px-5 h-[var(--density-toolbar-height)] flex-shrink-0">
        <div className="titlebar-no-drag flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft size={16} />
          </Button>
          <span className="type-body text-[var(--text-muted)]">{t('teamshub.tabHub')}</span>
        </div>
        {showProgress && (
          <span className="titlebar-no-drag type-meta text-[var(--text-muted)]">
            {phase === 'done'
              ? t('teamshub.installed')
              : phase === 'error'
                ? t('teams.wizard.installError')
                : t('teams.wizard.installing')}
          </span>
        )}
      </header>

      {showProgress ? (
        <div className="flex-1 p-6">
          <InstallStep
            teamInfo={{ name: entry.name, emoji: entry.emoji, description: entry.description }}
            agents={installAgentDrafts}
            status={
              phase === 'downloading'
                ? 'installing'
                : phase === 'done'
                  ? 'done'
                  : phase === 'error'
                    ? 'error'
                    : 'installing'
            }
            events={installEvents}
          />
          {error && <p className="type-meta text-[var(--text-danger)] mt-3">{error}</p>}
        </div>
      ) : loadingPreview ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
        </div>
      ) : parsedData ? (
        <div className="flex flex-1 flex-col min-h-0">
          <div className="border-b border-[var(--border)] px-6 py-5 space-y-3 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)]">
                  <span className="emoji-lg">{entry.emoji}</span>
                </span>
                <div className="min-w-0 space-y-1.5">
                  <h2 className="type-page-title text-[var(--text-primary)]">{entry.name}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    {entry.version && (
                      <span className="type-meta flex items-center gap-1 text-[var(--text-muted)]">
                        <Package size={12} />v{entry.version}
                      </span>
                    )}
                    {entry.author && (
                      <span className="type-meta flex items-center gap-1 text-[var(--text-muted)]">
                        <User size={12} />
                        {entry.author}
                      </span>
                    )}
                    {entry.category && <span className="type-meta text-[var(--text-secondary)]">{entry.category}</span>}
                  </div>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="type-support flex items-center gap-1 rounded-full bg-[var(--accent-dim)] px-2 py-0.5 text-[var(--accent)]"
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {installed ? (
                  <span className="type-meta flex items-center gap-1 text-[var(--accent)]">
                    <Check size={14} />
                    {t('teamshub.installed')}
                  </span>
                ) : (
                  <>
                    {gateways.length > 1 && (
                      <select
                        value={gatewayId}
                        onChange={(e) => setGatewayId(e.target.value)}
                        className={cn(inputClass, 'h-7 max-w-36 type-meta')}
                      >
                        {gateways.map(([id, gw]) => (
                          <option key={id} value={id}>
                            {gw.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <Button size="sm" onClick={handleInstall} disabled={!gatewayId || !parsedData}>
                      <Download size={14} />
                      {t('teamshub.install')}
                    </Button>
                  </>
                )}
              </div>
            </div>
            {entry.description && <p className="type-body text-[var(--text-secondary)]">{entry.description}</p>}
          </div>

          <div className="flex flex-1 min-h-0">
            <TeamFileTree
              agents={agentNodes}
              skills={allSkills}
              selectedFileId={selectedFile?.id ?? null}
              onSelectFile={setSelectedFile}
            />

            <div className="flex flex-1 flex-col min-w-0">
              {selectedFile && (
                <div className="flex items-center border-b border-[var(--border)] px-4 py-2 flex-shrink-0">
                  <span className="type-support text-[var(--text-muted)] truncate">{selectedFile.label}</span>
                </div>
              )}

              <ScrollArea className="flex-1 p-4">
                {(selectedFile?.kind === 'team-md' || selectedFile?.kind === 'agent-file') && fileContent !== null && (
                  <pre className="type-mono-data whitespace-pre-wrap break-words text-[var(--text-secondary)]">
                    {fileContent || (selectedFile.kind === 'team-md' ? t('teams.detail.noDescription') : '')}
                  </pre>
                )}

                {selectedFile?.kind === 'agent-skills' && (
                  <div className="space-y-2">
                    {agentSkills.length === 0 ? (
                      <p className="type-body text-[var(--text-muted)]">{t('teams.detail.noSkills')}</p>
                    ) : (
                      agentSkills.map((skill) => (
                        <div
                          key={skill.id}
                          className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3"
                        >
                          <div className="min-w-0">
                            <p className="type-support font-medium text-[var(--text-primary)]">{skill.name}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedFile?.kind === 'skill-item' && selectedFile.skillId && (
                  <div className="space-y-3">
                    <h3 className="type-section-title text-[var(--text-primary)]">{selectedFile.skillId}</h3>
                    <div className="type-meta text-[var(--text-muted)]">
                      ID: <span className="type-code-inline">{selectedFile.skillId}</span>
                    </div>
                  </div>
                )}

                {!selectedFile && <p className="type-body text-[var(--text-muted)]">{t('teams.detail.selectFile')}</p>}
              </ScrollArea>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
