import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG_FILE_NAME, DEFAULT_WORKSPACE_DIR } from '@clawwork/shared';

const electronMock = vi.hoisted(() => {
  const state = { userData: '' };
  return {
    state,
    getPath: vi.fn((name: string) => {
      if (name === 'userData') return state.userData;
      throw new Error(`unexpected app path: ${name}`);
    }),
    isEncryptionAvailable: vi.fn(() => false),
    encryptString: vi.fn((value: string) => Buffer.from(value)),
    decryptString: vi.fn((value: Buffer) => value.toString('utf8')),
  };
});

vi.mock('electron', () => ({
  app: {
    getPath: electronMock.getPath,
  },
  safeStorage: {
    isEncryptionAvailable: electronMock.isEncryptionAvailable,
    encryptString: electronMock.encryptString,
    decryptString: electronMock.decryptString,
  },
}));

import { AppConfig, ensureDeviceId, readConfig, writeConfig } from '../src/main/workspace/config.js';

describe('workspace config', () => {
  let userDataDir: string;

  beforeEach(() => {
    userDataDir = mkdtempSync(join(tmpdir(), 'clawwork-config-'));
    electronMock.state.userData = userDataDir;
  });

  afterEach(() => {
    rmSync(userDataDir, { recursive: true, force: true });
  });

  it('persists deviceId on first call when no config exists', () => {
    const first = ensureDeviceId();
    const second = ensureDeviceId();
    const persisted = readConfig();
    const raw = JSON.parse(readFileSync(join(userDataDir, CONFIG_FILE_NAME), 'utf8'));

    expect(second).toBe(first);
    expect(persisted?.deviceId).toBe(first);
    expect(raw.deviceId).toBe(first);
    expect(raw.workspacePath).toBe(join(homedir(), DEFAULT_WORKSPACE_DIR));
    expect(raw.gateways).toEqual([]);
  });

  it('writes config atomically without leaving a temp file', () => {
    const configPath = join(userDataDir, CONFIG_FILE_NAME);
    const config: AppConfig = {
      workspacePath: '/workspace/atomic',
      gateways: [{ id: 'gw-1', name: 'Local', url: 'ws://127.0.0.1:18789' }],
    };

    writeConfig(config);

    expect(existsSync(configPath)).toBe(true);
    expect(existsSync(`${configPath}.tmp`)).toBe(false);
    expect(readConfig()).toEqual(config);
    expect(() => JSON.parse(readFileSync(configPath, 'utf8'))).not.toThrow();
  });

  it('replaces config atomically across successive writes', () => {
    const configPath = join(userDataDir, CONFIG_FILE_NAME);
    const first: AppConfig = { workspacePath: '/first', gateways: [] };
    const second: AppConfig = {
      workspacePath: '/second',
      gateways: [{ id: 'gw-1', name: 'Local', url: 'ws://127.0.0.1:18789' }],
    };

    writeConfig(first);
    expect(readConfig()).toEqual(first);

    writeConfig(second);
    expect(existsSync(`${configPath}.tmp`)).toBe(false);
    expect(readConfig()).toEqual(second);
    expect(() => JSON.parse(readFileSync(configPath, 'utf8'))).not.toThrow();
  });
});
