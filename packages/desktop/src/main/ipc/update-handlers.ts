import { ipcMain, app, net } from 'electron';
import {
  initAutoUpdater,
  isAutoUpdaterAvailable,
  checkForUpdatesViaUpdater,
  downloadUpdate,
  installUpdate,
} from '../auto-updater.js';

interface ReleaseInfo {
  tag_name: string;
  html_url: string;
}

interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
  releaseNotes?: string | null;
}

let cachedFallbackResult: UpdateCheckResult | null = null;
let fallbackCacheExpiresAt = 0;
const CACHE_TTL_MS = 30 * 60 * 1000;
let fallbackInFlight: Promise<UpdateCheckResult> | null = null;

async function githubApiFallback(): Promise<UpdateCheckResult> {
  if (fallbackInFlight) return fallbackInFlight;

  const promise = (async (): Promise<UpdateCheckResult> => {
    const now = Date.now();
    if (cachedFallbackResult && now < fallbackCacheExpiresAt) {
      return cachedFallbackResult;
    }

    const currentVersion = app.getVersion();

    try {
      const resp = await net.fetch('https://api.github.com/repos/clawwork-ai/clawwork/releases/latest', {
        headers: { 'User-Agent': `ClawWork/${currentVersion}` },
      });

      if (!resp.ok) {
        throw new Error(`GitHub API returned ${resp.status}`);
      }

      const data = (await resp.json()) as ReleaseInfo;
      const latestVersion = data.tag_name.replace(/^v/, '');
      const releaseUrl = data.html_url;
      const hasUpdate = latestVersion !== currentVersion;

      cachedFallbackResult = { currentVersion, latestVersion, hasUpdate, releaseUrl };
      fallbackCacheExpiresAt = now + CACHE_TTL_MS;
      return cachedFallbackResult;
    } finally {
      fallbackInFlight = null;
    }
  })();

  fallbackInFlight = promise;
  return promise;
}

export function registerUpdateHandlers(): void {
  initAutoUpdater();

  ipcMain.handle('app:get-version', (): string => app.getVersion());

  ipcMain.handle('app:check-for-updates', async (): Promise<UpdateCheckResult> => {
    if (isAutoUpdaterAvailable()) {
      return checkForUpdatesViaUpdater();
    }
    return githubApiFallback();
  });

  ipcMain.handle('app:download-update', async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isAutoUpdaterAvailable()) {
      return { ok: false, error: 'dev-not-supported' };
    }
    return downloadUpdate();
  });

  ipcMain.handle('app:install-update', (): { ok: boolean; error?: string } => {
    if (!isAutoUpdaterAvailable()) {
      return { ok: false, error: 'dev-not-supported' };
    }
    return installUpdate();
  });
}
