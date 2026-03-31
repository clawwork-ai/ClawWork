import { useState, useCallback, useRef, useEffect, type RefObject } from 'react';
import type { Task, Artifact, FileIndexEntry } from '@clawwork/shared';
import type { MentionItem, MentionTab, AgentMentionEntry } from '../MentionPicker';
import { useFileStore } from '../../stores/fileStore';
import { useTaskStore } from '../../stores/taskStore';

interface UseMentionPickerOpts {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  contextFolders: string[];
  loadLocalFiles: (query?: string) => Promise<void>;
  hasAgents?: boolean;
}

export function useMentionPicker(opts: UseMentionPickerOpts) {
  const { textareaRef, contextFolders, loadLocalFiles, hasAgents } = opts;

  const [mentionVisible, setMentionVisible] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionTab, setMentionTab] = useState<MentionTab>('tasks');
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [selectedArtifacts, setSelectedArtifacts] = useState<Artifact[]>([]);
  const [selectedLocalFiles, setSelectedLocalFiles] = useState<FileIndexEntry[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<AgentMentionEntry[]>([]);
  const mentionItemsRef = useRef<MentionItem[]>([]);
  const mentionWasVisible = useRef(false);

  const activeTaskId = useTaskStore((s) => s.activeTaskId);

  useEffect(() => {
    setSelectedTasks([]);
    setSelectedArtifacts([]);
    setSelectedLocalFiles([]);
    setSelectedAgents([]);
  }, [activeTaskId]);

  const updateMentionPicker = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? 0;
    const before = ta.value.slice(0, pos);
    const atMatch = before.match(/@([^\s@]*)$/);
    if (atMatch) {
      if (!mentionWasVisible.current) {
        if (hasAgents) {
          setMentionTab('agents');
        } else if (contextFolders.length > 0) {
          setMentionTab('local');
        } else {
          const hasArtifactsNow = useFileStore.getState().artifacts.length > 0;
          setMentionTab(hasArtifactsNow ? 'files' : 'tasks');
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
  }, [textareaRef, contextFolders, loadLocalFiles, hasAgents]);

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
  }, [textareaRef]);

  const removeSelectedAgent = useCallback((agentId: string) => {
    setSelectedAgents((prev) => prev.filter((a) => a.agentId !== agentId));
  }, []);

  const commitMention = useCallback(
    (item: MentionItem) => {
      if (item.kind === 'agent') {
        if (selectedAgents.some((a) => a.agentId === item.agent.agentId)) {
          closeMentionPicker();
          return;
        }
        stripAtQuery();
        setSelectedAgents((prev) => [...prev, item.agent]);
        closeMentionPicker();
        return;
      }
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
    [selectedTasks, selectedArtifacts, selectedLocalFiles, selectedAgents, closeMentionPicker, stripAtQuery],
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

  return {
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
    selectedAgents,
    setSelectedAgents,
    removeSelectedAgent,
    handleMentionItemsChange,
  };
}
