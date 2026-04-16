import { _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { GATEWAY_ID, GATEWAY_WS_URL, GATEWAY_TOKEN } from './constants';

const CONFIG_FILE_NAME = 'clawwork-config.json';
const DESKTOP_PKG = path.resolve(__dirname, '../../packages/desktop');
const APP_ENTRY = path.join(DESKTOP_PKG, 'out/main/index.js');

function resolveElectronBinary(): string {
  const electronMain = require.resolve('electron', { paths: [DESKTOP_PKG] });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electronBin = require(electronMain) as unknown as string;
  return electronBin;
}

interface LaunchResult {
  app: ElectronApplication;
  page: Page;
  cleanup: () => void;
  userDataDir: string;
  workspaceDir: string;
}

function dumpDiagnostics(electronBin: string): void {
  console.log('[e2e-diag] APP_ENTRY:', APP_ENTRY, 'exists:', fs.existsSync(APP_ENTRY));
  console.log('[e2e-diag] electron binary:', electronBin, 'exists:', fs.existsSync(electronBin));
  console.log('[e2e-diag] platform:', process.platform, 'arch:', process.arch);
  console.log('[e2e-diag] CI:', process.env.CI ?? 'false');
  console.log('[e2e-diag] DISPLAY:', process.env.DISPLAY ?? 'unset');

  const outDir = path.join(DESKTOP_PKG, 'out');
  if (fs.existsSync(outDir)) {
    const files = fs.readdirSync(outDir, { recursive: true }) as string[];
    console.log('[e2e-diag] out/ files:', files.slice(0, 20).join(', '));
  } else {
    console.log('[e2e-diag] out/ directory DOES NOT EXIST');
  }
}

export async function launchApp(options?: {
  gateway?: boolean;
  userDataDir?: string;
  workspaceDir?: string;
}): Promise<LaunchResult> {
  const electronBin = resolveElectronBinary();
  dumpDiagnostics(electronBin);

  const userDataDir = options?.userDataDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-e2e-userdata-'));
  const workspaceDir = options?.workspaceDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'clawwork-e2e-ws-'));

  const config: Record<string, unknown> = {
    workspacePath: workspaceDir,
    trayEnabled: false,
    quickLaunch: {
      enabled: false,
      shortcut: 'Alt+Space',
    },
    gateways: options?.gateway
      ? [
          {
            id: GATEWAY_ID,
            name: 'E2E Test Gateway',
            url: GATEWAY_WS_URL,
            token: GATEWAY_TOKEN,
            isDefault: true,
          },
        ]
      : [],
    defaultGatewayId: options?.gateway ? GATEWAY_ID : undefined,
  };

  fs.writeFileSync(path.join(userDataDir, CONFIG_FILE_NAME), JSON.stringify(config, null, 2));

  const launchArgs = [APP_ENTRY, `--user-data-dir=${userDataDir}`];
  if (process.env.CI) {
    launchArgs.push('--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage');
  }

  console.log('[e2e-diag] launch args:', launchArgs);

  let app: ElectronApplication;
  try {
    app = await electron.launch({
      executablePath: electronBin,
      args: launchArgs,
      env: { ...process.env, NODE_ENV: 'test', ELECTRON_DISABLE_SANDBOX: '1' },
    });
  } catch (err) {
    console.error('[e2e-diag] electron.launch() FAILED:', err);
    throw err;
  }

  console.log('[e2e-diag] electron launched, pid:', app.process().pid);

  app.process().stderr?.on('data', (chunk: Buffer) => {
    console.log('[electron-stderr]', chunk.toString().trimEnd());
  });

  const page = await app.firstWindow();
  console.log('[e2e-diag] first window obtained, url:', page.url());

  const cleanup = (): void => {
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // best-effort
    }
    try {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    } catch {
      // best-effort
    }
  };

  return { app, page, cleanup, userDataDir, workspaceDir };
}
