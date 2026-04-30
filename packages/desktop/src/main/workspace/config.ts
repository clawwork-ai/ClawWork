import { app, safeStorage } from 'electron';
import { dirname, join } from 'path';
import { closeSync, existsSync, fsyncSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { randomUUID } from 'node:crypto';
import { CONFIG_FILE_NAME, DEFAULT_WORKSPACE_DIR } from '@clawwork/shared';
import type { GatewayAuth, LanguageCode, TeamHubRegistryConfig } from '@clawwork/shared';

export interface GatewayServerConfig {
  id: string;
  name: string;
  url: string;
  token?: string;
  password?: string;
  pairingCode?: string;
  authMode?: 'token' | 'password' | 'pairingCode';
  isDefault?: boolean;
  color?: string;
}

export interface VoiceInputConfig {
  introSeen?: boolean;
}

export interface QuickLaunchConfig {
  enabled: boolean;
  shortcut: string;
}

export interface NotificationConfig {
  taskComplete?: boolean;
  approvalRequest?: boolean;
  gatewayDisconnect?: boolean;
}

export interface AppConfig {
  workspacePath: string;
  theme?: 'dark' | 'light' | 'auto';
  density?: 'compact' | 'comfortable' | 'spacious';
  language?: LanguageCode;
  gateways: GatewayServerConfig[];
  defaultGatewayId?: string;
  sendShortcut?: 'enter' | 'cmdEnter';
  gatewayUrl?: string;
  bootstrapToken?: string;
  password?: string;
  tlsFingerprint?: string;
  voiceInput?: VoiceInputConfig;
  quickLaunch?: QuickLaunchConfig;
  trayEnabled?: boolean;
  notifications?: NotificationConfig;
  leftNavShortcut?: 'Comma' | 'BracketLeft';
  rightPanelShortcut?: 'Period' | 'BracketRight';
  deviceId?: string;
  zoomLevel?: number;
  devMode?: boolean;
  teamHubRegistries?: TeamHubRegistryConfig[];
  updateChannel?: 'stable' | 'beta';
}

function configFilePath(): string {
  return join(app.getPath('userData'), CONFIG_FILE_NAME);
}

export function getDefaultWorkspacePath(): string {
  return join(homedir(), DEFAULT_WORKSPACE_DIR);
}

const ENCRYPTED_PREFIX = 'enc:';

function encryptField(value: string | undefined): string | undefined {
  if (!value) return value;
  if (value.startsWith(ENCRYPTED_PREFIX)) return value;
  if (!safeStorage.isEncryptionAvailable()) return value;
  try {
    return ENCRYPTED_PREFIX + safeStorage.encryptString(value).toString('base64');
  } catch (e) {
    console.error('safeStorage: encrypt failed, storing plaintext', e);
    return value;
  }
}

function decryptField(value: string | undefined): string | undefined {
  if (!value) return value;
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value;
  if (!safeStorage.isEncryptionAvailable()) {
    console.error('safeStorage: decryption not available, credential lost');
    return undefined;
  }
  try {
    const buf = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), 'base64');
    return safeStorage.decryptString(buf);
  } catch (e) {
    console.error('safeStorage: decrypt failed, credential lost', e);
    return undefined;
  }
}

function encryptGatewayCredentials(config: AppConfig): AppConfig {
  const clone = structuredClone(config);
  for (const gw of clone.gateways) {
    gw.token = encryptField(gw.token);
    gw.password = encryptField(gw.password);
    gw.pairingCode = encryptField(gw.pairingCode);
  }
  clone.bootstrapToken = encryptField(clone.bootstrapToken);
  clone.password = encryptField(clone.password);
  return clone;
}

function decryptGatewayCredentials(config: AppConfig): AppConfig {
  const clone = structuredClone(config);
  for (const gw of clone.gateways) {
    gw.token = decryptField(gw.token);
    gw.password = decryptField(gw.password);
    gw.pairingCode = decryptField(gw.pairingCode);
  }
  clone.bootstrapToken = decryptField(clone.bootstrapToken);
  clone.password = decryptField(clone.password);
  return clone;
}

function migrateConfigIfNeeded(config: AppConfig): AppConfig {
  if (config.gatewayUrl && (!config.gateways || config.gateways.length === 0)) {
    const id = randomUUID();
    const token = process.env.OPENCLAW_GATEWAY_TOKEN;
    const pairingCode = config.bootstrapToken;
    const migrated: AppConfig = {
      workspacePath: config.workspacePath,
      theme: config.theme,
      language: config.language,
      voiceInput: config.voiceInput,
      gateways: [
        {
          id,
          name: 'Default Gateway',
          url: config.gatewayUrl,
          token,
          pairingCode,
          password: config.password,
          authMode: token ? 'token' : config.password ? 'password' : pairingCode ? 'pairingCode' : 'token',
          isDefault: true,
        },
      ],
      defaultGatewayId: id,
    };
    writeConfig(migrated);
    return migrated;
  }
  if (!config.gateways) {
    config.gateways = [];
  }
  return config;
}

export function readConfig(): AppConfig | null {
  const cfgPath = configFilePath();
  if (!existsSync(cfgPath)) return null;
  let raw: string;
  try {
    raw = readFileSync(cfgPath, 'utf-8');
  } catch (err) {
    console.error('[config] failed to read:', err);
    return null;
  }
  let config: AppConfig;
  try {
    config = JSON.parse(raw) as AppConfig;
  } catch (err) {
    console.error('[config] failed to read:', err);
    const corruptedPath = `${cfgPath}.corrupted-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    try {
      renameSync(cfgPath, corruptedPath);
    } catch (backupErr) {
      console.error('[config] failed to back up corrupted config:', backupErr);
    }
    return null;
  }
  try {
    const migrated = migrateConfigIfNeeded(config);
    return decryptGatewayCredentials(migrated);
  } catch (err) {
    console.error('[config] failed to process:', err);
    return null;
  }
}

export function writeConfig(config: AppConfig): void {
  const cfgPath = configFilePath();
  const tmpPath = cfgPath + '.tmp';
  const encrypted = encryptGatewayCredentials(config);
  let fd: number | null = null;
  try {
    fd = openSync(tmpPath, 'w', 0o600);
    writeFileSync(fd, JSON.stringify(encrypted, null, 2), { encoding: 'utf-8' });
    fsyncSync(fd);
    try {
      closeSync(fd);
    } finally {
      fd = null;
    }
    renameSync(tmpPath, cfgPath);
    try {
      const dirFd = openSync(dirname(cfgPath), 'r');
      try {
        fsyncSync(dirFd);
      } finally {
        closeSync(dirFd);
      }
    } catch (syncErr) {
      console.error('[config] failed to sync config directory:', syncErr);
    }
  } catch (err) {
    if (fd !== null) {
      try {
        closeSync(fd);
      } catch (closeErr) {
        console.error('[config] failed to close temp config:', closeErr);
      }
    }
    try {
      if (existsSync(tmpPath)) unlinkSync(tmpPath);
    } catch (cleanupErr) {
      console.error('[config] failed to remove temp config:', cleanupErr);
    }
    throw err;
  }
}

export function updateConfig(partial: Partial<AppConfig>): AppConfig {
  const current = readConfig() ?? { workspacePath: getDefaultWorkspacePath(), gateways: [] };
  const merged = { ...current, ...partial };
  writeConfig(merged);
  return merged;
}

export function getWorkspacePath(): string | null {
  return readConfig()?.workspacePath ?? null;
}

export function isWorkspaceConfigured(): boolean {
  return getWorkspacePath() !== null;
}

/** Build GatewayAuth from a persisted GatewayServerConfig */
export function buildGatewayAuth(gw: GatewayServerConfig): GatewayAuth {
  if (gw.authMode === 'token') return { token: gw.token ?? '' };
  if (gw.authMode === 'password') return { password: gw.password ?? '' };
  if (gw.authMode === 'pairingCode') return { bootstrapToken: gw.pairingCode ?? '' };
  if (gw.token) return { token: gw.token };
  if (gw.password) return { password: gw.password };
  if (gw.pairingCode) return { bootstrapToken: gw.pairingCode };
  const envToken = process.env.OPENCLAW_GATEWAY_TOKEN;
  if (envToken) return { token: envToken };
  return { token: '' };
}

export function ensureDeviceId(): string {
  const existing = readConfig()?.deviceId;
  if (existing) return existing;
  const deviceId = randomUUID();
  updateConfig({ deviceId });
  return deviceId;
}

export function clearGatewayPairingCode(gatewayId: string): void {
  const config = readConfig();
  if (!config) return;
  const gateway = config.gateways.find((item) => item.id === gatewayId);
  if (!gateway?.pairingCode) return;
  gateway.pairingCode = undefined;
  writeConfig(config);
}
