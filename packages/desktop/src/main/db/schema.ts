import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  sessionKey: text('session_key').notNull(),
  sessionId: text('session_id').notNull().default(''),
  title: text('title').notNull().default(''),
  status: text('status').notNull().default('active'),
  ensemble: integer('ensemble', { mode: 'boolean' }).notNull().default(false),
  model: text('model'),
  modelProvider: text('model_provider'),
  thinkingLevel: text('thinking_level'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  contextTokens: integer('context_tokens'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  tags: text('tags').notNull().default('[]'),
  artifactDir: text('artifact_dir').notNull().default(''),
  gatewayId: text('gateway_id').notNull().default(''),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  timestamp: text('timestamp').notNull(),
  sessionKey: text('session_key'),
  agentId: text('agent_id'),
  runId: text('run_id'),
  imageAttachments: text('image_attachments'),
  toolCalls: text('tool_calls'),
});

export const taskRooms = sqliteTable('task_rooms', {
  taskId: text('task_id')
    .primaryKey()
    .references(() => tasks.id),
  status: text('status').notNull().default('active'),
  conductorReady: integer('conductor_ready', { mode: 'boolean' }).notNull().default(false),
});

export const taskRoomSessions = sqliteTable('task_room_sessions', {
  sessionKey: text('session_key').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  agentId: text('agent_id').notNull(),
  agentName: text('agent_name').notNull().default(''),
  emoji: text('emoji'),
  verifiedAt: text('verified_at').notNull(),
});

export const artifacts = sqliteTable('artifacts', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  messageId: text('message_id')
    .notNull()
    .references(() => messages.id),
  type: text('type').notNull().default('file'),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  localPath: text('local_path').notNull(),
  mimeType: text('mime_type').notNull().default(''),
  size: integer('size').notNull().default(0),
  contentText: text('content_text').notNull().default(''),
  createdAt: text('created_at').notNull(),
});
