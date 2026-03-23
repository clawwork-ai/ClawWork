import { app, BrowserWindow } from 'electron';
import electronUpdater from 'electron-updater';
import type { UpdateInfo, ProgressInfo } from 'electron-updater';
import { is } from '@electron-toolkit/utils';
import { getDebugLogger } from './debug/index.js';

const { autoUpdater } = electronUpdater;

type UpdaterState = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
  releaseNotes?: string | null;
}

type UpdateErrorCode = 'dev-not-supported' | 'network' | 'no-release-metadata' | 'signature' | 'unknown';

const GITHUB_RELEASE_BASE = 'https://github.com/clawwork-ai/clawwork/releases/tag/v';

let initialized = false;
let state: UpdaterState = 'idle';
let inFlightCheck: Promise<UpdateCheckResult> | null = null;

function broadcast(channel: string, data: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    try {
      win.webContents.send(channel, data);
    } catch {
      // window may be closing
    }
  }
}

function normalizeReleaseNotes(info: UpdateInfo): string | null {
  if (!info.releaseNotes) return null;
  if (typeof info.releaseNotes === 'string') return info.releaseNotes;
  if (Array.isArray(info.releaseNotes)) {
    return info.releaseNotes.map((n) => (typeof n === 'string' ? n : (n.note ?? ''))).join('\n');
  }
  return null;
}

function classifyError(err: unknown): UpdateErrorCode {
  const msg = err instanceof Error ? err.message : String(err);
  if (/ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|network/i.test(msg)) return 'network';
  if (/latest.*yml|no published/i.test(msg)) return 'no-release-metadata';
  if (/signature|verify|checksum/i.test(msg)) return 'signature';
  return 'unknown';
}

export function isAutoUpdaterAvailable(): boolean {
  return !is.dev && app.isPackaged;
}

export function initAutoUpdater(): void {
  if (!isAutoUpdaterAvailable()) return;
  if (initialized) return;
  initialized = true;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoRunAppAfterInstall = true;

  const logger = getDebugLogger();
  autoUpdater.logger = {
    info: (msg: unknown) => logger.info({ domain: 'updater', event: 'updater.info', message: String(msg) }),
    warn: (msg: unknown) => logger.warn({ domain: 'updater', event: 'updater.warn', message: String(msg) }),
    error: (msg: unknown) => logger.error({ domain: 'updater', event: 'updater.error', message: String(msg) }),
    debug: (msg: unknown) => logger.debug({ domain: 'updater', event: 'updater.debug', message: String(msg) }),
  };

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    state = 'downloading';
    broadcast('update:download-progress', {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    state = 'downloaded';
    broadcast('update:downloaded', { version: info.version });
  });

  autoUpdater.on('error', (err: Error) => {
    state = 'error';
    broadcast('update:error', { message: err.message, code: classifyError(err) });
  });
}

export async function checkForUpdatesViaUpdater(): Promise<UpdateCheckResult> {
  if (inFlightCheck) return inFlightCheck;

  const promise = (async (): Promise<UpdateCheckResult> => {
    const currentVersion = app.getVersion();
    state = 'checking';
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result || !result.updateInfo) {
        state = 'idle';
        return { currentVersion, latestVersion: currentVersion, hasUpdate: false, releaseUrl: '' };
      }

      const info = result.updateInfo;
      const latestVersion = info.version;
      const hasUpdate = latestVersion !== currentVersion;

      if (hasUpdate) {
        state = 'available';
      } else {
        state = 'idle';
      }

      return {
        currentVersion,
        latestVersion,
        hasUpdate,
        releaseUrl: `${GITHUB_RELEASE_BASE}${latestVersion}`,
        releaseNotes: normalizeReleaseNotes(info),
      };
    } catch (err) {
      state = 'error';
      getDebugLogger().warn({
        domain: 'updater',
        event: 'updater.check-failed',
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      inFlightCheck = null;
    }
  })();

  inFlightCheck = promise;
  return promise;
}

export async function downloadUpdate(): Promise<{ ok: boolean; error?: string }> {
  if (state !== 'available') {
    return { ok: false, error: 'no-update-available' };
  }
  state = 'downloading';
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (err) {
    state = 'error';
    const message = err instanceof Error ? err.message : String(err);
    broadcast('update:error', { message, code: classifyError(err) });
    return { ok: false, error: message };
  }
}

export function installUpdate(): { ok: boolean; error?: string } {
  if (state !== 'downloaded') {
    return { ok: false, error: 'no-downloaded-update' };
  }
  autoUpdater.quitAndInstall(false, true);
  return { ok: true };
}
