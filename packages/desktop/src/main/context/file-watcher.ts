import { watch, type FSWatcher } from 'node:fs';
import { BrowserWindow } from 'electron';
import { sendToWindow } from '../ws/window-utils.js';

const MAX_WATCHED_FOLDERS = 10;
const DEBOUNCE_MS = 500;

const watchers = new Map<string, FSWatcher>();
const pending = new Map<string, NodeJS.Timeout>();

function notifyRenderer(folderPath: string): void {
  const existing = pending.get(folderPath);
  if (existing) clearTimeout(existing);

  pending.set(
    folderPath,
    setTimeout(() => {
      pending.delete(folderPath);
      sendToWindow(BrowserWindow.getAllWindows()[0] ?? null, 'context:files-changed', folderPath);
    }, DEBOUNCE_MS),
  );
}

export function watchFolder(folderPath: string): void {
  if (watchers.has(folderPath)) return;
  if (watchers.size >= MAX_WATCHED_FOLDERS) return;

  const startedAt = Date.now();
  try {
    const watcher = watch(folderPath, { recursive: true }, () => {
      if (Date.now() - startedAt < DEBOUNCE_MS) return;
      notifyRenderer(folderPath);
    });

    watchers.set(folderPath, watcher);
  } catch {
    //
  }
}

export function unwatchFolder(folderPath: string): void {
  const timer = pending.get(folderPath);
  if (timer) {
    clearTimeout(timer);
    pending.delete(folderPath);
  }

  const watcher = watchers.get(folderPath);
  if (watcher) {
    watcher.close();
    watchers.delete(folderPath);
  }
}

export function unwatchAll(): void {
  for (const folderPath of [...watchers.keys()]) {
    unwatchFolder(folderPath);
  }
}
