import { ipcMain } from 'electron';
import {
  listRegistryConfigs,
  addRegistryConfig,
  removeRegistryConfig,
  fetchRegistry,
  getCachedRegistry,
  downloadTeamPackage,
} from '../teamshub/registry.js';

export function registerHubHandlers(): void {
  ipcMain.handle('hub:registries-list', () => {
    const configs = listRegistryConfigs();
    return {
      ok: true,
      result: configs.map((c) => {
        const cached = getCachedRegistry(c.id);
        return cached ?? { ...c, name: '', description: '', teams: [], fetchedAt: '' };
      }),
    };
  });

  ipcMain.handle('hub:registry-fetch', async (_event, payload: { id: string }) => {
    const configs = listRegistryConfigs();
    const config = configs.find((c) => c.id === payload.id);
    if (!config) return { ok: false, error: 'Registry not found' };
    try {
      const registry = await fetchRegistry(config);
      return { ok: true, result: registry };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('hub:registry-add', async (_event, payload: { url: string }) => {
    try {
      const config = addRegistryConfig(payload.url);
      try {
        const registry = await fetchRegistry(config);
        return { ok: true, result: registry };
      } catch (fetchErr) {
        removeRegistryConfig(config.id);
        throw fetchErr;
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('hub:registry-remove', (_event, payload: { id: string }) => {
    try {
      removeRegistryConfig(payload.id);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('hub:team-download', async (_event, payload: { registryId: string; slug: string }) => {
    const configs = listRegistryConfigs();
    const config = configs.find((c) => c.id === payload.registryId);
    if (!config) return { ok: false, error: 'Registry not found' };
    try {
      const result = await downloadTeamPackage(config.url, payload.slug);
      return {
        ok: true,
        result: {
          parsed: result.parsed,
          agentFiles: Object.fromEntries(result.agentFiles),
        },
      };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}
