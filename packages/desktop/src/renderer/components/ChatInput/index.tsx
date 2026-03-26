import { useRef, useCallback, useState, useEffect, useMemo, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Send,
  Square,
  Paperclip,
  X,
  ChevronDown,
  Cpu,
  Brain,
  Mic,
  Loader2,
  TerminalSquare,
  Minimize2,
  RotateCcw,
  File,
  FileCode,
  FolderPlus,
  ListTodo,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, modKey } from '@/lib/utils';
import { motion as motionPresets, motionDuration } from '@/styles/design-tokens';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import MentionPicker, { type MentionTab } from '../MentionPicker';
import { ACCEPTED_TYPES, THINKING_LEVELS, THINKING_LABEL_KEYS } from './constants';
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

  const sendShortcut = useUiStore((s) => s.sendShortcut);
  const mainView = useUiStore((s) => s.mainView);
  const settingsOpen = useUiStore((s) => s.settingsOpen);

  const { pendingImages, setPendingImages, handleFileSelect, removeImage, handlePaste } = useImageAttachments();

  const {
    contextFolders,
    contextFileCount,
    localFilesForPicker,
    handleAddContextFolder,
    handleRemoveContextFolder,
    loadLocalFiles,
  } = useContextFolders();

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
  } = useMentionPicker({ textareaRef, contextFolders, loadLocalFiles });

  const [whisperAvailable, setWhisperAvailable] = useState(false);
  useEffect(() => {
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
    handleCompact,
    handleReset,
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
    contextFolders,
    stopVoiceInput: () => stopVoiceInput(),
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
          const tabs: MentionTab[] = contextFolders.length > 0 ? ['local', 'tasks', 'files'] : ['tasks', 'files'];
          setMentionTab((cur) => tabs[(tabs.indexOf(cur) + 1) % tabs.length]);
          setMentionIndex(0);
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const tabs: MentionTab[] = contextFolders.length > 0 ? ['local', 'tasks', 'files'] : ['tasks', 'files'];
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
    if (argPickerVisible) closeArgPicker();
    updateSlashMenu();
    updateMentionPicker();
  }, [updateSlashMenu, argPickerVisible, closeArgPicker, updateMentionPicker]);

  const voiceActive = isVoiceListening || isVoiceTranscribing;
  const disabled = isOffline;
  const placeholder = isOffline ? t('chatInput.offlineReadOnly') : t('chatInput.describeTask');
  const voiceTooltip = !isVoiceSupported ? t('voiceInput.unsupportedTooltip') : t('voiceInput.tooltip');

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

  return (
    <div className="flex-shrink-0 px-6 pb-5">
      <div className="max-w-[var(--content-max-width)] mx-auto">
        <AnimatePresence>
          {pendingImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 mb-2 overflow-x-auto pb-1"
            >
              {pendingImages.map((img, i) => (
                <motion.div
                  key={`${img.file.name}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex-shrink-0 group"
                >
                  <img
                    src={img.previewUrl}
                    alt={img.file.name}
                    className="h-16 w-16 rounded-lg object-cover border border-[var(--border-subtle)]"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className={cn(
                      'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full',
                      'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
                      'flex items-center justify-center',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'text-[var(--text-muted)] hover:text-[var(--danger)]',
                    )}
                  >
                    <X size={12} />
                  </button>
                  <span className="type-support absolute bottom-0 left-0 right-0 rounded-b-lg bg-[var(--overlay-scrim)] px-1 text-center truncate text-[var(--text-muted)]">
                    {img.file.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!isOffline && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'type-label inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
                    'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                    'hover:bg-[var(--bg-hover)] transition-colors',
                  )}
                >
                  <Cpu size={16} className="flex-shrink-0" />
                  <span className="max-w-24 truncate">{modelLabel}</span>
                  {currentModelEntry?.reasoning && (
                    <span className="type-badge rounded bg-[var(--accent)]/15 px-1 py-px text-[var(--accent)]">R</span>
                  )}
                  {currentModelEntry?.contextWindow && (
                    <span className="type-badge rounded bg-[var(--info)]/15 px-1 py-px text-[var(--info)]">
                      {formatContextWindow(currentModelEntry.contextWindow)}
                    </span>
                  )}
                  <ChevronDown size={14} className="opacity-50" />
                </button>
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
                    <span className="text-[var(--text-muted)] italic">{t('chatInput.noModelsAvailable')}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenuSeparator className="h-4 w-px mx-0.5" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'type-label inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
                    'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                    'hover:bg-[var(--bg-hover)] transition-colors',
                    currentThinking !== 'off' && 'text-[var(--accent)]',
                  )}
                >
                  <Brain size={16} className="flex-shrink-0" />
                  <span>{t(THINKING_LABEL_KEYS[currentThinking])}</span>
                  <ChevronDown size={14} className="opacity-50" />
                </button>
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

            <DropdownMenuSeparator className="h-4 w-px mx-0.5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'type-label inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
                    'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                    'hover:bg-[var(--bg-hover)] transition-colors',
                  )}
                  onClick={() => setDashboardOpen(true)}
                >
                  <TerminalSquare size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{t('slashDashboard.tooltip')}</TooltipContent>
            </Tooltip>

            {toolsCatalog?.groups && toolsCatalog.groups.length > 0 && (
              <>
                <DropdownMenuSeparator className="h-4 w-px mx-0.5" />
                <ToolsCatalog groups={toolsCatalog.groups} onToolSelect={handleToolSelect} />
              </>
            )}

            {activeTask && (
              <div className="ml-auto flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'type-label inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
                        'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                        'hover:bg-[var(--bg-hover)] transition-colors',
                      )}
                      onClick={handleCompact}
                    >
                      <Minimize2 size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{t('contextMenu.compactSession')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'type-label inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
                        'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                        'hover:bg-[var(--bg-hover)] transition-colors',
                      )}
                      onClick={handleReset}
                    >
                      <RotateCcw size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{t('contextMenu.resetSession')}</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}

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
            hasContextFolders={contextFolders.length > 0}
            activeTab={mentionTab}
            selectedIndex={mentionIndex}
            onSelectTask={(task) => commitMention({ kind: 'task', task })}
            onSelectArtifact={(a) => commitMention({ kind: 'file', artifact: a })}
            onSelectLocalFile={(f) => commitMention({ kind: 'local', file: f })}
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
              'flex items-end gap-2',
              'bg-[var(--bg-elevated)] rounded-2xl p-3.5',
              'border border-[var(--border-subtle)]',
              'shadow-[var(--shadow-elevated)]',
              'ring-accent-focus transition-all duration-200',
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

            <motion.div
              whileHover={reduced ? undefined : motionPresets.scale.whileHover}
              whileTap={reduced ? undefined : motionPresets.scale.whileTap}
              transition={motionPresets.scale.transition}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <Paperclip size={18} />
              </Button>
            </motion.div>

            <div className="flex-1 relative min-h-6">
              {(selectedTasks.length > 0 || selectedArtifacts.length > 0 || selectedLocalFiles.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pb-2">
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
                rows={1}
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
                  'outline-none max-h-40 disabled:opacity-50',
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
            <div className="flex items-center gap-1">
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
            </div>
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
                  <Button variant="soft" size="icon" onClick={handleSend} disabled={disabled} className="rounded-xl">
                    <Send size={18} />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center mt-2 gap-1.5 min-h-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleAddContextFolder}
                disabled={disabled}
                className={cn(
                  'type-support inline-flex flex-shrink-0 items-center gap-1 rounded-lg px-1.5 py-1',
                  'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  'hover:bg-[var(--bg-hover)] transition-colors',
                )}
              >
                <FolderPlus size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{t('chatInput.addContextFolder')}</TooltipContent>
          </Tooltip>
          {contextFolders.map((folder) => (
            <span
              key={folder}
              className={cn(
                'type-mono-data inline-flex max-w-48 flex-shrink-0 items-center gap-1 rounded-md px-2 py-1',
                'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
              )}
            >
              <span className="truncate">{folder.split('/').pop()}</span>
              <button
                onClick={() => handleRemoveContextFolder(folder)}
                className="opacity-50 hover:opacity-100 flex-shrink-0"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {contextFolders.length > 0 && contextFileCount > 0 && (
            <span className="type-mono-data flex-shrink-0 text-[var(--text-muted)]">{contextFileCount} files</span>
          )}
          <p className="type-support flex-1 text-right text-[var(--text-muted)]">
            {isOffline
              ? t('chatInput.offlineHint')
              : sendShortcut === 'cmdEnter'
                ? t('chatInput.poweredBy') + ' · ' + t('chatInput.toSend', { mod: modKey })
                : t('chatInput.poweredBy')}
          </p>
        </div>
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
