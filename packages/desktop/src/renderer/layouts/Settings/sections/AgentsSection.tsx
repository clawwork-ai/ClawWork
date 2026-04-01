import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Pencil,
  Bot,
  Crown,
  Loader2,
  FileText,
  X,
  Server,
  Wrench,
  ChevronDown,
  Save,
  ImagePlus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUiStore } from '@/stores/uiStore';
import type {
  AgentInfo,
  AgentListResponse,
  AgentFileEntry,
  ModelCatalogEntry,
  SkillRequirements,
  SkillStatusEntry,
  SkillStatusReport,
} from '@clawwork/shared';
import EmptyState from '@/components/semantic/EmptyState';
import LoadingBlock from '@/components/semantic/LoadingBlock';
import SettingGroup from '@/components/semantic/SettingGroup';
import ToolbarButton from '@/components/semantic/ToolbarButton';
import { AVATAR_ACCEPT, readFileAsDataUrl, validateAvatarFile } from '@/lib/avatar-utils';

const EMPTY_MODELS: ModelCatalogEntry[] = [];

type AgentDetailSection = 'files' | 'skills';

interface AgentFormData {
  name: string;
  workspace: string;
  avatar: string;
  model: string;
}

const EMPTY_FORM: AgentFormData = { name: '', workspace: '', avatar: '', model: '' };

const inputClass = cn(
  'flex-1 h-[var(--density-control-height-lg)] px-3 py-2 rounded-md',
  'bg-[var(--bg-tertiary)] border border-[var(--border)]',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
  'outline-none ring-accent-focus transition-colors',
);

function AgentCard({
  agent,
  isDefault,
  isEditing,
  workspace,
  expanded,
  activeSection,
  files,
  loadingFiles,
  skills,
  loadingSkills,
  selectedFile,
  fileContent,
  loadingFileContent,
  editingFileContent,
  savingFile,
  onEdit,
  onDelete,
  onToggleExpand,
  onSelectSection,
  onSelectFile,
  onEditFile,
  onSaveFile,
  onCancelEdit,
  onEditFileContentChange,
}: {
  agent: AgentInfo;
  isDefault: boolean;
  isEditing: boolean;
  workspace: string | null;
  expanded: boolean;
  activeSection: AgentDetailSection;
  files: AgentFileEntry[];
  loadingFiles: boolean;
  skills: SkillStatusEntry[];
  loadingSkills: boolean;
  selectedFile: string | null;
  fileContent: string | null;
  loadingFileContent: boolean;
  editingFileContent: string | null;
  savingFile: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  onSelectSection: (section: AgentDetailSection) => void;
  onSelectFile: (name: string) => void;
  onEditFile: () => void;
  onSaveFile: () => void;
  onCancelEdit: () => void;
  onEditFileContentChange: (content: string) => void;
}) {
  const { t } = useTranslation();
  const emoji = agent.identity?.emoji;
  const availableSkills = skills.filter((skill) => skill.eligible);
  const unavailableSkills = skills.filter((skill) => !skill.eligible);
  const [collapsedSections, setCollapsedSections] = useState<Record<'available' | 'unavailable', boolean>>({
    available: false,
    unavailable: false,
  });
  const toggleSection = (key: 'available' | 'unavailable') =>
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const summarizeMissing = (requirements: SkillRequirements): string | null => {
    const missingParts: string[] = [];
    if (requirements.bins.length > 0)
      missingParts.push(t('settings.agentSkillMissingBins', { count: requirements.bins.length }));
    if (requirements.anyBins.length > 0) {
      missingParts.push(t('settings.agentSkillMissingAnyBins', { count: requirements.anyBins.length }));
    }
    if (requirements.env.length > 0)
      missingParts.push(t('settings.agentSkillMissingEnv', { count: requirements.env.length }));
    if (requirements.config.length > 0) {
      missingParts.push(t('settings.agentSkillMissingConfig', { count: requirements.config.length }));
    }
    if (requirements.os.length > 0)
      missingParts.push(t('settings.agentSkillMissingOs', { count: requirements.os.length }));
    return missingParts.length > 0 ? missingParts.join(' • ') : null;
  };

  const getSkillReason = (skill: SkillStatusEntry): string | null => {
    if (skill.disabled) return t('settings.agentSkillReasonDisabled');
    if (skill.blockedByAllowlist) return t('settings.agentSkillReasonBlocked');
    const failedConfigChecks = skill.configChecks.filter((check) => !check.satisfied).length;
    if (failedConfigChecks > 0) {
      return t('settings.agentSkillReasonConfig', { count: failedConfigChecks });
    }
    return summarizeMissing(skill.missing);
  };

  return (
    <motion.div
      {...motionPresets.listItem}
      className={cn(
        'surface-card rounded-xl px-4 py-3.5 border transition-colors',
        isEditing ? 'border-[var(--accent)]/40' : 'border-[var(--border-subtle)]',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            isDefault ? 'bg-[var(--accent-soft)]' : 'bg-[var(--bg-tertiary)]',
          )}
        >
          {agent.identity?.avatarUrl ? (
            <img src={agent.identity.avatarUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
          ) : emoji ? (
            <span className="emoji-lg">{emoji}</span>
          ) : (
            <Bot size={16} className={isDefault ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="type-label truncate text-[var(--text-primary)]">{agent.name ?? agent.id}</span>
            {isDefault && (
              <span className="type-badge normal-case flex items-center gap-1 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[var(--accent)]">
                <Crown size={10} />
                {t('settings.agentDefault')}
              </span>
            )}
          </div>
          <p className="type-mono-data mt-0.5 truncate text-[var(--text-muted)]">{agent.id}</p>
          {workspace && <p className="type-support mt-0.5 truncate text-[var(--text-muted)] opacity-60">{workspace}</p>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-1 pl-3 border-l border-[var(--border-subtle)]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onToggleExpand} aria-label={t('settings.agentDetails')}>
                <FileText size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.agentDetails')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onEdit}
                aria-label={`${t('settings.edit')}: ${agent.name ?? agent.id}`}
              >
                <Pencil size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.edit')}</TooltipContent>
          </Tooltip>
          {agent.id !== 'main' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDelete}
                  aria-label={`${t('settings.remove')}: ${agent.name ?? agent.id}`}
                >
                  <Trash2 size={14} className="text-[var(--danger)]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('settings.remove')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex gap-3 h-70">
                <div className="w-32 flex-shrink-0 space-y-1 border-r border-[var(--border-subtle)] pr-3">
                  <button
                    type="button"
                    onClick={() => onSelectSection('files')}
                    className={cn(
                      'glow-focus type-support flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                      activeSection === 'files'
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]',
                    )}
                  >
                    <FileText size={12} className="flex-shrink-0" />
                    <span>{t('settings.agentFiles')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectSection('skills')}
                    className={cn(
                      'glow-focus type-support flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                      activeSection === 'skills'
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]',
                    )}
                  >
                    <Wrench size={12} className="flex-shrink-0" />
                    <span>{t('settings.agentSkills')}</span>
                  </button>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  {activeSection === 'files' ? (
                    loadingFiles ? (
                      <LoadingBlock mode="inline" label={t('settings.agentLoadingFiles')} className="py-2" />
                    ) : files.length === 0 ? (
                      <p className="type-support py-2 text-[var(--text-muted)]">{t('settings.agentNoFiles')}</p>
                    ) : (
                      <div className="flex gap-3 h-full">
                        <div className="w-40 flex-shrink-0 space-y-0.5 overflow-y-auto">
                          {files.map((f) => (
                            <button
                              key={f.name}
                              type="button"
                              onClick={() => onSelectFile(f.name)}
                              className={cn(
                                'glow-focus type-support flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors',
                                'hover:bg-[var(--bg-tertiary)]',
                                selectedFile === f.name
                                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium'
                                  : 'text-[var(--text-secondary)]',
                              )}
                            >
                              <FileText size={12} className="flex-shrink-0" />
                              <span className="type-code-inline truncate">{f.name}</span>
                              {f.missing && (
                                <span className="type-meta normal-case flex-shrink-0 rounded bg-[var(--bg-tertiary)] px-1 text-[var(--text-muted)]">
                                  {t('common.missing')}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          {!selectedFile ? (
                            <div className="type-support flex h-full items-center justify-center text-[var(--text-muted)]">
                              {t('settings.agentFilePreview')}
                            </div>
                          ) : loadingFileContent ? (
                            <div className="flex items-center justify-center h-full">
                              <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 mb-1.5 flex-shrink-0">
                                <span className="type-code-inline flex-1 truncate text-[var(--text-muted)]">
                                  {selectedFile}
                                </span>
                                {editingFileContent !== null ? (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          onClick={onCancelEdit}
                                          aria-label={t('settings.agentFileCancel')}
                                        >
                                          <X size={14} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>{t('settings.agentFileCancel')}</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          onClick={onSaveFile}
                                          disabled={savingFile}
                                          aria-label={t('settings.agentFileSave')}
                                        >
                                          {savingFile ? (
                                            <Loader2 size={14} className="animate-spin" />
                                          ) : (
                                            <Save size={14} />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>{t('settings.agentFileSave')}</TooltipContent>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={onEditFile}
                                        aria-label={t('settings.agentFileEdit')}
                                      >
                                        <Pencil size={14} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('settings.agentFileEdit')}</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              {editingFileContent !== null ? (
                                <textarea
                                  value={editingFileContent}
                                  onChange={(e) => onEditFileContentChange(e.target.value)}
                                  className="type-mono-data min-h-0 flex-1 w-full resize-none overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3 text-[var(--text-secondary)] outline-none ring-accent-focus"
                                />
                              ) : (
                                <pre className="type-code-block flex-1 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--bg-tertiary)] p-3 text-[var(--text-secondary)]">
                                  {fileContent ?? ''}
                                </pre>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  ) : loadingSkills ? (
                    <LoadingBlock mode="inline" label={t('settings.agentLoadingSkills')} className="py-2" />
                  ) : (
                    <div className="h-full overflow-y-auto space-y-3 pr-1">
                      {skills.length === 0 ? (
                        <p className="type-support py-2 text-[var(--text-muted)]">{t('settings.agentNoSkills')}</p>
                      ) : (
                        <>
                          {(
                            [
                              {
                                key: 'available' as const,
                                items: availableSkills,
                                label: t('settings.agentSkillsAvailable'),
                                emptyLabel: t('settings.agentNoAvailableSkills'),
                              },
                              {
                                key: 'unavailable' as const,
                                items: unavailableSkills,
                                label: t('settings.agentSkillsUnavailable'),
                                emptyLabel: t('settings.agentNoUnavailableSkills'),
                              },
                            ] as const
                          ).map((section) => (
                            <div key={section.key} className="space-y-2">
                              <button
                                type="button"
                                onClick={() => toggleSection(section.key)}
                                className="glow-focus flex w-full items-center gap-1.5 rounded-md py-1 text-left"
                              >
                                <ChevronDown
                                  size={14}
                                  className={cn(
                                    'text-[var(--text-muted)] transition-transform',
                                    collapsedSections[section.key] && '-rotate-90',
                                  )}
                                />
                                <span className="type-label text-[var(--text-secondary)]">{section.label}</span>
                                <span className="type-support text-[var(--text-muted)]">({section.items.length})</span>
                              </button>
                              {!collapsedSections[section.key] &&
                                (section.items.length === 0 ? (
                                  <p className="type-support pl-5 text-[var(--text-muted)]">{section.emptyLabel}</p>
                                ) : (
                                  section.items.map((skill) => {
                                    const reason = skill.eligible ? null : getSkillReason(skill);
                                    return (
                                      <div
                                        key={skill.skillKey}
                                        className="rounded-lg border border-[var(--border-subtle)] p-3"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="type-label text-[var(--text-primary)]">{skill.name}</span>
                                          <span
                                            className={cn(
                                              'type-badge rounded-md px-1.5 py-0.5',
                                              skill.eligible
                                                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
                                            )}
                                          >
                                            {skill.eligible
                                              ? t('settings.agentSkillAvailable')
                                              : t('settings.agentSkillUnavailable')}
                                          </span>
                                        </div>
                                        <p className="type-support mt-1 text-[var(--text-muted)]">
                                          {skill.description}
                                        </p>
                                        {reason && (
                                          <p className="type-support mt-2 text-[var(--text-muted)]">{reason}</p>
                                        )}
                                      </div>
                                    );
                                  })
                                ))}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AgentForm({
  editingId,
  form,
  setForm,
  models,
  saving,
  onSave,
  onClose,
}: {
  editingId: string | null;
  form: AgentFormData;
  setForm: React.Dispatch<React.SetStateAction<AgentFormData>>;
  models: ModelCatalogEntry[];
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      className="overflow-hidden"
    >
      <div className="surface-card space-y-4 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <span className="type-label text-[var(--text-primary)]">
            {editingId ? t('settings.editAgent') : t('settings.addAgent')}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('common.close')}>
            <X size={14} />
          </Button>
        </div>

        <div>
          <label className="type-label mb-1.5 block text-[var(--text-secondary)]">{t('settings.agentName')}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('settings.agentNamePlaceholder')}
            className={cn(inputClass, 'w-full')}
          />
        </div>

        <div>
          <label className="type-label mb-1.5 block text-[var(--text-secondary)]">{t('settings.agentWorkspace')}</label>
          {editingId ? (
            <p className="type-mono-data rounded-md border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-muted)] truncate">
              {form.workspace || '...'}
            </p>
          ) : (
            <input
              type="text"
              value={form.workspace}
              onChange={(e) => setForm((f) => ({ ...f, workspace: e.target.value }))}
              placeholder={t('settings.agentWorkspacePlaceholder')}
              className={cn(inputClass, 'w-full')}
            />
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <label className="type-label mb-1.5 block text-[var(--text-secondary)]">{t('settings.agentAvatar')}</label>
            <button
              type="button"
              className={cn(
                'relative w-12 h-12 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)]',
                'flex items-center justify-center overflow-hidden group transition-colors',
                'hover:border-[var(--accent)]',
              )}
              onClick={() => avatarInputRef.current?.click()}
              aria-label={t('settings.agentAvatarChange')}
            >
              {form.avatar ? (
                <>
                  <img src={form.avatar} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--overlay-scrim)] opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <button
                      type="button"
                      className="text-[var(--danger)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm((f) => ({ ...f, avatar: '' }));
                      }}
                      aria-label={t('settings.agentAvatarRemove')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <ImagePlus size={18} className="text-[var(--text-muted)]" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = '';
                const error = validateAvatarFile(file, t);
                if (error) {
                  toast.error(error);
                  return;
                }
                const dataUrl = await readFileAsDataUrl(file);
                setForm((f) => ({ ...f, avatar: dataUrl }));
              }}
            />
          </div>
          <div className="flex-1">
            <label className="type-label mb-1.5 block text-[var(--text-secondary)]">{t('settings.agentModel')}</label>
            <select
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className={cn(inputClass, 'w-full')}
            >
              <option value="">{t('settings.agentModelPlaceholder')}</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.id}
                  {m.provider ? ` (${m.provider})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={onClose} className="titlebar-no-drag">
            {t('common.cancel')}
          </Button>
          <Button variant="default" size="sm" onClick={onSave} disabled={saving} className="titlebar-no-drag gap-1.5">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editingId ? t('common.save') : t('settings.addAgent')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AgentsSection() {
  const { t } = useTranslation();
  const gatewayStatusMap = useUiStore((s) => s.gatewayStatusMap);
  const gatewayInfoMap = useUiStore((s) => s.gatewayInfoMap);
  const storeDefaultGatewayId = useUiStore((s) => s.defaultGatewayId);
  const agentCatalogByGateway = useUiStore((s) => s.agentCatalogByGateway);
  const setAgentCatalogForGateway = useUiStore((s) => s.setAgentCatalogForGateway);
  const modelCatalogByGateway = useUiStore((s) => s.modelCatalogByGateway);
  const skillsStatusByGateway = useUiStore((s) => s.skillsStatusByGateway);

  const connectedGatewayIds = Object.entries(gatewayStatusMap)
    .filter(([, status]) => status === 'connected')
    .map(([id]) => id)
    .sort();
  const connectedKey = connectedGatewayIds.join(',');

  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [form, setForm] = useState<AgentFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [expandedFilesAgentId, setExpandedFilesAgentId] = useState<string | null>(null);
  const [activeSectionByAgentId, setActiveSectionByAgentId] = useState<Record<string, AgentDetailSection>>({});
  const [agentFilesMap, setAgentFilesMap] = useState<Record<string, AgentFileEntry[]>>({});
  const [agentWorkspaceMap, setAgentWorkspaceMap] = useState<Record<string, string>>({});
  const [agentSkillsMap, setAgentSkillsMap] = useState<Record<string, SkillStatusEntry[]>>({});
  const [loadingFilesFor, setLoadingFilesFor] = useState<string | null>(null);
  const [loadingSkillsFor, setLoadingSkillsFor] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingFileContent, setLoadingFileContent] = useState(false);
  const [editingFileContent, setEditingFileContent] = useState<string | null>(null);
  const [savingFile, setSavingFile] = useState(false);

  useEffect(() => {
    if (selectedGatewayId && connectedGatewayIds.includes(selectedGatewayId)) return;
    const preferred =
      storeDefaultGatewayId && connectedGatewayIds.includes(storeDefaultGatewayId)
        ? storeDefaultGatewayId
        : (connectedGatewayIds[0] ?? null);
    setSelectedGatewayId(preferred);
  }, [connectedKey, connectedGatewayIds, selectedGatewayId, storeDefaultGatewayId]);

  const catalog = selectedGatewayId ? agentCatalogByGateway[selectedGatewayId] : null;
  const agents = useMemo(() => catalog?.agents ?? [], [catalog]);
  const defaultAgentId = catalog?.defaultId ?? 'main';
  const models = (selectedGatewayId ? modelCatalogByGateway[selectedGatewayId] : null) ?? EMPTY_MODELS;
  const gatewaySkillStatus = selectedGatewayId ? skillsStatusByGateway[selectedGatewayId] : undefined;

  const refreshAgents = useCallback(async () => {
    if (!selectedGatewayId) return;
    const res = await window.clawwork.listAgents(selectedGatewayId);
    if (res.ok && res.result) {
      const data = res.result as unknown as AgentListResponse;
      setAgentCatalogForGateway(selectedGatewayId, data.agents, data.defaultId);
    }
  }, [selectedGatewayId, setAgentCatalogForGateway]);

  useEffect(() => {
    if (selectedGatewayId && !agentCatalogByGateway[selectedGatewayId]) {
      refreshAgents();
    }
  }, [selectedGatewayId, agentCatalogByGateway, refreshAgents]);

  const deletingAgent = deletingAgentId ? agents.find((a) => a.id === deletingAgentId) : null;

  const fetchAgentMeta = useCallback(
    async (agentId: string) => {
      if (!selectedGatewayId) return;
      setLoadingFilesFor(agentId);
      const res = await window.clawwork.listAgentFiles(selectedGatewayId, agentId);
      setLoadingFilesFor(null);
      if (res.ok && res.result) {
        const data = res.result as unknown as { workspace?: string; files: AgentFileEntry[] };
        setAgentFilesMap((prev) => (prev[agentId] ? prev : { ...prev, [agentId]: data.files ?? [] }));
        if (data.workspace) {
          setAgentWorkspaceMap((prev) => (prev[agentId] ? prev : { ...prev, [agentId]: data.workspace as string }));
        }
      }
    },
    [selectedGatewayId],
  );

  const fetchAgentSkills = useCallback(
    async (agentId: string) => {
      if (!selectedGatewayId) return;
      setLoadingSkillsFor(agentId);
      const res = await window.clawwork.getSkillsStatus(selectedGatewayId, agentId);
      setLoadingSkillsFor((current) => (current === agentId ? null : current));
      if (res.ok && res.result) {
        const data = res.result as unknown as SkillStatusReport;
        setAgentSkillsMap((prev) => {
          const existing = prev[agentId];
          if (existing && JSON.stringify(existing) === JSON.stringify(data.skills ?? [])) return prev;
          return { ...prev, [agentId]: data.skills ?? [] };
        });
      }
    },
    [selectedGatewayId],
  );

  useEffect(() => {
    if (!gatewaySkillStatus || !catalog?.defaultId) return;
    setAgentSkillsMap((prev) =>
      prev[catalog.defaultId] ? prev : { ...prev, [catalog.defaultId]: gatewaySkillStatus.skills },
    );
  }, [gatewaySkillStatus, catalog?.defaultId]);

  useEffect(() => {
    setAgentSkillsMap({});
    setAgentFilesMap({});
    setAgentWorkspaceMap({});
    setActiveSectionByAgentId({});
    setExpandedFilesAgentId(null);
    setSelectedFileName(null);
    setFileContent(null);
    setEditingFileContent(null);
  }, [selectedGatewayId]);

  useEffect(() => {
    if (!selectedGatewayId || agents.length === 0) return;
    const ids = agents.map((a) => a.id);
    Promise.all(ids.map((id) => fetchAgentMeta(id)));
  }, [selectedGatewayId, agents, fetchAgentMeta]);

  const openAddForm = useCallback(() => {
    setEditingAgentId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback(
    (agent: AgentInfo) => {
      setEditingAgentId(agent.id);
      setForm({
        name: agent.name ?? agent.id,
        workspace: agentWorkspaceMap[agent.id] ?? '',
        avatar: agent.identity?.avatarUrl ?? agent.identity?.avatar ?? '',
        model: '',
      });
      setShowForm(true);
      fetchAgentMeta(agent.id);
    },
    [agentWorkspaceMap, fetchAgentMeta],
  );

  useEffect(() => {
    if (!editingAgentId) return;
    const ws = agentWorkspaceMap[editingAgentId];
    if (ws) setForm((f) => (f.workspace ? f : { ...f, workspace: ws }));
  }, [editingAgentId, agentWorkspaceMap]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingAgentId(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedGatewayId) return;

    if (!form.name.trim()) {
      toast.error(t('settings.agentNameRequired'));
      return;
    }

    if (!editingAgentId && !form.workspace.trim()) {
      toast.error(t('settings.agentWorkspaceRequired'));
      return;
    }

    setSaving(true);
    if (editingAgentId) {
      const res = await window.clawwork.updateAgent(selectedGatewayId, {
        agentId: editingAgentId,
        name: form.name.trim() || undefined,
        workspace: form.workspace.trim() || undefined,
        avatar: form.avatar || undefined,
        model: form.model.trim() || undefined,
      });
      if (res.ok) {
        toast.success(t('settings.agentUpdated'));
        closeForm();
        await refreshAgents();
      } else {
        toast.error(res.error ?? t('errors.failed'));
      }
    } else {
      const res = await window.clawwork.createAgent(selectedGatewayId, {
        name: form.name.trim(),
        workspace: form.workspace.trim(),
        avatar: form.avatar || undefined,
      });
      if (res.ok) {
        const created = res.result as Record<string, unknown> | undefined;
        const newAgentId = (created?.agentId as string) ?? '';
        if (form.model.trim() && newAgentId) {
          await window.clawwork.updateAgent(selectedGatewayId, {
            agentId: newAgentId,
            model: form.model.trim(),
          });
        }
        toast.success(t('settings.agentCreated'));
        closeForm();
        await refreshAgents();
      } else {
        toast.error(res.error ?? t('errors.failed'));
      }
    }
    setSaving(false);
  }, [selectedGatewayId, editingAgentId, form, closeForm, refreshAgents, t]);

  const handleDelete = useCallback(async () => {
    if (!selectedGatewayId || !deletingAgentId) return;
    const res = await window.clawwork.deleteAgent(selectedGatewayId, {
      agentId: deletingAgentId,
      deleteFiles,
    });
    if (res.ok) {
      toast.success(t('settings.agentDeleted'));
      if (expandedFilesAgentId === deletingAgentId) {
        setExpandedFilesAgentId(null);
        setActiveSectionByAgentId((prev) => {
          const next = { ...prev };
          delete next[deletingAgentId];
          return next;
        });
        setSelectedFileName(null);
        setFileContent(null);
        setEditingFileContent(null);
      }
      setAgentFilesMap((prev) => {
        const next = { ...prev };
        delete next[deletingAgentId];
        return next;
      });
      setAgentWorkspaceMap((prev) => {
        const next = { ...prev };
        delete next[deletingAgentId];
        return next;
      });
      setAgentSkillsMap((prev) => {
        const next = { ...prev };
        delete next[deletingAgentId];
        return next;
      });
      await refreshAgents();
    } else {
      toast.error(res.error ?? t('errors.failed'));
    }
    setDeletingAgentId(null);
    setDeleteFiles(false);
  }, [selectedGatewayId, deletingAgentId, deleteFiles, expandedFilesAgentId, refreshAgents, t]);

  const handleToggleFiles = useCallback(
    async (agentId: string) => {
      if (expandedFilesAgentId === agentId) {
        setExpandedFilesAgentId(null);
        setSelectedFileName(null);
        setFileContent(null);
        setEditingFileContent(null);
        return;
      }
      setExpandedFilesAgentId(agentId);
      setActiveSectionByAgentId((prev) => ({ ...prev, [agentId]: prev[agentId] ?? 'files' }));
      setSelectedFileName(null);
      setFileContent(null);
      setEditingFileContent(null);
      fetchAgentMeta(agentId);
      fetchAgentSkills(agentId);
    },
    [expandedFilesAgentId, fetchAgentMeta, fetchAgentSkills],
  );

  const handleSelectFile = useCallback(
    async (agentId: string, name: string) => {
      if (selectedFileName === name) {
        setSelectedFileName(null);
        setFileContent(null);
        setEditingFileContent(null);
        return;
      }
      if (!selectedGatewayId) return;
      setSelectedFileName(name);
      setFileContent(null);
      setEditingFileContent(null);
      setLoadingFileContent(true);
      const res = await window.clawwork.getAgentFile(selectedGatewayId, agentId, name);
      setLoadingFileContent(false);
      if (res.ok && res.result) {
        const data = res.result as unknown as { file?: { content?: string } };
        setFileContent(data.file?.content ?? null);
      }
    },
    [selectedGatewayId, selectedFileName],
  );

  const handleSaveFile = useCallback(async () => {
    if (!selectedGatewayId || !expandedFilesAgentId || !selectedFileName || editingFileContent === null) return;
    setSavingFile(true);
    const res = await window.clawwork.setAgentFile(
      selectedGatewayId,
      expandedFilesAgentId,
      selectedFileName,
      editingFileContent,
    );
    setSavingFile(false);
    if (res.ok) {
      toast.success(t('settings.agentFileSaved'));
      setFileContent(editingFileContent);
      setEditingFileContent(null);
    } else {
      toast.error(res.error ?? t('settings.agentFileSaveFailed'));
    }
  }, [selectedGatewayId, expandedFilesAgentId, selectedFileName, editingFileContent, t]);

  if (connectedGatewayIds.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <h3 className="type-section-title text-[var(--text-primary)]">{t('settings.agents')}</h3>
        </div>
        <SettingGroup>
          <EmptyState
            icon={<Server size={24} className="text-[var(--text-muted)]" />}
            title={t('settings.noConnectedGateways')}
          />
        </SettingGroup>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="type-section-title text-[var(--text-primary)]">{t('settings.agents')}</h3>
          <div className="flex items-center gap-2">
            {connectedGatewayIds.length > 1 && (
              <select
                value={selectedGatewayId ?? ''}
                onChange={(e) => {
                  setSelectedGatewayId(e.target.value);
                  setExpandedFilesAgentId(null);
                  setSelectedFileName(null);
                  setFileContent(null);
                  setEditingFileContent(null);
                  setAgentFilesMap({});
                  setAgentWorkspaceMap({});
                  closeForm();
                }}
                className={cn(
                  'glow-focus type-label h-8 rounded-md px-2',
                  'bg-[var(--bg-tertiary)] border border-[var(--border)]',
                  'text-[var(--text-primary)]',
                )}
              >
                {connectedGatewayIds.map((gwId) => (
                  <option key={gwId} value={gwId}>
                    {gatewayInfoMap[gwId]?.name ?? gwId}
                  </option>
                ))}
              </select>
            )}
            {!showForm && (
              <ToolbarButton variant="soft" size="sm" onClick={openAddForm} icon={<Plus size={14} />}>
                {t('settings.addAgent')}
              </ToolbarButton>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {agents.map((agent) => (
              <Fragment key={agent.id}>
                <AgentCard
                  agent={agent}
                  isDefault={agent.id === defaultAgentId}
                  isEditing={editingAgentId === agent.id && showForm}
                  workspace={agentWorkspaceMap[agent.id] ?? null}
                  expanded={expandedFilesAgentId === agent.id}
                  activeSection={activeSectionByAgentId[agent.id] ?? 'files'}
                  files={agentFilesMap[agent.id] ?? []}
                  loadingFiles={loadingFilesFor === agent.id}
                  skills={agentSkillsMap[agent.id] ?? []}
                  loadingSkills={loadingSkillsFor === agent.id}
                  selectedFile={expandedFilesAgentId === agent.id ? selectedFileName : null}
                  fileContent={expandedFilesAgentId === agent.id ? fileContent : null}
                  loadingFileContent={loadingFileContent}
                  editingFileContent={expandedFilesAgentId === agent.id ? editingFileContent : null}
                  savingFile={savingFile}
                  onEdit={() => openEditForm(agent)}
                  onDelete={() => {
                    if (agent.id === 'main') {
                      toast.error(t('settings.cannotDeleteMain'));
                      return;
                    }
                    setDeletingAgentId(agent.id);
                  }}
                  onToggleExpand={() => handleToggleFiles(agent.id)}
                  onSelectSection={(section) =>
                    setActiveSectionByAgentId((prev) => ({
                      ...prev,
                      [agent.id]: section,
                    }))
                  }
                  onSelectFile={(name) => handleSelectFile(agent.id, name)}
                  onEditFile={() => setEditingFileContent(fileContent ?? '')}
                  onSaveFile={handleSaveFile}
                  onCancelEdit={() => setEditingFileContent(null)}
                  onEditFileContentChange={setEditingFileContent}
                />
                <AnimatePresence>
                  {editingAgentId === agent.id && showForm && (
                    <AgentForm
                      editingId={editingAgentId}
                      form={form}
                      setForm={setForm}
                      models={models}
                      saving={saving}
                      onSave={handleSave}
                      onClose={closeForm}
                    />
                  )}
                </AnimatePresence>
              </Fragment>
            ))}
          </AnimatePresence>

          {agents.length === 0 && !showForm && (
            <SettingGroup>
              <EmptyState
                icon={<Bot size={24} className="text-[var(--text-muted)]" />}
                title={t('settings.noAgents')}
                action={
                  <ToolbarButton variant="soft" size="sm" onClick={openAddForm} icon={<Plus size={14} />}>
                    {t('settings.addAgent')}
                  </ToolbarButton>
                }
              />
            </SettingGroup>
          )}

          <AnimatePresence>
            {showForm && !editingAgentId && (
              <AgentForm
                editingId={null}
                form={form}
                setForm={setForm}
                models={models}
                saving={saving}
                onSave={handleSave}
                onClose={closeForm}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dialog
        open={!!deletingAgentId}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingAgentId(null);
            setDeleteFiles(false);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('settings.confirmDeleteAgentTitle')}</DialogTitle>
            <DialogDescription className="pt-2">
              {t('settings.confirmDeleteAgentDesc', { name: deletingAgent?.name ?? deletingAgent?.id })}
            </DialogDescription>
          </DialogHeader>
          <label className="type-label flex items-center gap-2 pt-2 text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={deleteFiles}
              onChange={(e) => setDeleteFiles(e.target.checked)}
              className="rounded"
            />
            {t('settings.deleteFiles')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeletingAgentId(null);
                setDeleteFiles(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} className="gap-1.5">
              <Trash2 size={14} />
              {t('settings.remove')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
