export const GATEWAY_WS_PORT = 18789;

export const SESSION_KEY_PREFIX = 'agent:main:clawwork:task:';
const CLAWWORK_DEVICE_SESSION_RE = /^agent:([^:]+):clawwork:([^:]+):task:(.+)$/;
const CLAWWORK_SESSION_RE = /^agent:([^:]+):clawwork:task:(.+)$/;
const LEGACY_SESSION_KEY_RE = /^agent:[^:]+:task-(.+)$/;
const SUBAGENT_SESSION_RE = /^agent:([^:]+):subagent:([a-f0-9-]+)$/;

export function buildSessionKey(taskId: string, agentId: string = 'main', deviceId?: string): string {
  if (deviceId) return `agent:${agentId}:clawwork:${deviceId}:task:${taskId}`;
  return `agent:${agentId}:clawwork:task:${taskId}`;
}

export function parseTaskIdFromSessionKey(sessionKey: string): string | null {
  const dm = sessionKey.match(CLAWWORK_DEVICE_SESSION_RE);
  if (dm) return dm[3] || null;

  const m = sessionKey.match(CLAWWORK_SESSION_RE);
  if (m) return m[2] || null;

  const legacyMatch = sessionKey.match(LEGACY_SESSION_KEY_RE);
  return legacyMatch ? legacyMatch[1] : null;
}

export function parseAgentIdFromSessionKey(sessionKey: string): string {
  const dm = sessionKey.match(CLAWWORK_DEVICE_SESSION_RE);
  if (dm) return dm[1];
  const m = sessionKey.match(CLAWWORK_SESSION_RE);
  if (m) return m[1];
  const sub = sessionKey.match(SUBAGENT_SESSION_RE);
  if (sub) return sub[1];
  return 'main';
}

export function isSubagentSession(sessionKey: string): boolean {
  return SUBAGENT_SESSION_RE.test(sessionKey);
}

export function mergeGatewayStreamText(previous: string, incoming: string): string {
  if (!incoming) return previous;
  if (incoming === previous) return previous;
  if (incoming.startsWith(previous)) return incoming;
  if (previous.startsWith(incoming)) return previous;
  return previous + incoming;
}

export function isClawWorkSession(sessionKey: string, deviceId?: string): boolean {
  if (deviceId) {
    const dm = sessionKey.match(CLAWWORK_DEVICE_SESSION_RE);
    return dm !== null && dm[2] === deviceId;
  }
  return CLAWWORK_DEVICE_SESSION_RE.test(sessionKey) || CLAWWORK_SESSION_RE.test(sessionKey);
}

const SYSTEM_SESSION_RE = /^clawwork:system:[^:]+:[a-f0-9-]+$/;

export function buildSystemSessionKey(purpose: string): string {
  return `clawwork:system:${purpose}:${crypto.randomUUID()}`;
}

export function isSystemSession(sessionKey: string): boolean {
  return SYSTEM_SESSION_RE.test(sessionKey);
}

export const HEARTBEAT_INTERVAL_MS = 30_000;

export const RECONNECT_DELAY_MS = 3_000;

export const MAX_RECONNECT_ATTEMPTS = 10;

export const SUPPORTED_LANGUAGE_CODES = ['en', 'zh', 'zh-TW', 'ja', 'ko', 'pt', 'de', 'es'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const DEFAULT_WORKSPACE_DIR = 'ClawWork-Workspace';

export const CONFIG_FILE_NAME = 'clawwork-config.json';

export const DB_FILE_NAME = '.clawwork.db';

export function buildConductorPrompt(agentCatalog: string): string {
  return [
    'You are a task coordinator (Conductor). Your responsibilities:',
    "1. Analyze the user's task and determine if multi-agent collaboration is needed",
    '2. Select appropriate agents (Performers) from the available list using sessions_spawn(runtime:"subagent")',
    '3. Dispatch tasks to Performers using sessions_send',
    '4. You do not solve problems directly — you split, dispatch, and summarize',
    '5. When all Performers complete, summarize results for the user',
    '',
    'Hard rules:',
    '- For delegated work, you MUST use OpenClaw native subagent sessions via sessions_spawn/runtime:"subagent".',
    '- Do NOT use coding-agent skills, exec, process, bash background jobs, or any other worker orchestration path.',
    '- Do NOT implement the task yourself when delegation is possible.',
    '- If delegation fails, report the blocker instead of switching to another execution method.',
    '- Use only the agent ids listed below.',
    '- Child completion is push-based. Do NOT poll sessions_list, sessions_history, or exec sleep for status.',
    '',
    'Dispatch modes:',
    '- Serial: sessions_send(sessionKey, message, timeoutSeconds:30) — blocks until reply',
    '- Parallel: sessions_send(sessionKey, message, timeoutSeconds:0) — fire-and-forget, result pushed back when done',
    'Use serial when the next step depends on this result. Use parallel when multiple steps are independent.',
    '',
    'Performer sessions are reusable. You can send multiple messages to the same session for iterative work.',
    '',
    'Available agents:',
    agentCatalog,
  ].join('\n');
}

export interface MentionParseResult {
  targets: string[];
  cleanContent: string;
  isAll: boolean;
}

const MENTION_ALL_RE = /(?:^|\s)@all(?=\s|$)/;
const MENTION_RE = /@([\w-]+)/g;

export function parseMentions(content: string, knownAgentIds: Set<string>): MentionParseResult {
  if (MENTION_ALL_RE.test(content)) {
    return {
      targets: [...knownAgentIds],
      cleanContent: content
        .replace(MENTION_RE, '')
        .replace(/\s{2,}/g, ' ')
        .trim(),
      isAll: true,
    };
  }

  const targets: string[] = [];
  let match;
  const re = new RegExp(MENTION_RE.source, MENTION_RE.flags);
  while ((match = re.exec(content))) {
    const agentId = match[1];
    if (knownAgentIds.has(agentId) && !targets.includes(agentId)) {
      targets.push(agentId);
    }
  }

  if (!targets.length) return { targets: [], cleanContent: content, isAll: false };

  const cleanContent = content
    .replace(MENTION_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { targets, cleanContent, isAll: false };
}

export const RETRYABLE_ERROR_CODES = new Set([
  'RATE_LIMIT',
  'RATE_LIMITED',
  'TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'MODEL_UNAVAILABLE',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'OVERLOADED',
]);

export const NON_RETRYABLE_ERROR_CODES = new Set([
  'AUTH_INVALID',
  'AUTH_FAILED',
  'GATEWAY_AUTH_FAILED',
  'QUOTA_EXHAUSTED',
  'CONTENT_POLICY',
  'CONTENT_FILTERED',
  'CONTEXT_LENGTH_EXCEEDED',
  'INVALID_REQUEST',
  'SESSION_NOT_FOUND',
  'AGENT_NOT_FOUND',
  'PERMISSION_DENIED',
  'METHOD_NOT_SUPPORTED',
]);
