import { useRef, useCallback, useState, useEffect, useMemo, type KeyboardEvent, type ChangeEvent } from 'react';
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
import type {
  MessageImageAttachment,
  ModelCatalogEntry,
  ToolEntry,
  Task,
  Artifact,
  FileIndexEntry,
  FileReadResult,
} from '@clawwork/shared';
import { toast } from 'sonner';
import { markAbortedByUser } from '@/hooks/useGatewayDispatcher';
import { buildAppError, formatErrorForUser, formatErrorForToast } from '@/lib/error-format';
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
import { useTaskStore } from '../stores/taskStore';
import { useMessageStore } from '../stores/messageStore';
import { useUiStore } from '../stores/uiStore';
import SlashCommandMenu from './SlashCommandMenu';
import SlashCommandDashboard from './SlashCommandDashboard';
import ToolsCatalog from './ToolsCatalog';
import SlashArgPicker from './SlashArgPicker';
import type { ArgOption } from './SlashArgPicker';
import VoiceIntroDialog from './VoiceIntroDialog';
import MentionPicker, { type MentionItem, type MentionTab } from './MentionPicker';
import { useFileStore } from '../stores/fileStore';
import {
  filterSlashCommands,
  parseSlashQuery,
  getEnumOptions,
  hasArgPicker,
  type SlashCommand,
} from '@/lib/slash-commands';

interface PendingImage {
  file: File;
  previewUrl: string; // blob URL for display
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_TEXT_TOTAL = 500 * 1024;
const ACCEPTED_TYPES = 'image/png,image/jpeg,image/gif,image/webp';
const GATEWAY_INJECTED_MODEL = 'gateway-injected';
const EMPTY_MODELS_CATALOG: ModelCatalogEntry[] = [];

function getModelLabel(model: string | undefined, fallback?: string): string {
  if (!model || model === GATEWAY_INJECTED_MODEL) return fallback ?? 'Default';
  return model.split('/').pop() ?? model;
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

/** Validate and create blob preview URLs for image files. Returns accepted images. */
function processImageFiles(files: File[]): PendingImage[] {
  const accepted: PendingImage[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`${file.name} exceeds 5MB limit`);
      continue;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not an image`);
      continue;
    }
    accepted.push({ file, previewUrl: URL.createObjectURL(file) });
  }
  return accepted;
}

/** Read a File as base64 (no data URL prefix). */
function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'adaptive'] as const;
type ThinkingLevel = (typeof THINKING_LEVELS)[number];

const THINKING_LABEL_KEYS: Record<ThinkingLevel, string> = {
  off: 'chatInput.thinkingOff',
  minimal: 'chatInput.thinkingMinimal',
  low: 'chatInput.thinkingLow',
  medium: 'chatInput.thinkingMedium',
  high: 'chatInput.thinkingHigh',
  adaptive: 'chatInput.thinkingAdaptive',
};

export default function ChatInput() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  // ── Slash command autocomplete state ─────────────────────────────────────────
  const [slashMenuVisible, setSlashMenuVisible] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);
  const slashCommands = filterSlashCommands(slashQuery);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const [mentionVisible, setMentionVisible] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionTab, setMentionTab] = useState<MentionTab>('tasks');
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [selectedArtifacts, setSelectedArtifacts] = useState<Artifact[]>([]);
  const [selectedLocalFiles, setSelectedLocalFiles] = useState<FileIndexEntry[]>([]);
  const [localFilesForPicker, setLocalFilesForPicker] = useState<FileIndexEntry[]>([]);
  const mentionItemsRef = useRef<MentionItem[]>([]);
  const mentionWasVisible = useRef(false);

  const [argPickerVisible, setArgPickerVisible] = useState(false);
  const [argPickerCommand, setArgPickerCommand] = useState<SlashCommand | null>(null);
  const [argPickerOptions, setArgPickerOptions] = useState<ArgOption[]>([]);
  const [argPickerIndex, setArgPickerIndex] = useState(0);

  const sendShortcut = useUiStore((s) => s.sendShortcut);
  const mainView = useUiStore((s) => s.mainView);
  const settingsOpen = useUiStore((s) => s.settingsOpen);

  /** Evaluate the current textarea value and cursor position to determine
   *  whether to show the slash command menu. */
  const updateSlashMenu = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const result = parseSlashQuery(ta.value, ta.selectionStart ?? 0);
    if (result.active) {
      setSlashQuery(result.query);
      setSlashIndex(0);
      setSlashMenuVisible(true);
    } else {
      setSlashMenuVisible(false);
    }
  }, []);

  const buildArgOptions = useCallback((cmd: SlashCommand): ArgOption[] => {
    if (cmd.pickerType === 'model') {
      const gwId =
        useTaskStore.getState().tasks.find((t) => t.id === useTaskStore.getState().activeTaskId)?.gatewayId ??
        useTaskStore.getState().pendingNewTask?.gatewayId;
      const catalog = gwId ? (useUiStore.getState().modelCatalogByGateway[gwId] ?? []) : [];
      return catalog.map((m) => ({
        value: m.id,
        label: m.name ?? m.id,
        detail: m.provider,
      }));
    }
    const opts = getEnumOptions(cmd);
    if (opts) return opts.map((v) => ({ value: v, label: v }));
    return [];
  }, []);

  const commitSlashCommand = useCallback(
    (cmd: SlashCommand) => {
      const ta = textareaRef.current;
      if (!ta) return;
      setSlashMenuVisible(false);
      setSlashQuery('');
      setSlashIndex(0);

      if (hasArgPicker(cmd)) {
        const newValue = `/${cmd.name} `;
        ta.value = newValue;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
        ta.setSelectionRange(newValue.length, newValue.length);
        ta.focus();
        setArgPickerCommand(cmd);
        setArgPickerOptions(buildArgOptions(cmd));
        setArgPickerIndex(0);
        setArgPickerVisible(true);
        return;
      }

      const newValue = `/${cmd.name} `;
      ta.value = newValue;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
      ta.setSelectionRange(newValue.length, newValue.length);
      ta.focus();
    },
    [buildArgOptions],
  );

  const commitArgOption = useCallback(
    (opt: ArgOption) => {
      const ta = textareaRef.current;
      if (!ta || !argPickerCommand) return;
      const newValue = `/${argPickerCommand.name} ${opt.value}`;
      ta.value = newValue;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
      ta.setSelectionRange(newValue.length, newValue.length);
      ta.focus();
      setArgPickerVisible(false);
      setArgPickerCommand(null);
      setArgPickerOptions([]);
      setArgPickerIndex(0);
    },
    [argPickerCommand],
  );

  const closeArgPicker = useCallback(() => {
    setArgPickerVisible(false);
    setArgPickerCommand(null);
    setArgPickerOptions([]);
    setArgPickerIndex(0);
    textareaRef.current?.focus();
  }, []);

  const activeTask = useTaskStore((s) => s.tasks.find((t) => t.id === s.activeTaskId));
  const allTasks = useTaskStore((s) => s.tasks);
  const mentionableTasks = useMemo(
    () => allTasks.filter((t) => t.id !== activeTask?.id && t.title),
    [allTasks, activeTask?.id],
  );

  const isProcessing = useMessageStore((s) => (activeTask ? s.processingTasks.has(activeTask.id) : false));
  const isStreaming = useMessageStore((s) => {
    if (!activeTask) return false;
    const turn = s.activeTurnByTask[activeTask.id];
    return !!turn && !turn.finalized && (!!turn.streamingText || !!turn.streamingThinking);
  });
  const isGenerating = isProcessing || isStreaming;
  const responseTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!activeTask) return;
    if (isStreaming) {
      const timer = responseTimers.current.get(activeTask.id);
      if (timer) {
        clearTimeout(timer);
        responseTimers.current.delete(activeTask.id);
      }
    }
  }, [isStreaming, activeTask]);

  useEffect(() => {
    const timers = responseTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const addMessage = useMessageStore((s) => s.addMessage);
  const setProcessing = useMessageStore((s) => s.setProcessing);
  const updateTaskTitle = useTaskStore((s) => s.updateTaskTitle);
  const updateTaskMetadata = useTaskStore((s) => s.updateTaskMetadata);
  const commitPendingTask = useTaskStore((s) => s.commitPendingTask);
  const pendingNewTask = useTaskStore((s) => s.pendingNewTask);
  const isOffline = useUiStore((s) => {
    const gwId = activeTask?.gatewayId ?? pendingNewTask?.gatewayId;
    if (gwId) {
      const st = s.gatewayStatusMap[gwId];
      return st === 'disconnected' || st === undefined;
    }
    const values = Object.values(s.gatewayStatusMap);
    return values.length > 0 && !values.some((v) => v === 'connected');
  });

  const taskGwId = activeTask?.gatewayId ?? pendingNewTask?.gatewayId;
  const modelCatalog = useUiStore(
    (s) => (taskGwId ? s.modelCatalogByGateway[taskGwId] : undefined) ?? EMPTY_MODELS_CATALOG,
  );
  const toolsCatalog = useUiStore((s) => (taskGwId ? s.toolsCatalogByGateway[taskGwId] : undefined));
  const currentModel = activeTask
    ? activeTask.model === GATEWAY_INJECTED_MODEL
      ? undefined
      : activeTask.model
    : pendingNewTask?.model;
  const currentThinking = (activeTask?.thinkingLevel ?? pendingNewTask?.thinkingLevel ?? 'off') as ThinkingLevel;
  const [whisperAvailable, setWhisperAvailable] = useState(false);
  useEffect(() => {
    window.clawwork.checkWhisper().then((r) => setWhisperAvailable(r.available));
  }, []);
  const currentModelEntry = currentModel ? modelCatalog.find((m) => m.id === currentModel) : undefined;
  const modelLabel = currentModelEntry?.name ?? getModelLabel(currentModel, modelCatalog[0]?.name);

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
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
    isTranscribing: isVoiceTranscribing,
    isIntroOpen: isVoiceIntroOpen,
    interimTranscript: _interimTranscript,
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

  const modelsByProvider = useMemo(() => {
    const groups: Record<string, typeof modelCatalog> = {};
    for (const m of modelCatalog) {
      const provider = m.provider ?? 'Other';
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(m);
    }
    return groups;
  }, [modelCatalog]);

  const [contextFolders, setContextFolders] = useState<string[]>([]);
  const [contextFileCount, setContextFileCount] = useState(0);
  const activeTaskId = activeTask?.id ?? null;
  const foldersByTaskRef = useRef<Record<string, string[]>>({});
  const prevTaskIdRef = useRef<string>('');
  const refreshIdRef = useRef(0);

  const refreshContextFiles = useCallback(async (folders: string[]) => {
    const id = ++refreshIdRef.current;
    if (folders.length === 0) {
      setContextFileCount(0);
      return;
    }
    const res = await window.clawwork.listContextFiles(folders);
    if (id !== refreshIdRef.current) return;
    if (res.ok && res.result) {
      const files = res.result as unknown as FileIndexEntry[];
      setContextFileCount(files.filter((f) => f.tier === 'text').length);
    }
  }, []);

  useEffect(() => {
    const key = activeTaskId ?? '';
    const prevKey = prevTaskIdRef.current;

    const prevFolders = foldersByTaskRef.current[prevKey] ?? [];
    for (const f of prevFolders) window.clawwork.unwatchContextFolder(f);

    const nextFolders = foldersByTaskRef.current[key] ?? [];
    for (const f of nextFolders) window.clawwork.watchContextFolder(f);
    setContextFolders(nextFolders);
    refreshContextFiles(nextFolders);

    prevTaskIdRef.current = key;
    setSelectedTasks([]);
    setSelectedArtifacts([]);
    setSelectedLocalFiles([]);
  }, [activeTaskId, refreshContextFiles]);

  useEffect(() => {
    const cleanup = window.clawwork.onContextFilesChanged((changedFolder) => {
      if (contextFolders.includes(changedFolder)) {
        refreshContextFiles(contextFolders);
      }
    });
    return cleanup;
  }, [contextFolders, refreshContextFiles]);

  useEffect(() => {
    const taskFolders = foldersByTaskRef.current;
    const prevRef = prevTaskIdRef;
    return () => {
      const folders = taskFolders[prevRef.current] ?? [];
      for (const f of folders) window.clawwork.unwatchContextFolder(f);
    };
  }, []);

  const handleAddContextFolder = useCallback(async () => {
    const res = await window.clawwork.selectContextFolder();
    if (res.ok && res.result) {
      const path = res.result as unknown as string;
      setContextFolders((prev) => {
        const next = prev.includes(path) ? prev : [...prev, path];
        const key = activeTaskId ?? '';
        foldersByTaskRef.current[key] = next;
        return next;
      });
      await window.clawwork.watchContextFolder(path);
      refreshContextFiles([...(foldersByTaskRef.current[activeTaskId ?? ''] ?? [])]);
    }
  }, [activeTaskId, refreshContextFiles]);

  const handleRemoveContextFolder = useCallback(
    (path: string) => {
      window.clawwork.unwatchContextFolder(path);
      setContextFolders((prev) => {
        const next = prev.filter((f) => f !== path);
        const key = activeTaskId ?? '';
        foldersByTaskRef.current[key] = next;
        return next;
      });
      const remaining = foldersByTaskRef.current[activeTaskId ?? ''] ?? [];
      refreshContextFiles(remaining);
    },
    [activeTaskId, refreshContextFiles],
  );

  // Revoke blob URLs on cleanup
  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only on unmount
  }, []);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const accepted = processImageFiles(Array.from(files));
    if (accepted.length) {
      setPendingImages((prev) => [...prev, ...accepted]);
    }
    e.target.value = '';
  }, []);

  const removeImage = useCallback((index: number) => {
    setPendingImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const loadLocalFiles = useCallback(
    async (query?: string) => {
      if (contextFolders.length === 0) {
        setLocalFilesForPicker([]);
        return;
      }
      const res = await window.clawwork.listContextFiles(contextFolders, query);
      if (res.ok && res.result) {
        const files = res.result as unknown as FileIndexEntry[];
        setLocalFilesForPicker(files.filter((f) => f.tier === 'text'));
      }
    },
    [contextFolders],
  );

  const updateMentionPicker = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? 0;
    const before = ta.value.slice(0, pos);
    const atMatch = before.match(/@([^\s@]*)$/);
    if (atMatch) {
      if (!mentionWasVisible.current) {
        if (contextFolders.length > 0) {
          setMentionTab('local');
        } else {
          const hasArtifacts = useFileStore.getState().artifacts.length > 0;
          setMentionTab(hasArtifacts ? 'files' : 'tasks');
        }
        loadLocalFiles();
      }
      mentionWasVisible.current = true;
      setMentionVisible(true);
      setMentionQuery(atMatch[1]);
      setMentionIndex(0);
    } else {
      mentionWasVisible.current = false;
      setMentionVisible(false);
    }
  }, [contextFolders, loadLocalFiles]);

  const closeMentionPicker = useCallback(() => {
    mentionWasVisible.current = false;
    setMentionVisible(false);
    setMentionQuery('');
    setMentionIndex(0);
  }, []);

  const stripAtQuery = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? 0;
    const before = ta.value.slice(0, pos);
    const after = ta.value.slice(pos);
    const atStart = before.lastIndexOf('@');
    if (atStart === -1) return;
    const newBefore = before.slice(0, atStart);
    ta.value = newBefore + after;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    ta.setSelectionRange(newBefore.length, newBefore.length);
    ta.focus();
  }, []);

  const commitMention = useCallback(
    (item: MentionItem) => {
      if (item.kind === 'task') {
        if (selectedTasks.some((t) => t.id === item.task.id)) {
          closeMentionPicker();
          return;
        }
        stripAtQuery();
        setSelectedTasks((prev) => [...prev, item.task]);
      } else if (item.kind === 'local') {
        if (selectedLocalFiles.some((f) => f.absolutePath === item.file.absolutePath)) {
          closeMentionPicker();
          return;
        }
        stripAtQuery();
        setSelectedLocalFiles((prev) => [...prev, item.file]);
      } else {
        if (selectedArtifacts.some((a) => a.id === item.artifact.id)) {
          closeMentionPicker();
          return;
        }
        stripAtQuery();
        setSelectedArtifacts((prev) => [...prev, item.artifact]);
      }
      closeMentionPicker();
    },
    [selectedTasks, selectedArtifacts, selectedLocalFiles, closeMentionPicker, stripAtQuery],
  );

  const removeSelectedTask = useCallback((taskId: string) => {
    setSelectedTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const removeSelectedArtifact = useCallback((id: string) => {
    setSelectedArtifacts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const removeSelectedLocalFile = useCallback((path: string) => {
    setSelectedLocalFiles((prev) => prev.filter((f) => f.absolutePath !== path));
  }, []);

  const handleMentionItemsChange = useCallback((items: MentionItem[]) => {
    mentionItemsRef.current = items;
  }, []);

  const handleSend = useCallback(async () => {
    const textarea = textareaRef.current;
    if (!textarea || isOffline) return;
    stopVoiceInput();

    const content = textarea.value.trim();
    if (!content && !pendingImages.length) return;

    const pendingPreset = !activeTask ? useTaskStore.getState().pendingNewTask : null;
    const pendingPresetModel = pendingPreset?.model;
    const pendingPresetThinking = pendingPreset?.thinkingLevel;

    let task = activeTask;
    if (!task) {
      try {
        task = commitPendingTask();
      } catch {
        toast.error(t('errors.agentNotResponding'));
        return;
      }
    }

    textarea.value = '';
    textarea.style.height = 'auto';
    const images = [...pendingImages];
    const taskMentions = [...selectedTasks];
    const artifactMentions = [...selectedArtifacts];
    const localFileMentions = [...selectedLocalFiles];
    setPendingImages([]);
    setSelectedTasks([]);
    setSelectedArtifacts([]);
    setSelectedLocalFiles([]);

    try {
      let finalContent = content || '';
      const extraAttachments: { mimeType: string; fileName: string; content: string }[] = [];

      if (taskMentions.length > 0) {
        let taskContextSize = 0;
        const blocks = await Promise.all(
          taskMentions.map(async (mt) => {
            const res = await window.clawwork.loadMessages(mt.id);
            if (!res.ok || !res.rows) return '';
            const msgs = res.rows.filter((m) => m.role === 'user' || m.role === 'assistant');
            const lines: string[] = [];
            for (const m of msgs) {
              const line = `[${m.role}]\n${m.content}`;
              taskContextSize += new TextEncoder().encode(line).length;
              if (taskContextSize > MAX_TEXT_TOTAL) {
                toast.error(t('chatInput.taskContextLimitExceeded'));
                break;
              }
              lines.push(line);
            }
            if (lines.length === 0) return '';
            return `<task-context name="${mt.title}" id="${mt.id}">\n${lines.join('\n\n')}\n</task-context>`;
          }),
        );
        const combined = blocks.filter(Boolean).join('\n\n');
        if (combined) {
          finalContent = combined + '\n\n' + finalContent;
        }
      }

      if (artifactMentions.length > 0) {
        const readResults = await Promise.all(
          artifactMentions.map((a) =>
            window.clawwork.readArtifactFile(a.localPath).then((res) => ({ artifact: a, res })),
          ),
        );

        const textBlocks: string[] = [];
        let totalTextSize = 0;

        for (const { artifact: a, res } of readResults) {
          if (!res.ok || !res.result) continue;
          const read = res.result as { content: string; encoding: string };

          if (read.encoding === 'utf-8') {
            const blockSize = new TextEncoder().encode(read.content).length;
            totalTextSize += blockSize;
            if (totalTextSize > MAX_TEXT_TOTAL) {
              toast.error(t('chatInput.fileContextLimitExceeded'));
              break;
            }
            textBlocks.push(`<file path="${a.name}">\n${read.content}\n</file>`);
          } else {
            extraAttachments.push({
              mimeType: a.mimeType || 'application/octet-stream',
              fileName: a.name,
              content: read.content,
            });
          }
        }

        if (textBlocks.length > 0) {
          finalContent = textBlocks.join('\n\n') + '\n\n' + finalContent;
        }
      }

      if (localFileMentions.length > 0) {
        const readResults = await Promise.all(
          localFileMentions.map((f) =>
            window.clawwork.readContextFile(f.absolutePath, contextFolders).then((res) => ({ file: f, res })),
          ),
        );

        const localBlocks: string[] = [];
        let totalLocalSize = 0;

        for (const { file: f, res } of readResults) {
          if (!res.ok || !res.result) continue;
          const read = res.result as unknown as FileReadResult;

          if (read.tier === 'text') {
            const blockSize = new TextEncoder().encode(read.content).length;
            totalLocalSize += blockSize;
            if (totalLocalSize > MAX_TEXT_TOTAL) {
              toast.error(t('chatInput.fileContextLimitExceeded'));
              break;
            }
            localBlocks.push(`<file path="${f.relativePath}">\n${read.content}\n</file>`);
          }
        }

        if (localBlocks.length > 0) {
          finalContent = localBlocks.join('\n\n') + '\n\n' + finalContent;
        }
      }

      const msgImages: MessageImageAttachment[] | undefined = images.length
        ? images.map((img) => ({ fileName: img.file.name, dataUrl: img.previewUrl }))
        : undefined;

      const pendingUserMessage = addMessage(task.id, 'user', finalContent, msgImages, { persist: false });
      setProcessing(task.id, true);

      if (!task.title) {
        const titleSource =
          content ||
          (localFileMentions.length ? `[@${localFileMentions[0].fileName}]` : '') ||
          (taskMentions.length ? `[@${taskMentions[0].title}]` : '') ||
          (artifactMentions.length ? `[@${artifactMentions[0].name}]` : '') ||
          (images.length ? `[${t('chatInput.image')}]` : '');
        const title = titleSource.slice(0, 30).replace(/\n/g, ' ').trim();
        updateTaskTitle(task.id, title + (titleSource.length > 30 ? '\u2026' : ''));
      }

      const imageAttachments = images.length
        ? await Promise.all(
            images.map(async (img) => ({
              mimeType: img.file.type || 'image/png',
              fileName: img.file.name,
              content: await readAsBase64(img.file),
            })),
          )
        : [];
      const allAttachments = [...imageAttachments, ...extraAttachments];
      if (pendingPresetModel) {
        await window.clawwork.sendMessage(task.gatewayId, task.sessionKey, `/model ${pendingPresetModel}`);
        updateTaskMetadata(task.id, {
          model: pendingPresetModel,
          modelProvider: useUiStore
            .getState()
            .modelCatalogByGateway[task.gatewayId]?.find((m) => m.id === pendingPresetModel)?.provider,
        });
      }
      if (pendingPresetThinking && pendingPresetThinking !== 'off') {
        await window.clawwork.sendMessage(task.gatewayId, task.sessionKey, `/think ${pendingPresetThinking}`);
        updateTaskMetadata(task.id, { thinkingLevel: pendingPresetThinking });
      }
      const result = await window.clawwork.sendMessage(
        task.gatewayId,
        task.sessionKey,
        finalContent,
        allAttachments.length > 0 ? allAttachments : undefined,
      );
      if (result && !result.ok) {
        setProcessing(task.id, false);
        const appError = buildAppError({
          source: 'gateway',
          stage: 'send',
          rawMessage: result.error || t('errors.sendFailed'),
          code: result.errorCode,
          details: result.errorDetails,
        });
        addMessage(task.id, 'system', formatErrorForUser(appError, t));
        const toastMsg = formatErrorForToast(appError, t);
        toast.error(toastMsg.title, { description: toastMsg.description });
      } else {
        const sentTaskId = task.id;
        const prev = responseTimers.current.get(sentTaskId);
        if (prev) clearTimeout(prev);
        responseTimers.current.set(
          sentTaskId,
          setTimeout(() => {
            responseTimers.current.delete(sentTaskId);
            const store = useMessageStore.getState();
            const turn = store.activeTurnByTask[sentTaskId];
            if (store.processingTasks.has(sentTaskId) && (!turn || (!turn.streamingText && !turn.streamingThinking))) {
              store.setProcessing(sentTaskId, false);
              const appError = buildAppError({
                source: 'gateway',
                stage: 'lifecycle',
                rawMessage: t('errors.agentNotResponding'),
              });
              store.addMessage(sentTaskId, 'system', formatErrorForUser(appError, t));
            }
          }, 30_000),
        );
        window.clawwork
          .persistMessage({
            id: pendingUserMessage.id,
            taskId: pendingUserMessage.taskId,
            role: pendingUserMessage.role,
            content: pendingUserMessage.content,
            timestamp: pendingUserMessage.timestamp,
            imageAttachments: pendingUserMessage.imageAttachments as unknown[] | undefined,
            toolCalls: pendingUserMessage.toolCalls,
          })
          .catch(() => {});
      }
    } catch (err) {
      setProcessing(task.id, false);
      const appError = buildAppError({
        source: 'local',
        stage: 'send',
        rawMessage: err instanceof Error ? err.message : String(err),
      });
      addMessage(task.id, 'system', formatErrorForUser(appError, t));
      const toastMsg = formatErrorForToast(appError, t);
      toast.error(toastMsg.title, { description: toastMsg.description });
    }
  }, [
    activeTask,
    addMessage,
    setProcessing,
    updateTaskTitle,
    isOffline,
    pendingImages,
    selectedTasks,
    selectedArtifacts,
    selectedLocalFiles,
    contextFolders,
    stopVoiceInput,
    commitPendingTask,
    updateTaskMetadata,
    t,
  ]);

  const handleModelQuickSend = useCallback(
    (modelId: string) => {
      if (!activeTask) {
        useTaskStore.setState((s) => ({
          pendingNewTask: s.pendingNewTask ? { ...s.pendingNewTask, model: modelId } : null,
        }));
        return;
      }
      const ta = textareaRef.current;
      if (!ta) return;
      updateTaskMetadata(activeTask.id, {
        model: modelId,
        modelProvider: modelCatalog.find((m) => m.id === modelId)?.provider,
      });
      ta.value = `/model ${modelId}`;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
      void handleSend();
    },
    [activeTask, handleSend, modelCatalog, updateTaskMetadata],
  );

  const handleThinkingQuickSend = useCallback(
    (level: ThinkingLevel) => {
      if (!activeTask) {
        useTaskStore.setState((s) => ({
          pendingNewTask: s.pendingNewTask ? { ...s.pendingNewTask, thinkingLevel: level } : null,
        }));
        return;
      }
      const ta = textareaRef.current;
      if (!ta) return;
      ta.value = `/think ${level}`;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
      void handleSend();
    },
    [activeTask, handleSend],
  );

  const handleCompact = useCallback(() => {
    if (!activeTask || isOffline) return;
    window.clawwork
      .compactSession(activeTask.gatewayId, activeTask.sessionKey)
      .then((res) => {
        if (res.ok) addMessage(activeTask.id, 'system', t('session.contextCompacted'));
      })
      .catch(() => {});
  }, [activeTask, isOffline, addMessage, t]);

  const handleReset = useCallback(() => {
    if (!activeTask || isOffline) return;
    const { clearMessages } = useMessageStore.getState();
    window.clawwork
      .resetSession(activeTask.gatewayId, activeTask.sessionKey, 'reset')
      .then((res) => {
        if (res.ok) {
          clearMessages(activeTask.id);
          addMessage(activeTask.id, 'system', t('session.contextReset'));
        }
      })
      .catch(() => {});
  }, [activeTask, isOffline, addMessage, t]);

  const [aborting, setAborting] = useState(false);
  const handleAbort = useCallback(async () => {
    if (!activeTask || aborting) return;
    setAborting(true);
    markAbortedByUser(activeTask.id);
    const abortTimer = responseTimers.current.get(activeTask.id);
    if (abortTimer) {
      clearTimeout(abortTimer);
      responseTimers.current.delete(activeTask.id);
    }
    try {
      await window.clawwork.abortChat(activeTask.gatewayId, activeTask.sessionKey);
    } catch {
      toast.error(t('chatInput.abortFailed'));
    } finally {
      setTimeout(() => setAborting(false), 500);
    }
  }, [activeTask, aborting, t]);

  const handleToolSelect = useCallback((tool: ToolEntry) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const insert = `${tool.label} `;
    const pos = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, pos);
    const after = ta.value.slice(pos);
    const needSpace = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
    ta.value = before + (needSpace ? ' ' : '') + insert + after;
    const newPos = pos + (needSpace ? 1 : 0) + insert.length;
    ta.setSelectionRange(newPos, newPos);
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    ta.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      handleVoiceKeyDown(e);
      if (e.defaultPrevented) {
        return;
      }

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

      // ── Slash menu keyboard navigation ────────────────────────────────────────
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

      // ── Send ──────────────────────────────────────────────────────────────────
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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (!imageFiles.length) return;
    e.preventDefault();

    const accepted = processImageFiles(imageFiles);
    if (accepted.length) {
      setPendingImages((prev) => [...prev, ...accepted]);
    }
  }, []);

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
        {/* Image preview strip */}
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
                  <span className="absolute bottom-0 left-0 right-0 text-2xs text-center text-[var(--text-muted)] bg-[var(--overlay-scrim)] rounded-b-lg truncate px-1">
                    {img.file.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Model & Thinking toolbar */}
        {!isOffline && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {/* Model selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm',
                    'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                    'hover:bg-[var(--bg-hover)] transition-colors',
                  )}
                >
                  <Cpu size={16} className="flex-shrink-0" />
                  <span className="max-w-24 truncate">{modelLabel}</span>
                  {currentModelEntry?.reasoning && (
                    <span className="px-1 py-px rounded text-2xs font-medium bg-[var(--accent)]/15 text-[var(--accent)]">
                      R
                    </span>
                  )}
                  {currentModelEntry?.contextWindow && (
                    <span className="px-1 py-px rounded text-2xs font-medium bg-[var(--info)]/15 text-[var(--info)]">
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
                            <span className="px-1 py-px rounded text-2xs font-medium bg-[var(--accent)]/15 text-[var(--accent)]">
                              R
                            </span>
                          )}
                          {m.contextWindow && (
                            <span className="ml-auto pl-2 px-1 py-px rounded text-2xs font-medium bg-[var(--info)]/15 text-[var(--info)]">
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

            {/* Thinking level selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm',
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
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm',
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
                        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm',
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
                        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm',
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

        {/* Input area — relative wrapper for SlashCommandMenu positioning */}
        <div className="relative">
          {/* Slash command autocomplete menu */}
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
            tasks={mentionableTasks}
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
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Attach button */}
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
                        'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg',
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
                        'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg',
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
                        'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg',
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
                        <span className="text-sm text-[var(--text-secondary)]">{t('voiceInput.listeningStatus')}</span>
                      </>
                    )}
                    {isVoiceTranscribing && (
                      <>
                        <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                        <span className="text-sm text-[var(--text-secondary)]">{t('voiceInput.transcribing')}</span>
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
              <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                {t('voiceInput.beta')}
              </span>
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
                  'inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-xs flex-shrink-0',
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
                'inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md flex-shrink-0 max-w-48',
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
            <span className="text-xs text-[var(--text-muted)] flex-shrink-0 tabular-nums">
              {contextFileCount} files
            </span>
          )}
          <p className="flex-1 text-sm text-[var(--text-muted)] text-right tracking-wide">
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
