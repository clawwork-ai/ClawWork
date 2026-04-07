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
  AgentInfo,
  Artifact,
  FileIndexEntry,
  MessageImageAttachment,
  ModelCatalogEntry,
  ToolEntry,
  FileReadResult,
} from '@clawwork/shared';
import type { PendingNewTask } from '@clawwork/core';
import { extractDescription } from '@clawwork/core';
import { useTaskStore } from '../../stores/taskStore';
import { useMessageStore } from '../../stores/messageStore';
import { useUiStore } from '../../stores/uiStore';
import { useRoomStore } from '../../stores/roomStore';
import { useTeamStore } from '../../stores/teamStore';
import { composer } from '../../platform';
import type { PendingImage } from './types';
import type { ThinkingLevel } from './constants';
import { GATEWAY_INJECTED_MODEL, EMPTY_MODELS_CATALOG, MAX_TEXT_TOTAL, MENTION_ALL_AGENT_ID } from './constants';
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
  selectedAgents: Array<{ agentId: string; agentName: string; emoji?: string; sessionKey: string }>;
  setSelectedAgents: Dispatch<
    SetStateAction<Array<{ agentId: string; agentName: string; emoji?: string; sessionKey: string }>>
  >;
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
    selectedAgents,
    setSelectedAgents,
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

  const activeRoom = useRoomStore((s) => (activeTask?.ensemble ? s.rooms[activeTask.id] : undefined));
  const sessionKeys = useMemo(() => {
    if (!activeTask?.sessionKey) return [];
    return [activeTask.sessionKey, ...(activeRoom?.performers.map((p) => p.sessionKey) ?? [])];
  }, [activeTask?.sessionKey, activeRoom?.performers]);

  const isProcessing = useMessageStore((s) => sessionKeys.some((sk) => s.processingBySession.has(sk)));
  const isStreaming = useMessageStore((s) =>
    sessionKeys.some((sk) => {
      const turn = s.activeTurnBySession[sk];
      return !!turn && !turn.finalized && (!!turn.streamingText || !!turn.streamingThinking);
    }),
  );
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
  const modelCatalogByGateway = useUiStore((s) => s.modelCatalogByGateway);
  const modelCatalog = (taskGwId ? modelCatalogByGateway[taskGwId] : undefined) ?? EMPTY_MODELS_CATALOG;
  const toolsCatalogByGateway = useUiStore((s) => s.toolsCatalogByGateway);
  const toolsCatalog = taskGwId ? toolsCatalogByGateway[taskGwId] : undefined;
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
  const abortResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (abortResetTimerRef.current) {
        clearTimeout(abortResetTimerRef.current);
        abortResetTimerRef.current = null;
      }
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

    if (task.ensemble) {
      const room = useRoomStore.getState().rooms[task.id];
      if (!room || !room.conductorReady) {
        const catalogEntryAll = useUiStore.getState().agentCatalogByGateway[task.gatewayId];
        const allAgents = catalogEntryAll?.agents ?? [];
        let agents: AgentInfo[];
        let teamAgentMap: Map<string, { role?: string }> | null = null;
        if (task.teamId) {
          const team = useTeamStore.getState().teams[task.teamId];
          const teamAgentIds = new Set(team?.agents.map((a) => a.agentId) ?? []);
          teamAgentMap = new Map(team?.agents.map((a) => [a.agentId, a]));
          agents = allAgents.filter((a) => teamAgentIds.has(a.id) && a.id !== task.agentId);
        } else {
          agents = allAgents.filter((a) => a.id !== 'main');
        }
        if (agents.length === 0) {
          toast.error(t('errors.conductorInitFailed'));
          return;
        }

        const msgImages: MessageImageAttachment[] | undefined = pendingImages.length
          ? pendingImages.map((img) => ({ fileName: img.file.name, dataUrl: img.previewUrl }))
          : undefined;
        if (content || msgImages?.length) {
          addMessage(task.id, 'user', content, msgImages);
        }
        setProcessing(task.sessionKey, true);
        textarea.value = '';
        textarea.style.height = 'auto';
        onComposerCleared?.();
        setPendingImages([]);
        setSelectedAgents([]);
        setSelectedTasks([]);
        setSelectedArtifacts([]);
        setSelectedLocalFiles([]);

        const descResults = await Promise.allSettled(
          agents.map((a) => window.clawwork.getAgentFile(task.gatewayId, a.id, 'IDENTITY.md')),
        );
        const descMap = new Map<string, string>();
        agents.forEach((a, i) => {
          const r = descResults[i];
          if (r.status === 'fulfilled' && r.value.ok && r.value.result) {
            const data = r.value.result as Record<string, unknown>;
            if (typeof data.content === 'string') {
              const desc = extractDescription(data.content);
              if (desc) descMap.set(a.id, desc);
            }
          }
        });

        const agentCatalogStr = agents
          .map((a) => {
            const name = (a.name ?? a.id).replaceAll('"', '\\"');
            const emojiPart = a.identity?.emoji ? `, emoji: ${a.identity.emoji}` : '';
            const ta = teamAgentMap?.get(a.id);
            const rolePart = ta?.role ? `, role: "${ta.role.replaceAll('"', '\\"')}"` : '';
            const desc = descMap.get(a.id);
            const descPart = desc ? `, description: "${desc.replaceAll('"', '\\"')}"` : '';
            return `- id: ${a.id}, name: "${name}"${emojiPart}${rolePart}${descPart}`;
          })
          .join('\n');
        const ok = await useRoomStore
          .getState()
          .initConductor(task.id, task.gatewayId, task.sessionKey, agentCatalogStr, content);
        if (!ok) {
          toast.error(t('errors.conductorInitFailed'));
          setProcessing(task.sessionKey, false);
        }
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
    const agentMentions = [...selectedAgents];
    setPendingImages([]);
    setSelectedAgents([]);
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

      const isMentionAll = agentMentions.some((a) => a.agentId === MENTION_ALL_AGENT_ID);
      await composer.send(task.id, {
        content: finalContent,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
        imageAttachments: msgImages,
        presetModel: pendingPresetModel,
        presetThinking: pendingPresetThinking,
        titleHint: task.title ? undefined : titleHint,
        mentionAll: isMentionAll || undefined,
        mentions: agentMentions.length > 0 && !isMentionAll ? agentMentions.map((a) => a.agentId) : undefined,
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
    selectedAgents,
    contextFolders,
    stopVoiceInput,
    setPendingImages,
    setSelectedTasks,
    setSelectedArtifacts,
    setSelectedLocalFiles,
    setSelectedAgents,
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

  const [aborting, setAborting] = useState(false);
  const handleAbort = useCallback(async () => {
    if (!activeTask || aborting) return;
    setAborting(true);
    try {
      await composer.abort(activeTask.id);
    } catch {
      toast.error(t('chatInput.abortFailed'));
    } finally {
      if (abortResetTimerRef.current) clearTimeout(abortResetTimerRef.current);
      abortResetTimerRef.current = setTimeout(() => {
        setAborting(false);
        abortResetTimerRef.current = null;
      }, 500);
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
    handleAbort,
    handleToolSelect,
  };
}
