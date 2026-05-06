import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import type { FileIndexEntry } from '@clawwork/shared';
import { useTaskStore } from '../../stores/taskStore';

const hasApi = (method: string) =>
  typeof window.clawwork !== 'undefined' &&
  typeof (window.clawwork as unknown as Record<string, unknown>)?.[method] === 'function';

export function useContextFolders() {
  const { t } = useTranslation();
  const [contextFolders, setContextFolders] = useState<string[]>([]);
  const [localFilesForPicker, setLocalFilesForPicker] = useState<FileIndexEntry[]>([]);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const foldersByTaskRef = useRef<Record<string, string[]>>({});
  const prevTaskIdRef = useRef<string>('');

  const watchContextFolder = useCallback(
    async (path: string) => {
      const res = await window.clawwork.watchContextFolder(path);
      if (res.ok) return true;
      toast.error(t('chatInput.contextFolderWatchFailed'), { description: res.error });
      return false;
    },
    [t],
  );

  useEffect(() => {
    const key = activeTaskId ?? '';
    const prevKey = prevTaskIdRef.current;
    let cancelled = false;

    const prevFolders = foldersByTaskRef.current[prevKey] ?? [];
    if (hasApi('unwatchContextFolder')) {
      for (const f of prevFolders) window.clawwork.unwatchContextFolder(f);
    }

    const nextFolders = foldersByTaskRef.current[key] ?? [];
    if (hasApi('watchContextFolder')) {
      void Promise.all(nextFolders.map((f) => watchContextFolder(f))).then((results) => {
        if (cancelled) return;
        const watchedFolders = nextFolders.filter((_, index) => results[index]);
        foldersByTaskRef.current[key] = watchedFolders;
        setContextFolders(watchedFolders);
      });
    } else {
      setContextFolders(nextFolders);
    }

    prevTaskIdRef.current = key;
    return () => {
      cancelled = true;
    };
  }, [activeTaskId, watchContextFolder]);

  useEffect(() => {
    const taskFolders = foldersByTaskRef.current;
    const prevRef = prevTaskIdRef;
    return () => {
      const folders = taskFolders[prevRef.current] ?? [];
      if (hasApi('unwatchContextFolder')) {
        for (const f of folders) window.clawwork.unwatchContextFolder(f);
      }
    };
  }, []);

  const handleAddContextFolder = useCallback(async () => {
    if (!hasApi('selectContextFolder') || !hasApi('watchContextFolder')) {
      return;
    }
    const res = await window.clawwork.selectContextFolder();
    if (res.ok && res.result) {
      const path = res.result as unknown as string;
      const watched = await watchContextFolder(path);
      if (!watched) return;
      setContextFolders((prev) => {
        const next = prev.includes(path) ? prev : [...prev, path];
        const key = activeTaskId ?? '';
        foldersByTaskRef.current[key] = next;
        return next;
      });
    }
  }, [activeTaskId, watchContextFolder]);

  const handleRemoveContextFolder = useCallback(
    (path: string) => {
      if (hasApi('unwatchContextFolder')) {
        window.clawwork.unwatchContextFolder(path);
      }
      setContextFolders((prev) => {
        const next = prev.filter((f) => f !== path);
        const key = activeTaskId ?? '';
        foldersByTaskRef.current[key] = next;
        return next;
      });
    },
    [activeTaskId],
  );

  const loadLocalFiles = useCallback(
    async (query?: string) => {
      if (contextFolders.length === 0) {
        setLocalFilesForPicker([]);
        return;
      }
      if (!hasApi('listContextFiles')) {
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
    localFilesForPicker,
    handleAddContextFolder,
    handleRemoveContextFolder,
    loadLocalFiles,
  };
}
