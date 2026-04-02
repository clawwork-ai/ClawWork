import { useRef, useCallback, useState, useEffect, useMemo, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Send,
  Square,
  X,
  ChevronDown,
  Mic,
  Loader2,
  TerminalSquare,
  File,
  FileCode,
  FolderOpen,
  ListTodo,
  Plus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion as motionPresets, motionDuration } from '@/styles/design-tokens';
import AgentIcon from '@/components/AgentIcon';
import ToolbarButton from '@/components/semantic/ToolbarButton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { createWhisperSttSession } from '@/lib/voice/whisper-stt';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTaskStore } from '../../stores/taskStore';
import { useUiStore } from '../../stores/uiStore';
import SlashCommandMenu from '../SlashCommandMenu';
import SlashCommandDashboard from '../SlashCommandDashboard';
import ToolsCatalog from '../ToolsCatalog';
import SlashArgPicker from '../SlashArgPicker';
import VoiceIntroDialog from '../VoiceIntroDialog';
import MentionPicker, { type MentionTab, type AgentMentionEntry } from '../MentionPicker';
import { useRoomStore } from '@/stores/roomStore';
import { ACCEPTED_TYPES, THINKING_LEVELS, THINKING_LABEL_KEYS, MENTION_ALL_AGENT_ID } from './constants';
import { formatContextWindow } from './utils';
import { useImageAttachments } from './useImageAttachments';
import { useContextFolders } from './useContextFolders';
import { useMentionPicker } from './useMentionPicker';
import { useSlashAutocomplete } from './useSlashAutocomplete';
import { useChatSend } from './useChatSend';

export default function ChatInput() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canSend, setCanSend] = useState(false);

  const sendShortcut = useUiStore((s) => s.sendShortcut);
  const mainView = useUiStore((s) => s.mainView);
  const settingsOpen = useUiStore((s) => s.settingsOpen);

  const { pendingImages, setPendingImages, handleFileSelect, removeImage, handlePaste } = useImageAttachments();

  const { contextFolders, localFilesForPicker, handleAddContextFolder, handleRemoveContextFolder, loadLocalFiles } =
    useContextFolders();

  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const activeTaskGatewayId = useTaskStore((s) => s.tasks.find((task) => task.id === s.activeTaskId)?.gatewayId);
  const performers = useRoomStore((s) => (activeTaskId ? s.rooms[activeTaskId]?.performers : undefined));
  const agentCatalog = useUiStore((s) =>
    activeTaskGatewayId ? s.agentCatalogByGateway[activeTaskGatewayId] : undefined,
  );
  const mentionAgents = useMemo<AgentMentionEntry[]>(() => {
    if (!performers) return [];
    const catalogMap = new Map((agentCatalog?.agents ?? []).map((a) => [a.id, a]));
    const byAgent = new Map<string, AgentMentionEntry>();
    for (const p of performers) {
      const catalogEntry = catalogMap.get(p.agentId);
      byAgent.set(p.agentId, {
        agentId: p.agentId,
        agentName: p.agentName,
        emoji: p.emoji,
        avatarUrl: catalogEntry?.identity?.avatarUrl,
        gatewayId: activeTaskGatewayId,
        sessionKey: p.sessionKey,
      });
    }
    return [...byAgent.values()];
  }, [performers, agentCatalog, activeTaskGatewayId]);

  const {
    slashMenuVisible,
    setSlashMenuVisible,
    slashCommands,
    slashIndex,
    setSlashIndex,
    dashboardOpen,
    setDashboardOpen,
    argPickerVisible,
    argPickerCommand,
    argPickerOptions,
    argPickerIndex,
    setArgPickerIndex,
    updateSlashMenu,
    commitSlashCommand,
    commitArgOption,
    closeArgPicker,
  } = useSlashAutocomplete({ textareaRef });

  const {
    mentionVisible,
    mentionQuery,
    mentionIndex,
    setMentionIndex,
    mentionTab,
    setMentionTab,
    selectedTasks,
    setSelectedTasks,
    selectedArtifacts,
    setSelectedArtifacts,
    selectedLocalFiles,
    setSelectedLocalFiles,
    mentionItemsRef,
    updateMentionPicker,
    closeMentionPicker,
    commitMention,
    removeSelectedTask,
    removeSelectedArtifact,
    removeSelectedLocalFile,
    handleMentionItemsChange,
    selectedAgents,
    setSelectedAgents,
    removeSelectedAgent,
  } = useMentionPicker({ textareaRef, contextFolders, loadLocalFiles, hasAgents: mentionAgents.length > 0 });

  const [whisperAvailable, setWhisperAvailable] = useState(false);
  useEffect(() => {
    if (typeof window.clawwork.checkWhisper !== 'function') {
      setWhisperAvailable(false);
      return;
    }
    window.clawwork.checkWhisper().then((r) => setWhisperAvailable(r.available));
  }, []);

  const loadVoiceIntroSeen = useCallback(async () => {
    const settings = await window.clawwork.getSettings();
    return Boolean(settings?.voiceInput?.introSeen);
  }, []);

  const markVoiceIntroSeen = useCallback(async () => {
    await window.clawwork.updateSettings({
      voiceInput: {
        introSeen: true,
      },
    });
  }, []);

  const requestVoicePermission = useCallback(async () => {
    const result = await window.clawwork.requestMicrophonePermission();
    return result.status;
  }, []);

  const {
    isGenerating,
    aborting,
    isOffline,
    activeTask,
    currentModel,
    currentThinking,
    modelCatalog,
    toolsCatalog,
    modelLabel,
    currentModelEntry,
    modelsByProvider,
    taskGwId: _taskGwId,
    handleSend,
    handleModelQuickSend,
    handleThinkingQuickSend,
    handleAbort,
    handleToolSelect,
  } = useChatSend({
    textareaRef,
    pendingImages,
    setPendingImages,
    selectedTasks,
    setSelectedTasks,
    selectedArtifacts,
    setSelectedArtifacts,
    selectedLocalFiles,
    setSelectedLocalFiles,
    selectedAgents,
    setSelectedAgents,
    contextFolders,
    stopVoiceInput: () => stopVoiceInput(),
    onComposerCleared: () => setCanSend(false),
  });

  const {
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
    isTranscribing: isVoiceTranscribing,
    isIntroOpen: isVoiceIntroOpen,
    errorCode: voiceErrorCode,
    handleKeyDown: handleVoiceKeyDown,
    handleKeyUp: handleVoiceKeyUp,
    confirmIntro: confirmVoiceIntro,
    dismissIntro: dismissVoiceIntro,
    startFromTrigger: startVoiceInput,
    stopListening: stopVoiceInput,
  } = useVoiceInput({
    textareaRef,
    hasActiveTask: !isOffline,
    activeTaskKey: activeTask?.id ?? null,
    mainView,
    settingsOpen,
    loadIntroSeen: loadVoiceIntroSeen,
    markIntroSeen: markVoiceIntroSeen,
    requestPermission: requestVoicePermission,
    createSession: createWhisperSttSession,
    isSupported: whisperAvailable,
  });

  const allTasks = useTaskStore((s) => s.tasks);
  const mentionTasks = useMemo(
    () => allTasks.filter((tt) => tt.id !== activeTask?.id && tt.title),
    [allTasks, activeTask?.id],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      handleVoiceKeyDown(e);
      if (e.defaultPrevented) return;

      if (mentionVisible) {
        if (e.key === 'Tab' || e.key === 'ArrowRight') {
          e.preventDefault();
          const tabs: MentionTab[] = [
            ...(mentionAgents.length > 0 ? (['agents'] as const) : []),
            ...(contextFolders.length > 0 ? (['local'] as const) : []),
            'tasks',
            'files',
          ];
          setMentionTab((cur) => tabs[(tabs.indexOf(cur) + 1) % tabs.length]);
          setMentionIndex(0);
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const tabs: MentionTab[] = [
            ...(mentionAgents.length > 0 ? (['agents'] as const) : []),
            ...(contextFolders.length > 0 ? (['local'] as const) : []),
            'tasks',
            'files',
          ];
          setMentionTab((cur) => tabs[(tabs.indexOf(cur) - 1 + tabs.length) % tabs.length]);
          setMentionIndex(0);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex((i) => Math.min(i + 1, mentionItemsRef.current.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const item = mentionItemsRef.current[mentionIndex];
          if (item) commitMention(item);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          closeMentionPicker();
          return;
        }
      }

      if (argPickerVisible && argPickerOptions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setArgPickerIndex((i) => (i + 1) % argPickerOptions.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setArgPickerIndex((i) => (i - 1 + argPickerOptions.length) % argPickerOptions.length);
          return;
        }
        if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          const opt = argPickerOptions[argPickerIndex];
          if (opt) commitArgOption(opt);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          closeArgPicker();
          return;
        }
      }

      if (slashMenuVisible && slashCommands.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSlashIndex((i) => (i + 1) % slashCommands.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSlashIndex((i) => (i - 1 + slashCommands.length) % slashCommands.length);
          return;
        }
        if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          const cmd = slashCommands[slashIndex];
          if (cmd) commitSlashCommand(cmd);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setSlashMenuVisible(false);
          return;
        }
      }

      if (e.key === 'Escape' && isGenerating) {
        e.preventDefault();
        handleAbort();
        return;
      }

      if (e.key === 'Enter') {
        const isCmdEnterMode = sendShortcut === 'cmdEnter';
        const meta = e.metaKey || e.ctrlKey;
        const shouldSend = isCmdEnterMode ? meta && !e.shiftKey : !e.shiftKey && !meta;
        if (shouldSend) {
          e.preventDefault();
          handleSend();
        }
      }
    },
    [
      mentionVisible,
      mentionIndex,
      commitMention,
      closeMentionPicker,
      contextFolders,
      argPickerVisible,
      argPickerOptions,
      argPickerIndex,
      commitArgOption,
      closeArgPicker,
      slashMenuVisible,
      slashCommands,
      slashIndex,
      commitSlashCommand,
      handleSend,
      handleAbort,
      isGenerating,
      handleVoiceKeyDown,
      sendShortcut,
      mentionAgents.length,
      mentionItemsRef,
      setMentionTab,
      setMentionIndex,
      setArgPickerIndex,
      setSlashIndex,
      setSlashMenuVisible,
    ],
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    setCanSend(Boolean(textarea.value.trim()) || pendingImages.length > 0);
    if (argPickerVisible) closeArgPicker();
    updateSlashMenu();
    updateMentionPicker();
  }, [updateSlashMenu, argPickerVisible, closeArgPicker, updateMentionPicker, pendingImages.length]);

  const voiceActive = isVoiceListening || isVoiceTranscribing;
  const disabled = isOffline;
  const placeholder = isOffline ? t('chatInput.offlineReadOnly') : t('chatInput.describeTask');
  const voiceTooltip = !isVoiceSupported ? t('voiceInput.unsupportedTooltip') : t('voiceInput.tooltip');
  const composerModelLabel = (currentModelEntry?.name ?? modelLabel).replace(/^[^/]+\//, '');

  const prevTranscribingRef = useRef(false);
  useEffect(() => {
    if (prevTranscribingRef.current && !isVoiceTranscribing) {
      textareaRef.current?.focus();
    }
    prevTranscribingRef.current = isVoiceTranscribing;
  }, [isVoiceTranscribing]);

  useEffect(() => {
    if (!voiceErrorCode) return;
    if (voiceErrorCode === 'permission-denied') {
      toast.error(t('voiceInput.permissionDenied'));
      return;
    }
    if (voiceErrorCode === 'unsupported') {
      toast.error(t('voiceInput.unsupported'));
      return;
    }
    toast.error(t('voiceInput.recognitionFailed'));
  }, [voiceErrorCode, t]);

  useEffect(() => {
    const textarea = textareaRef.current;
    setCanSend(Boolean(textarea?.value.trim()) || pendingImages.length > 0);
  }, [pendingImages.length]);

  return (
    <div className="flex-shrink-0 px-6 pb-5">
      <div className="max-w-[var(--content-max-width)] mx-auto">
        <AnimatePresence>
          {pendingImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 inline-flex max-w-full gap-2 overflow-x-auto overflow-y-visible px-1 pt-2 pb-1"
            >
              {pendingImages.map((img, i) => (
                <motion.div
                  key={`${img.file.name}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group relative flex-shrink-0 pt-1 pr-1"
                >
                  <div className="relative overflow-hidden rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
                    <img src={img.previewUrl} alt={img.file.name} className="h-16 w-16 object-cover" />
                    <span className="type-support absolute bottom-0 left-0 right-0 bg-[var(--overlay-scrim)] px-1 text-center truncate text-[var(--text-muted)]">
                      {img.file.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeImage(i)}
                    className={cn(
                      'absolute top-0 right-0 h-5 w-5 rounded-full',
                      'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
                      'flex items-center justify-center',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'text-[var(--text-muted)] hover:text-[var(--danger)]',
                    )}
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          {slashMenuVisible && (
            <SlashCommandMenu
              commands={slashCommands}
              selectedIndex={slashIndex}
              onSelect={commitSlashCommand}
              onHoverIndex={setSlashIndex}
              onClose={() => setSlashMenuVisible(false)}
            />
          )}

          <MentionPicker
            visible={mentionVisible}
            query={mentionQuery}
            tasks={mentionTasks}
            localFiles={localFilesForPicker}
            agents={mentionAgents}
            hasContextFolders={contextFolders.length > 0}
            activeTab={mentionTab}
            selectedIndex={mentionIndex}
            onSelectTask={(task) => commitMention({ kind: 'task', task })}
            onSelectArtifact={(a) => commitMention({ kind: 'file', artifact: a })}
            onSelectLocalFile={(f) => commitMention({ kind: 'local', file: f })}
            onSelectAgent={(a) => commitMention({ kind: 'agent', agent: a })}
            onTabChange={(tab) => {
              setMentionTab(tab);
              setMentionIndex(0);
            }}
            onHoverIndex={setMentionIndex}
            onItemsChange={handleMentionItemsChange}
          />

          {argPickerVisible && argPickerCommand && (
            <SlashArgPicker
              commandName={argPickerCommand.name}
              options={argPickerOptions}
              selectedIndex={argPickerIndex}
              onSelect={commitArgOption}
              onHoverIndex={setArgPickerIndex}
              onClose={closeArgPicker}
            />
          )}

          <div
            className={cn(
              'glass-heavy rounded-3xl border border-[var(--border)] shadow-[var(--shadow-floating-layered)]',
              'ring-accent-focus transition-all duration-200 hover:border-[var(--border-accent)] focus-within:border-[var(--border-accent)]',
              isOffline && 'opacity-60',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="px-4 pt-3 pb-3">
              <div className="relative">
                {(selectedTasks.length > 0 ||
                  selectedArtifacts.length > 0 ||
                  selectedLocalFiles.length > 0 ||
                  selectedAgents.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {selectedAgents.map((a) => (
                      <span
                        key={`agent-${a.agentId}`}
                        className={cn(
                          'type-support inline-flex items-center gap-1 rounded-lg px-2 py-1',
                          'bg-[var(--accent)]/10 text-[var(--accent)]',
                        )}
                      >
                        {a.agentId === MENTION_ALL_AGENT_ID ? (
                          <Users size={14} className="flex-shrink-0" />
                        ) : (
                          <span className="flex-shrink-0">
                            <AgentIcon
                              gatewayId={a.gatewayId}
                              agentId={a.agentId}
                              gatewayAvatarUrl={a.avatarUrl}
                              emoji={a.emoji}
                              imgClass="w-3.5 h-3.5 rounded-full object-cover"
                            />
                          </span>
                        )}
                        {a.agentName}
                        <button
                          onClick={() => removeSelectedAgent(a.agentId)}
                          className="ml-0.5 opacity-50 hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {selectedLocalFiles.map((f) => (
                      <span
                        key={f.absolutePath}
                        className={cn(
                          'type-support inline-flex items-center gap-1 rounded-lg px-2 py-1',
                          'bg-[var(--accent)]/10 text-[var(--accent)]',
                        )}
                      >
                        <FileCode size={14} className="flex-shrink-0" />
                        {f.relativePath}
                        <button
                          onClick={() => removeSelectedLocalFile(f.absolutePath)}
                          className="ml-0.5 opacity-50 hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {selectedTasks.map((task) => (
                      <span
                        key={`task-${task.id}`}
                        className={cn(
                          'type-support inline-flex items-center gap-1 rounded-lg px-2 py-1',
                          'bg-[var(--accent)]/10 text-[var(--accent)]',
                        )}
                      >
                        <ListTodo size={14} className="flex-shrink-0" />
                        {task.title}
                        <button
                          onClick={() => removeSelectedTask(task.id)}
                          className="ml-0.5 opacity-50 hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {selectedArtifacts.map((a) => (
                      <span
                        key={a.id}
                        className={cn(
                          'type-support inline-flex items-center gap-1 rounded-lg px-2 py-1',
                          'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                        )}
                      >
                        <File size={14} className="flex-shrink-0" />
                        {a.name}
                        <button
                          onClick={() => removeSelectedArtifact(a.id)}
                          className="ml-0.5 opacity-50 hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  rows={2}
                  placeholder={placeholder}
                  disabled={disabled || isVoiceTranscribing}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleVoiceKeyUp}
                  onInput={handleInput}
                  onPaste={handlePaste}
                  onClick={updateSlashMenu}
                  className={cn(
                    'w-full resize-none bg-transparent',
                    'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                    'min-h-11 outline-none max-h-48 leading-6 disabled:opacity-50',
                    voiceActive && 'invisible',
                  )}
                />
                <AnimatePresence>
                  {voiceActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: motionDuration.normal }}
                      className="absolute inset-0 flex items-center gap-2.5"
                    >
                      {isVoiceListening && (
                        <>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                          </span>
                          <span className="type-body text-[var(--text-secondary)]">
                            {t('voiceInput.listeningStatus')}
                          </span>
                        </>
                      )}
                      {isVoiceTranscribing && (
                        <>
                          <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                          <span className="type-body text-[var(--text-secondary)]">{t('voiceInput.transcribing')}</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!isOffline && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <motion.div
                      whileHover={reduced ? undefined : motionPresets.scale.whileHover}
                      whileTap={reduced ? undefined : motionPresets.scale.whileTap}
                      transition={motionPresets.scale.transition}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className="rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        <Plus size={18} />
                      </Button>
                    </motion.div>

                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <ToolbarButton
                            variant="ghost"
                            size="sm"
                            className="rounded-lg border-none px-2 text-[var(--text-secondary)] shadow-none"
                            title={currentModelEntry?.name ?? modelLabel}
                          >
                            <span className="max-w-36 truncate">{composerModelLabel}</span>
                            {currentModelEntry?.reasoning && (
                              <span className="type-badge rounded bg-[var(--accent)]/15 px-1 py-px text-[var(--accent)]">
                                R
                              </span>
                            )}
                            {currentModelEntry?.contextWindow && (
                              <span className="type-badge rounded bg-[var(--info)]/15 px-1 py-px text-[var(--info)]">
                                {formatContextWindow(currentModelEntry.contextWindow)}
                              </span>
                            )}
                            <ChevronDown size={14} className="opacity-50" />
                          </ToolbarButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {Object.entries(modelsByProvider).map(([provider, models]) => (
                            <DropdownMenuSub key={provider}>
                              <DropdownMenuSubTrigger>
                                <span>{provider}</span>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {models.map((m) => (
                                  <DropdownMenuItem
                                    key={m.id}
                                    onClick={() => handleModelQuickSend(m.id)}
                                    className={cn(m.id === currentModel && 'font-medium text-[var(--accent)]')}
                                  >
                                    <span className="truncate">{m.name ?? m.id}</span>
                                    {m.reasoning && (
                                      <span className="type-badge rounded bg-[var(--accent)]/15 px-1 py-px text-[var(--accent)]">
                                        R
                                      </span>
                                    )}
                                    {m.contextWindow && (
                                      <span className="ml-auto pl-2 type-badge rounded bg-[var(--info)]/15 px-1 py-px text-[var(--info)]">
                                        {formatContextWindow(m.contextWindow)}
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          ))}
                          {modelCatalog.length === 0 && (
                            <DropdownMenuItem disabled>
                              <span className="text-[var(--text-muted)] italic">
                                {t('chatInput.noModelsAvailable')}
                              </span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <ToolbarButton
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'rounded-lg border-none px-2 text-[var(--text-secondary)] shadow-none',
                              currentThinking !== 'off' && 'text-[var(--accent)]',
                            )}
                            title={t(THINKING_LABEL_KEYS[currentThinking])}
                          >
                            <span>{t(THINKING_LABEL_KEYS[currentThinking])}</span>
                            <ChevronDown size={14} className="opacity-50" />
                          </ToolbarButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {THINKING_LEVELS.map((level) => (
                            <DropdownMenuItem
                              key={level}
                              onClick={() => handleThinkingQuickSend(level)}
                              className={cn(level === currentThinking && 'font-medium text-[var(--accent)]')}
                            >
                              {t(THINKING_LABEL_KEYS[level])}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            variant={isVoiceListening ? 'soft' : 'ghost'}
                            size="icon"
                            onClick={() => {
                              if (isVoiceListening) {
                                stopVoiceInput();
                                return;
                              }
                              void startVoiceInput();
                            }}
                            disabled={disabled}
                            className={cn(
                              'rounded-xl',
                              isVoiceListening && 'text-[var(--accent)]',
                              !isVoiceListening && 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                            )}
                          >
                            <Mic size={18} />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{voiceTooltip}</TooltipContent>
                    </Tooltip>
                    <AnimatePresence mode="wait">
                      {isGenerating ? (
                        <motion.div
                          key="stop"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: motionDuration.normal }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="danger"
                                size="icon"
                                onClick={handleAbort}
                                disabled={aborting}
                                className="rounded-xl"
                              >
                                <Square size={16} fill="currentColor" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('chatInput.stopGenerating')}</TooltipContent>
                          </Tooltip>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="send"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: motionDuration.normal }}
                          whileHover={reduced ? undefined : motionPresets.scale.whileHover}
                          whileTap={reduced ? undefined : motionPresets.scale.whileTap}
                        >
                          <Button
                            variant={canSend ? 'default' : 'secondary'}
                            size="icon"
                            onClick={handleSend}
                            disabled={disabled || !canSend}
                            className={cn(
                              'rounded-2xl',
                              canSend
                                ? 'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-muted)]',
                            )}
                          >
                            <Send size={18} />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {(!isOffline || contextFolders.length > 0 || activeTask) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!isOffline && (
              <div className="flex items-center gap-1.5 px-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToolbarButton
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDashboardOpen(true)}
                      icon={<TerminalSquare size={14} className="flex-shrink-0" />}
                      className="rounded-lg text-[var(--text-secondary)]"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">{t('slashDashboard.tooltip')}</TooltipContent>
                </Tooltip>

                {toolsCatalog?.groups && toolsCatalog.groups.length > 0 && (
                  <ToolsCatalog groups={toolsCatalog.groups} onToolSelect={handleToolSelect} />
                )}
              </div>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {contextFolders.length > 0 && (
                <div className="flex min-w-0 max-w-xl items-center gap-1.5 overflow-x-auto py-0.5">
                  {contextFolders.map((folder) => (
                    <span
                      key={folder}
                      className={cn(
                        'type-mono-data inline-flex max-w-48 flex-shrink-0 items-center gap-1 rounded-full px-2 py-1',
                        'border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                      )}
                    >
                      <span className="truncate">{folder.split('/').pop()}</span>
                      <button
                        onClick={() => handleRemoveContextFolder(folder)}
                        className="flex-shrink-0 opacity-50 transition-opacity hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5 px-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToolbarButton
                      variant="ghost"
                      size="sm"
                      onClick={handleAddContextFolder}
                      disabled={disabled}
                      className="rounded-lg text-[var(--text-secondary)]"
                    >
                      {t('chatInput.linkLocalFolders')}
                      <FolderOpen size={14} className="flex-shrink-0" />
                    </ToolbarButton>
                  </TooltipTrigger>
                  <TooltipContent side="top">{t('chatInput.addContextFolder')}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
      </div>
      <VoiceIntroDialog open={isVoiceIntroOpen} onConfirm={confirmVoiceIntro} onCancel={dismissVoiceIntro} />
      <SlashCommandDashboard
        open={dashboardOpen}
        onOpenChange={setDashboardOpen}
        onSelectCommand={commitSlashCommand}
      />
    </div>
  );
}
