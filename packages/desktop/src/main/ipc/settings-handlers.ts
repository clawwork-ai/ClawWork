import { BrowserWindow, ipcMain } from 'electron';
import { readConfig, updateConfig, writeConfig, buildGatewayAuth } from '../workspace/config.js';
import type { AppConfig, GatewayServerConfig } from '../workspace/config.js';
import { getGatewayClient, addGateway, removeGateway } from '../ws/index.js';
import { GatewayClient } from '../ws/gateway-client.js';
import { loadOrCreateDeviceIdentity } from '../ws/device-identity.js';
import { SUPPORTED_LANGUAGE_CODES } from '@clawwork/shared';
import type { GatewayAuth } from '@clawwork/shared';

function getMainWindow(): BrowserWindow | null {
  const wins = BrowserWindow.getAllWindows();
  return wins.length > 0 ? wins[0] : null;
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('pairing:get-device-identity', () => loadOrCreateDeviceIdentity());
  ipcMain.handle('settings:get', (): AppConfig | null => {
    return readConfig();
  });

  ipcMain.handle('settings:update', (_event, partial: Partial<AppConfig>): { ok: boolean; config: AppConfig } => {
    const { gateways: _g, defaultGatewayId: _d, ...safePartial } = partial;
    if (
      safePartial.language !== undefined &&
      !(SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(safePartial.language)
    ) {
      delete safePartial.language;
    }
    const config = updateConfig(safePartial);
    return { ok: true, config };
  });

  ipcMain.handle('settings:add-gateway', async (_event, gateway: GatewayServerConfig) => {
    const config = readConfig() ?? { workspacePath: '', gateways: [] };
    config.gateways.push(gateway);
    if (gateway.isDefault || config.gateways.length === 1) {
      config.defaultGatewayId = gateway.id;
    }
    writeConfig(config);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      addGateway({ id: gateway.id, name: gateway.name, url: gateway.url, auth: buildGatewayAuth(gateway) }, mainWindow);
    }
    return { ok: true };
  });

  ipcMain.handle('settings:remove-gateway', async (_event, gatewayId: string) => {
    const config = readConfig();
    if (!config) return { ok: false, error: 'no config' };
    config.gateways = config.gateways.filter((g) => g.id !== gatewayId);
    if (config.defaultGatewayId === gatewayId) {
      config.defaultGatewayId = config.gateways[0]?.id;
    }
    writeConfig(config);
    removeGateway(gatewayId);
    return { ok: true };
  });

  ipcMain.handle(
    'settings:update-gateway',
    async (_event, gatewayId: string, partial: Partial<GatewayServerConfig>) => {
      const config = readConfig();
      if (!config) return { ok: false, error: 'no config' };
      const idx = config.gateways.findIndex((g) => g.id === gatewayId);
      if (idx === -1) return { ok: false, error: 'gateway not found' };
      config.gateways[idx] = { ...config.gateways[idx], ...partial };
      writeConfig(config);
      const client = getGatewayClient(gatewayId);
      if (client) {
        const gw = config.gateways[idx];
        client.updateConfig({ url: gw.url, auth: buildGatewayAuth(gw) });
      }
      return { ok: true, gateway: config.gateways[idx] };
    },
  );

  ipcMain.handle('settings:set-default-gateway', async (_event, gatewayId: string) => {
    const config = readConfig();
    if (!config) return { ok: false, error: 'no config' };
    for (const gw of config.gateways) {
      gw.isDefault = gw.id === gatewayId;
    }
    config.defaultGatewayId = gatewayId;
    writeConfig(config);
    return { ok: true };
  });

  ipcMain.handle(
    'settings:test-gateway',
    async (_event, url: string, auth: { token?: string; password?: string; pairingCode?: string }) => {
      if (auth.pairingCode) {
        return { ok: false, error: 'pairing-code test is not supported' };
      }
      const testAuth: GatewayAuth = auth.token
        ? { token: auth.token }
        : auth.password
          ? { password: auth.password }
          : { token: '' };
      const testClient = new GatewayClient(
        { id: `test-${Date.now()}`, name: 'test', url, auth: testAuth },
        { noReconnect: true },
      );
      try {
        testClient.connect();
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline) {
          if (testClient.isConnected) return { ok: true };
          if (testClient.lastConnectionError) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        const errorCode = testClient.lastConnectionErrorCode;
        const msg = testClient.lastConnectionError ?? 'timeout';
        if (errorCode === 'PAIRING_REQUIRED') {
          return { ok: false, error: msg, pairingRequired: true };
        }
        return { ok: false, error: msg };
      } finally {
        testClient.destroy();
      }
    },
  );
}
