import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Bot, Crown, Loader2, FileText, X, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion as motionPresets } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUiStore } from '@/stores/uiStore';
import type { AgentInfo, AgentListResponse, AgentFileEntry, ModelCatalogEntry } from '@clawwork/shared';
import EmptyState from '@/components/semantic/EmptyState';
import LoadingBlock from '@/components/semantic/LoadingBlock';
import SettingGroup from '@/components/semantic/SettingGroup';
import ToolbarButton from '@/components/semantic/ToolbarButton';

const EMPTY_MODELS: ModelCatalogEntry[] = [];

interface AgentFormData {
  name: string;
  workspace: string;
  emoji: string;
  model: string;
}

const EMPTY_FORM: AgentFormData = { name: '', workspace: '', emoji: '', model: '' };

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
  expandedFiles,
  files,
  loadingFiles,
  selectedFile,
  fileContent,
  loadingFileContent,
  onEdit,
  onDelete,
  onToggleFiles,
  onSelectFile,
}: {
  agent: AgentInfo;
  isDefault: boolean;
  isEditing: boolean;
  workspace: string | null;
  expandedFiles: boolean;
  files: AgentFileEntry[];
  loadingFiles: boolean;
  selectedFile: string | null;
  fileContent: string | null;
  loadingFileContent: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFiles: () => void;
  onSelectFile: (name: string) => void;
}) {
  const { t } = useTranslation();
  const emoji = agent.identity?.emoji;

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
          {emoji ? (
            <span className="text-lg leading-none">{emoji}</span>
          ) : (
            <Bot size={16} className={isDefault ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--text-primary)] truncate">{agent.name ?? agent.id}</span>
            {isDefault && (
              <span className="flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] font-medium">
                <Crown size={10} />
                {t('settings.agentDefault')}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5 truncate">{agent.id}</p>
          {workspace && <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate opacity-60">{workspace}</p>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-1 pl-3 border-l border-[var(--border-subtle)]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onToggleFiles} aria-label={t('settings.agentFiles')}>
                <FileText size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.agentFiles')}</TooltipContent>
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
        {expandedFiles && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
              {loadingFiles ? (
                <LoadingBlock mode="inline" label={t('settings.agentLoadingFiles')} className="py-2" />
              ) : files.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-2">{t('settings.agentNoFiles')}</p>
              ) : (
                <div className="flex gap-3 h-70">
                  <div className="w-40 flex-shrink-0 space-y-0.5 overflow-y-auto">
                    {files.map((f) => (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => onSelectFile(f.name)}
                        className={cn(
                          'flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-xs text-left transition-colors',
                          'hover:bg-[var(--bg-tertiary)]',
                          selectedFile === f.name
                            ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium'
                            : 'text-[var(--text-secondary)]',
                        )}
                      >
                        <FileText size={12} className="flex-shrink-0" />
                        <span className="font-mono truncate">{f.name}</span>
                        {f.missing && (
                          <span className="text-2xs px-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] flex-shrink-0">
                            {t('common.missing')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    {!selectedFile ? (
                      <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
                        {t('settings.agentFilePreview')}
                      </div>
                    ) : loadingFileContent ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
                      </div>
                    ) : (
                      <pre className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-xs font-mono text-[var(--text-secondary)] overflow-auto h-full whitespace-pre-wrap break-words">
                        {fileContent ?? ''}
                      </pre>
                    )}
                  </div>
                </div>
              )}
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

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      className="overflow-hidden"
    >
      <div className="surface-card space-y-4 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {editingId ? t('settings.editAgent') : t('settings.addAgent')}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('common.close')}>
            <X size={14} />
          </Button>
        </div>

        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{t('settings.agentName')}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('settings.agentNamePlaceholder')}
            className={cn(inputClass, 'w-full')}
          />
        </div>

        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{t('settings.agentWorkspace')}</label>
          {editingId ? (
            <p className="text-sm font-mono text-[var(--text-muted)] px-3 py-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] truncate">
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
          <div className="w-24 flex-shrink-0">
            <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{t('settings.agentEmoji')}</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
              placeholder={t('settings.agentEmojiPlaceholder')}
              className={cn(inputClass, 'w-full')}
              maxLength={4}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{t('settings.agentModel')}</label>
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
  const [agentFilesMap, setAgentFilesMap] = useState<Record<string, AgentFileEntry[]>>({});
  const [agentWorkspaceMap, setAgentWorkspaceMap] = useState<Record<string, string>>({});
  const [loadingFilesFor, setLoadingFilesFor] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingFileContent, setLoadingFileContent] = useState(false);

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
        name: agent.name ?? '',
        workspace: agentWorkspaceMap[agent.id] ?? '',
        emoji: agent.identity?.emoji ?? '',
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
        emoji: form.emoji.trim() || undefined,
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
        emoji: form.emoji.trim() || undefined,
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
        setSelectedFileName(null);
        setFileContent(null);
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
        return;
      }
      setExpandedFilesAgentId(agentId);
      setSelectedFileName(null);
      setFileContent(null);
      fetchAgentMeta(agentId);
    },
    [expandedFilesAgentId, fetchAgentMeta],
  );

  const handleSelectFile = useCallback(
    async (agentId: string, name: string) => {
      if (selectedFileName === name) {
        setSelectedFileName(null);
        setFileContent(null);
        return;
      }
      if (!selectedGatewayId) return;
      setSelectedFileName(name);
      setFileContent(null);
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

  if (connectedGatewayIds.length === 0) {
    return (
      <div>
        <div className="mb-1">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('settings.agents')}</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">{t('settings.agentsDesc')}</p>
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
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('settings.agents')}</h3>
          <div className="flex items-center gap-2">
            {connectedGatewayIds.length > 1 && (
              <select
                value={selectedGatewayId ?? ''}
                onChange={(e) => {
                  setSelectedGatewayId(e.target.value);
                  setExpandedFilesAgentId(null);
                  setSelectedFileName(null);
                  setFileContent(null);
                  setAgentFilesMap({});
                  setAgentWorkspaceMap({});
                  closeForm();
                }}
                className={cn(
                  'h-8 px-2 rounded-md text-sm',
                  'bg-[var(--bg-tertiary)] border border-[var(--border)]',
                  'text-[var(--text-primary)] outline-none',
                )}
              >
                {connectedGatewayIds.map((gwId) => (
                  <option key={gwId} value={gwId}>
                    {gatewayInfoMap[gwId]?.name ?? gwId}
                  </option>
                ))}
              </select>
            )}
            <ToolbarButton variant="soft" size="sm" onClick={openAddForm} icon={<Plus size={14} />}>
              {t('settings.addAgent')}
            </ToolbarButton>
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">{t('settings.agentsDesc')}</p>

        <div className="space-y-2">
          <AnimatePresence>
            {agents.map((agent) => (
              <Fragment key={agent.id}>
                <AgentCard
                  agent={agent}
                  isDefault={agent.id === defaultAgentId}
                  isEditing={editingAgentId === agent.id && showForm}
                  workspace={agentWorkspaceMap[agent.id] ?? null}
                  expandedFiles={expandedFilesAgentId === agent.id}
                  files={agentFilesMap[agent.id] ?? []}
                  loadingFiles={loadingFilesFor === agent.id}
                  selectedFile={expandedFilesAgentId === agent.id ? selectedFileName : null}
                  fileContent={expandedFilesAgentId === agent.id ? fileContent : null}
                  loadingFileContent={loadingFileContent}
                  onEdit={() => openEditForm(agent)}
                  onDelete={() => {
                    if (agent.id === 'main') {
                      toast.error(t('settings.cannotDeleteMain'));
                      return;
                    }
                    setDeletingAgentId(agent.id);
                  }}
                  onToggleFiles={() => handleToggleFiles(agent.id)}
                  onSelectFile={(name) => handleSelectFile(agent.id, name)}
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
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] pt-2">
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
