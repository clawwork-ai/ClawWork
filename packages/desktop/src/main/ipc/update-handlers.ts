import { ipcMain, app, net } from 'electron';
import {
  initAutoUpdater,
  isAutoUpdaterAvailable,
  checkForUpdatesViaUpdater,
  downloadUpdate,
  installUpdate,
  getUpdateChannel,
} from '../auto-updater.js';

interface ReleaseInfo {
  tag_name: string;
  html_url: string;
  prerelease?: boolean;
  draft?: boolean;
}

interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
  releaseNotes?: string | null;
}

const fallbackCache = new Map<string, { result: UpdateCheckResult; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;
const fallbackInFlight = new Map<string, Promise<UpdateCheckResult>>();

async function githubApiFallback(channel: 'stable' | 'beta'): Promise<UpdateCheckResult> {
  const existing = fallbackInFlight.get(channel);
  if (existing) return existing;

  const promise = (async (): Promise<UpdateCheckResult> => {
    const now = Date.now();
    const cached = fallbackCache.get(channel);
    if (cached && now < cached.expiresAt) {
      return cached.result;
    }

    const currentVersion = app.getVersion();
    const endpoint =
      channel === 'beta'
        ? 'https://api.github.com/repos/clawwork-ai/clawwork/releases?per_page=10'
        : 'https://api.github.com/repos/clawwork-ai/clawwork/releases/latest';

    try {
      const resp = await net.fetch(endpoint, {
        headers: { 'User-Agent': `ClawWork/${currentVersion}` },
      });

      if (!resp.ok) {
        throw new Error(`GitHub API returned ${resp.status}`);
      }

      const payload = (await resp.json()) as ReleaseInfo | ReleaseInfo[];
      const release =
        channel === 'beta' && Array.isArray(payload)
          ? payload.find((r) => !r.draft)
          : Array.isArray(payload)
            ? payload[0]
            : payload;

      if (!release) {
        throw new Error('no release found');
      }

      const latestVersion = release.tag_name.replace(/^v/, '');
      const result: UpdateCheckResult = {
        currentVersion,
        latestVersion,
        hasUpdate: latestVersion !== currentVersion,
        releaseUrl: release.html_url,
      };

      fallbackCache.set(channel, { result, expiresAt: now + CACHE_TTL_MS });
      return result;
    } finally {
      fallbackInFlight.delete(channel);
    }
  })();

  fallbackInFlight.set(channel, promise);
  return promise;
}

export function registerUpdateHandlers(): void {
  initAutoUpdater();

  ipcMain.handle('app:get-version', (): string => app.getVersion());

  ipcMain.handle('app:check-for-updates', async (): Promise<UpdateCheckResult> => {
    if (isAutoUpdaterAvailable()) {
      return checkForUpdatesViaUpdater();
    }
    return githubApiFallback(getUpdateChannel());
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
