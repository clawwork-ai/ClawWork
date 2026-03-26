import { type DBSchema, type IDBPDatabase, openDB } from 'idb';

interface DeviceIdentityRecord {
  id: string;
  publicKeyBase64: string;
  privateKeyBase64: string;
}

interface GatewayConfigRecord {
  id: string;
  name: string;
  url: string;
  token?: string;
  password?: string;
  pairingCode?: string;
  authMode?: 'token' | 'password' | 'pairingCode';
  deviceToken?: string;
  isDefault?: boolean;
}

export interface StoredTask {
  id: string;
  sessionKey: string;
  sessionId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  artifactDir: string;
  gatewayId: string;
  model?: string;
  modelProvider?: string;
  thinkingLevel?: string;
  inputTokens?: number;
  outputTokens?: number;
  contextTokens?: number;
}

export interface StoredMessage {
  id: string;
  taskId: string;
  role: string;
  content: string;
  timestamp: string;
  imageAttachments?: unknown[];
  toolCalls?: unknown[];
}

interface ClawWorkDBSchema extends DBSchema {
  identity: {
    key: string;
    value: DeviceIdentityRecord;
  };
  gateways: {
    key: string;
    value: GatewayConfigRecord;
  };
  tasks: {
    key: string;
    value: StoredTask;
    indexes: {
      'by-gateway': string;
      'by-updated': string;
    };
  };
  messages: {
    key: string;
    value: StoredMessage;
    indexes: {
      'by-task': string;
      'by-task-timestamp': [string, string];
    };
  };
  preferences: {
    key: string;
    value: { key: string; value: unknown };
  };
}

let dbPromise: Promise<IDBPDatabase<ClawWorkDBSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<ClawWorkDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ClawWorkDBSchema>('clawwork-pwa', 1, {
      upgrade(db) {
        db.createObjectStore('identity', { keyPath: 'id' });
        db.createObjectStore('gateways', { keyPath: 'id' });

        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-gateway', 'gatewayId');
        taskStore.createIndex('by-updated', 'updatedAt');

        const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
        messageStore.createIndex('by-task', 'taskId');
        messageStore.createIndex('by-task-timestamp', ['taskId', 'timestamp']);

        db.createObjectStore('preferences', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export async function getIdentity(): Promise<DeviceIdentityRecord | undefined> {
  const db = await getDb();
  const all = await db.getAll('identity', undefined, 1);
  return all[0];
}

export async function saveIdentity(record: DeviceIdentityRecord): Promise<void> {
  const db = await getDb();
  await db.put('identity', record);
}

export async function listGateways(): Promise<GatewayConfigRecord[]> {
  const db = await getDb();
  return db.getAll('gateways');
}

export async function saveGateway(record: GatewayConfigRecord): Promise<void> {
  const db = await getDb();
  await db.put('gateways', record);
}

export async function updateGatewayToken(gatewayId: string, token: string): Promise<void> {
  const db = await getDb();
  const gw = await db.get('gateways', gatewayId);
  if (!gw) return;
  gw.deviceToken = token;
  await db.put('gateways', gw);
}

export async function listTasks(): Promise<StoredTask[]> {
  const db = await getDb();
  return db.getAll('tasks');
}

export async function saveTask(task: StoredTask): Promise<void> {
  const db = await getDb();
  await db.put('tasks', task);
}

export async function updateTask(id: string, updates: Partial<Omit<StoredTask, 'id'>>): Promise<void> {
  const db = await getDb();
  const existing = await db.get('tasks', id);
  if (!existing) return;
  await db.put('tasks', { ...existing, ...updates });
}

export async function deleteTaskAndMessages(taskId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['tasks', 'messages'], 'readwrite');
  await tx.objectStore('tasks').delete(taskId);

  const msgIndex = tx.objectStore('messages').index('by-task');
  let cursor = await msgIndex.openCursor(taskId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

export async function listMessages(taskId: string): Promise<StoredMessage[]> {
  const db = await getDb();
  return db.getAllFromIndex('messages', 'by-task-timestamp', IDBKeyRange.bound([taskId, ''], [taskId, '\uffff']));
}

export async function saveMessage(msg: StoredMessage): Promise<void> {
  const db = await getDb();
  await db.put('messages', msg);
}

const SCOPE_ID_KEY = 'scopeDeviceId';

export async function getScopeId(): Promise<string | undefined> {
  const db = await getDb();
  const record = await db.get('preferences', SCOPE_ID_KEY);
  return typeof record?.value === 'string' ? record.value : undefined;
}

export async function saveScopeId(id: string): Promise<void> {
  const db = await getDb();
  await db.put('preferences', { key: SCOPE_ID_KEY, value: id });
}

export async function isPaired(): Promise<boolean> {
  const db = await getDb();
  const [gatewayCount, identityCount] = await Promise.all([db.count('gateways'), db.count('identity')]);
  return gatewayCount > 0 && identityCount > 0;
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['identity', 'gateways', 'tasks', 'messages', 'preferences'], 'readwrite');
  await tx.objectStore('identity').clear();
  await tx.objectStore('gateways').clear();
  await tx.objectStore('tasks').clear();
  await tx.objectStore('messages').clear();
  await tx.objectStore('preferences').clear();
  await tx.done;
}
