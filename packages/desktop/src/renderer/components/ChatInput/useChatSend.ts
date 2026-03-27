import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  Task,
  Artifact,
  FileIndexEntry,
  MessageImageAttachment,
  ModelCatalogEntry,
  ToolEntry,
  FileReadResult,
} from '@clawwork/shared';
import type { PendingNewTask } from '@clawwork/core';
import { useTaskStore } from '../../stores/taskStore';
import { useMessageStore } from '../../stores/messageStore';
import { useUiStore } from '../../stores/uiStore';
import { composer } from '../../platform';
import type { PendingImage } from './types';
import type { ThinkingLevel } from './constants';
import { GATEWAY_INJECTED_MODEL, EMPTY_MODELS_CATALOG, MAX_TEXT_TOTAL } from './constants';
import { getModelLabel, readAsBase64 } from './utils';

interface UseChatSendOpts {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  pendingImages: PendingImage[];
  setPendingImages: Dispatch<SetStateAction<PendingImage[]>>;
  selectedTasks: Task[];
  setSelectedTasks: Dispatch<SetStateAction<Task[]>>;
  selectedArtifacts: Artifact[];
  setSelectedArtifacts: Dispatch<SetStateAction<Artifact[]>>;
  selectedLocalFiles: FileIndexEntry[];
  setSelectedLocalFiles: Dispatch<SetStateAction<FileIndexEntry[]>>;
  contextFolders: string[];
  stopVoiceInput: () => void;
  onComposerCleared?: () => void;
}

export function useChatSend(opts: UseChatSendOpts) {
  const {
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
    stopVoiceInput,
    onComposerCleared,
  } = opts;

  const { t } = useTranslation();

  const activeTask = useTaskStore((s) => s.tasks.find((tt) => tt.id === s.activeTaskId));
  const commitPendingTask = useTaskStore((s) => s.commitPendingTask);
  const updateTaskMetadata = useTaskStore((s) => s.updateTaskMetadata);
  const pendingNewTask = useTaskStore((s) => s.pendingNewTask);
  const addMessage = useMessageStore((s) => s.addMessage);
  const setProcessing = useMessageStore((s) => s.setProcessing);

  const isProcessing = useMessageStore((s) => (activeTask ? s.processingTasks.has(activeTask.id) : false));
  const isStreaming = useMessageStore((s) => {
    if (!activeTask) return false;
    const turn = s.activeTurnByTask[activeTask.id];
    return !!turn && !turn.finalized && (!!turn.streamingText || !!turn.streamingThinking);
  });
  const isGenerating = isProcessing || isStreaming;

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

  const currentModelEntry = currentModel ? modelCatalog.find((m) => m.id === currentModel) : undefined;
  const modelLabel = currentModelEntry?.name ?? getModelLabel(currentModel, modelCatalog[0]?.name);

  const modelsByProvider = useMemo(() => {
    const groups: Record<string, ModelCatalogEntry[]> = {};
    for (const m of modelCatalog) {
      const provider = m.provider ?? 'Other';
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(m);
    }
    return groups;
  }, [modelCatalog]);

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
    onComposerCleared?.();
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

      const titleHint =
        content ||
        (localFileMentions.length ? `[@${localFileMentions[0].fileName}]` : '') ||
        (taskMentions.length ? `[@${taskMentions[0].title}]` : '') ||
        (artifactMentions.length ? `[@${artifactMentions[0].name}]` : '') ||
        (images.length ? `[${t('chatInput.image')}]` : '');

      await composer.send(task.id, {
        content: finalContent,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
        imageAttachments: msgImages,
        presetModel: pendingPresetModel,
        presetThinking: pendingPresetThinking,
        titleHint: task.title ? undefined : titleHint,
      });
    } catch (err) {
      setProcessing(task.id, false);
      const msg = err instanceof Error ? err.message : String(err);
      addMessage(task.id, 'system', msg);
      toast.error(msg);
    }
  }, [
    activeTask,
    commitPendingTask,
    addMessage,
    setProcessing,
    isOffline,
    pendingImages,
    selectedTasks,
    selectedArtifacts,
    selectedLocalFiles,
    contextFolders,
    stopVoiceInput,
    setPendingImages,
    setSelectedTasks,
    setSelectedArtifacts,
    setSelectedLocalFiles,
    textareaRef,
    t,
    onComposerCleared,
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
    [activeTask, handleSend, modelCatalog, updateTaskMetadata, textareaRef],
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
    [activeTask, handleSend, textareaRef],
  );

  const handleCompact = useCallback(() => {
    if (!activeTask || isOffline) return;
    composer.applySlashCommand(activeTask.id, 'compact').catch(() => {});
  }, [activeTask, isOffline]);

  const handleReset = useCallback(() => {
    if (!activeTask || isOffline) return;
    composer.applySlashCommand(activeTask.id, 'reset').catch(() => {});
  }, [activeTask, isOffline]);

  const [aborting, setAborting] = useState(false);
  const handleAbort = useCallback(async () => {
    if (!activeTask || aborting) return;
    setAborting(true);
    try {
      await composer.abort(activeTask.id);
    } catch {
      toast.error(t('chatInput.abortFailed'));
    } finally {
      setTimeout(() => setAborting(false), 500);
    }
  }, [activeTask, aborting, t]);

  const handleToolSelect = useCallback(
    (tool: ToolEntry) => {
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
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    },
    [textareaRef],
  );

  return {
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
    pendingNewTask: pendingNewTask as PendingNewTask | null,
    taskGwId,
    handleSend,
    handleModelQuickSend,
    handleThinkingQuickSend,
    handleCompact,
    handleReset,
    handleAbort,
    handleToolSelect,
  };
}
