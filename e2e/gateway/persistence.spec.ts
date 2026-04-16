import { test, expect } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { randomUUID } from 'crypto';
import { launchApp } from '../helpers/electron-app';
import { setupPairedApp, waitForGatewayConnected, type PairedApp } from '../helpers/pairing-flow';
import { GATEWAY_ID, buildSessionKey } from '../helpers/constants';
import { messagesForTask, countByRole, readAllMessages } from '../helpers/db-query';

type PersistTaskInput = Parameters<typeof window.clawwork.persistTask>[0];
type PersistMessageInput = Parameters<typeof window.clawwork.persistMessage>[0];

function newTaskInput(): PersistTaskInput {
  const id = randomUUID();
  const now = new Date().toISOString();
  return {
    id,
    sessionKey: buildSessionKey(id),
    sessionId: '',
    title: `e2e-${id.slice(0, 8)}`,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    tags: [],
    artifactDir: '',
    gatewayId: '',
  };
}

function newUserMessage(taskId: string, content: string): PersistMessageInput {
  return {
    id: randomUUID(),
    taskId,
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
    sessionKey: buildSessionKey(taskId),
  };
}

let paired: PairedApp;
let app: ElectronApplication;
let page: Page;

test.describe('Layer 3: DB-asserting business paths', () => {
  test.beforeAll(async () => {
    paired = await setupPairedApp();
    app = paired.app;
    page = paired.page;
  });

  test.afterAll(async () => {
    if (app) await app.close().catch(() => {});
    paired?.cleanup?.();
  });

  test('B1: user message persists exactly once', async () => {
    const task = newTaskInput();
    const taskRes = await page.evaluate((t) => window.clawwork.persistTask(t), task);
    expect(taskRes.ok).toBe(true);

    const sendRes = await page.evaluate(([gwId, sk]) => window.clawwork.sendMessage(gwId, sk, 'B1: gateway send'), [
      GATEWAY_ID,
      task.sessionKey,
    ] as const);
    expect(sendRes.ok).toBe(true);

    const persistRes = await page.evaluate(
      (msg) => window.clawwork.persistMessage(msg),
      newUserMessage(task.id, 'B1: gateway send'),
    );
    expect(persistRes.ok).toBe(true);

    const rows = messagesForTask(paired.workspaceDir, task.id);
    expect(countByRole(rows, 'user')).toBe(1);
    expect(rows[0]?.content).toBe('B1: gateway send');
  });

  test('B2: assistant message never duplicated (regression gate for finalizeStream dual-write)', async () => {
    const task = newTaskInput();
    await page.evaluate((t) => window.clawwork.persistTask(t), task);

    const sendRes = await page.evaluate(([gwId, sk]) => window.clawwork.sendMessage(gwId, sk, 'B2: trigger response'), [
      GATEWAY_ID,
      task.sessionKey,
    ] as const);
    expect(sendRes.ok).toBe(true);

    await page.waitForTimeout(3_000);

    const rows = messagesForTask(paired.workspaceDir, task.id);
    const assistantCount = countByRole(rows, 'assistant');
    expect(assistantCount).toBeLessThanOrEqual(1);
  });

  test('B3: gateway-routed messages do not leak across tasks', async () => {
    const t1 = newTaskInput();
    const t2 = newTaskInput();
    await page.evaluate((t) => window.clawwork.persistTask(t), t1);
    await page.evaluate((t) => window.clawwork.persistTask(t), t2);

    const send1 = await page.evaluate(([gwId, sk]) => window.clawwork.sendMessage(gwId, sk, 'B3: only-in-T1'), [
      GATEWAY_ID,
      t1.sessionKey,
    ] as const);
    expect(send1.ok).toBe(true);
    await page.evaluate((msg) => window.clawwork.persistMessage(msg), newUserMessage(t1.id, 'B3: only-in-T1'));

    const send2 = await page.evaluate(([gwId, sk]) => window.clawwork.sendMessage(gwId, sk, 'B3: only-in-T2'), [
      GATEWAY_ID,
      t2.sessionKey,
    ] as const);
    expect(send2.ok).toBe(true);
    await page.evaluate((msg) => window.clawwork.persistMessage(msg), newUserMessage(t2.id, 'B3: only-in-T2'));

    await page.waitForTimeout(2_000);

    const all = readAllMessages(paired.workspaceDir);
    const inT1 = all.filter((m) => m.task_id === t1.id);
    const inT2 = all.filter((m) => m.task_id === t2.id);

    expect(inT1.some((m) => m.content === 'B3: only-in-T1')).toBe(true);
    expect(inT1.some((m) => m.content === 'B3: only-in-T2')).toBe(false);
    expect(inT2.some((m) => m.content === 'B3: only-in-T2')).toBe(true);
    expect(inT2.some((m) => m.content === 'B3: only-in-T1')).toBe(false);
  });
});

test.describe('Layer 3: reload persistence with attachments (#424)', () => {
  let local: PairedApp;
  let localApp: ElectronApplication;
  let localPage: Page;

  test.beforeAll(async () => {
    local = await setupPairedApp();
    localApp = local.app;
    localPage = local.page;
  });

  test.afterAll(async () => {
    if (localApp) await localApp.close().catch(() => {});
    local?.cleanup?.();
  });

  test('B4: message + inbox attachment survive app restart', async () => {
    const task = newTaskInput();
    const fileName = 'b4-test.txt';
    const originalContent = 'hello from B4 reload test';
    const base64 = Buffer.from(originalContent, 'utf8').toString('base64');

    await localPage.evaluate((t) => window.clawwork.persistTask(t), task);

    const saveRes = await localPage.evaluate(
      ([taskId, fn, b64]) => window.clawwork.saveInboxAttachment({ taskId, fileName: fn, base64: b64 }),
      [task.id, fileName, base64] as const,
    );
    expect(saveRes.ok).toBe(true);
    const localPath = saveRes.result?.localPath;
    expect(localPath).toBeTruthy();

    const msg: PersistMessageInput = {
      ...newUserMessage(task.id, 'B4: msg with attachment'),
      attachments: [{ localPath, fileName, mimeType: 'text/plain', size: originalContent.length }],
    };
    const persistRes = await localPage.evaluate((m) => window.clawwork.persistMessage(m), msg);
    expect(persistRes.ok).toBe(true);

    await localApp.close();

    ({ app: localApp, page: localPage } = await launchApp({
      gateway: true,
      userDataDir: local.userDataDir,
      workspaceDir: local.workspaceDir,
    }));
    await waitForGatewayConnected(localPage);

    const loaded = await localPage.evaluate((taskId) => window.clawwork.loadMessages(taskId), task.id);
    expect(loaded.ok).toBe(true);
    const reloaded = (loaded.rows ?? []).find((m) => m.id === msg.id);
    expect(reloaded?.content).toBe('B4: msg with attachment');
    const attachments = reloaded?.attachments as Array<{ localPath: string }> | undefined;
    expect(attachments?.[0]?.localPath).toBe(localPath);

    const readRes = await localPage.evaluate((lp) => window.clawwork.readInboxFile(lp), localPath as string);
    expect(readRes.ok).toBe(true);
    const decoded = Buffer.from(readRes.result?.content ?? '', 'base64').toString('utf8');
    expect(decoded).toBe(originalContent);
  });
});
