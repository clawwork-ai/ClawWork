import { mkdtempSync, readFileSync, rmSync } from 'fs';
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

import { ensureDeviceId, readConfig } from '../src/main/workspace/config.js';

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
});
