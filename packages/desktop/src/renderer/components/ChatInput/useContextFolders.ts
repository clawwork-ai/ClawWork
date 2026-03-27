import { useState, useCallback, useEffect, useRef } from 'react';
import type { FileIndexEntry } from '@clawwork/shared';
import { useTaskStore } from '../../stores/taskStore';

export function useContextFolders() {
  const [contextFolders, setContextFolders] = useState<string[]>([]);
  const [contextFileCount, setContextFileCount] = useState(0);
  const [localFilesForPicker, setLocalFilesForPicker] = useState<FileIndexEntry[]>([]);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const foldersByTaskRef = useRef<Record<string, string[]>>({});
  const prevTaskIdRef = useRef<string>('');
  const refreshIdRef = useRef(0);

  const refreshContextFiles = useCallback(async (folders: string[]) => {
    const id = ++refreshIdRef.current;
    if (folders.length === 0) {
      setContextFileCount(0);
      return;
    }
    if (typeof window.clawwork.listContextFiles !== 'function') {
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
    if (typeof window.clawwork.unwatchContextFolder === 'function') {
      for (const f of prevFolders) window.clawwork.unwatchContextFolder(f);
    }

    const nextFolders = foldersByTaskRef.current[key] ?? [];
    if (typeof window.clawwork.watchContextFolder === 'function') {
      for (const f of nextFolders) window.clawwork.watchContextFolder(f);
    }
    setContextFolders(nextFolders);
    refreshContextFiles(nextFolders);

    prevTaskIdRef.current = key;
  }, [activeTaskId, refreshContextFiles]);

  useEffect(() => {
    if (typeof window.clawwork.onContextFilesChanged !== 'function') return;
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
      if (typeof window.clawwork.unwatchContextFolder === 'function') {
        for (const f of folders) window.clawwork.unwatchContextFolder(f);
      }
    };
  }, []);

  const handleAddContextFolder = useCallback(async () => {
    if (
      typeof window.clawwork.selectContextFolder !== 'function' ||
      typeof window.clawwork.watchContextFolder !== 'function'
    ) {
      return;
    }
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
      if (typeof window.clawwork.unwatchContextFolder === 'function') {
        window.clawwork.unwatchContextFolder(path);
      }
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

  const loadLocalFiles = useCallback(
    async (query?: string) => {
      if (contextFolders.length === 0) {
        setLocalFilesForPicker([]);
        return;
      }
      if (typeof window.clawwork.listContextFiles !== 'function') {
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

  return {
    contextFolders,
    contextFileCount,
    localFilesForPicker,
    handleAddContextFolder,
    handleRemoveContextFolder,
    loadLocalFiles,
  };
}
