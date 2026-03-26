/**
 * Slash command definitions for ClawWork input autocomplete.
 *
 * Source: mirrors OpenClaw's native command surface.
 * Reference: ~/git/openclaw/src/tui/commands.ts (getSlashCommands)
 *            ~/git/openclaw/src/auto-reply/commands-registry.ts (NativeCommandSpec)
 *
 * PLACEHOLDER: In a future version, this list should be fetched dynamically from
 * the Gateway via a `commands.list` RPC (not yet exposed in the Gateway API).
 * When that RPC is available, extend `gateway-client.ts` with `listCommands()`,
 * add an IPC handler `ws:commands-list`, and replace the static list below with
 * a store that hydrates on gateway connect.
 */

export type SlashCommandCategory = 'session' | 'model' | 'access' | 'info';
export type SlashPickerType = 'enum' | 'model';

export interface SlashCommand {
  name: string;
  description: string;
  argHint?: string;
  category?: SlashCommandCategory;
  pickerType?: SlashPickerType;
}

/**
 * Static list of OpenClaw native slash commands supported in ClawWork sessions.
 * Derived from ~/git/openclaw/src/tui/commands.ts and the gateway NativeCommandSpec list.
 *
 * PLACEHOLDER: replace/extend with dynamic gateway commands when available.
 */
const STATIC_SLASH_COMMANDS: SlashCommand[] = [
  { name: 'new', description: 'Reset the session', argHint: undefined, category: 'session' },
  { name: 'reset', description: 'Reset the session', argHint: undefined, category: 'session' },
  { name: 'abort', description: 'Abort the active run', argHint: undefined, category: 'session' },
  { name: 'agent', description: 'Switch agent (or open picker)', argHint: '<id>', category: 'session' },
  { name: 'agents', description: 'Open agent picker', argHint: undefined, category: 'session' },
  { name: 'session', description: 'Switch session (or open picker)', argHint: '<key>', category: 'session' },
  { name: 'sessions', description: 'Open session picker', argHint: undefined, category: 'session' },

  {
    name: 'model',
    description: 'Set model (or open picker)',
    argHint: '<provider/model>',
    category: 'model',
    pickerType: 'model',
  },
  { name: 'models', description: 'Open model picker', argHint: undefined, category: 'model' },
  {
    name: 'think',
    description: 'Set thinking level',
    argHint: 'off|minimal|low|medium|high|adaptive',
    category: 'model',
  },
  { name: 'fast', description: 'Set fast mode', argHint: 'status|on|off', category: 'model' },
  { name: 'verbose', description: 'Set verbose on/off', argHint: 'on|off', category: 'model' },
  { name: 'reasoning', description: 'Set reasoning on/off', argHint: 'on|off|stream', category: 'model' },
  { name: 'usage', description: 'Toggle per-response usage line', argHint: 'off|tokens|full|cost', category: 'model' },

  { name: 'elevated', description: 'Set elevated permission level', argHint: 'on|off|ask|full', category: 'access' },
  { name: 'elev', description: 'Alias for /elevated', argHint: 'on|off|ask|full', category: 'access' },
  { name: 'activation', description: 'Set group activation mode', argHint: 'mention|always', category: 'access' },

  { name: 'help', description: 'Show slash command help', argHint: undefined, category: 'info' },
  { name: 'status', description: 'Show gateway status summary', argHint: undefined, category: 'info' },
  { name: 'settings', description: 'Open settings', argHint: undefined, category: 'info' },
];

const CATEGORY_ORDER: SlashCommandCategory[] = ['session', 'model', 'access', 'info'];

export const CATEGORY_I18N_KEYS: Record<SlashCommandCategory, string> = {
  session: 'slashDashboard.categorySession',
  model: 'slashDashboard.categoryModel',
  access: 'slashDashboard.categoryAccess',
  info: 'slashDashboard.categoryInfo',
};

export function groupCommandsByCategory(
  commands: SlashCommand[] = STATIC_SLASH_COMMANDS,
): { category: SlashCommandCategory; commands: SlashCommand[] }[] {
  const groups = new Map<SlashCommandCategory, SlashCommand[]>();
  for (const cmd of commands) {
    const cat = cmd.category ?? 'info';
    const arr = groups.get(cat);
    if (arr) arr.push(cmd);
    else groups.set(cat, [cmd]);
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((c) => ({
    category: c,
    commands: groups.get(c)!,
  }));
}

/**
 * Filter slash commands by the text the user has typed after the `/`.
 * Returns all commands when query is empty (bare "/" input).
 */
export function filterSlashCommands(query: string, commands: SlashCommand[] = STATIC_SLASH_COMMANDS): SlashCommand[] {
  const q = query.toLowerCase();
  if (!q) return commands;
  return commands.filter((cmd) => cmd.name.startsWith(q));
}

/**
 * Parse the textarea value to determine if slash-command autocomplete should show.
 *
 * Rules:
 * - The cursor must be on the *first* line.
 * - The line must start with `/`.
 * - There must be no whitespace-separated second token yet (i.e. we haven't
 *   entered the argument phase).
 *
 * Returns `{ active: true, query }` or `{ active: false }`.
 */
export function parseSlashQuery(
  value: string,
  selectionStart: number,
): { active: false } | { active: true; query: string } {
  // Only consider text up to cursor
  const before = value.slice(0, selectionStart);
  // Must be on the first line (no newlines before cursor)
  if (before.includes('\n')) return { active: false };
  if (!before.startsWith('/')) return { active: false };
  const afterSlash = before.slice(1);
  // If there's already a space in the command name, we're in arg territory
  if (afterSlash.includes(' ')) return { active: false };
  return { active: true, query: afterSlash };
}

export function getEnumOptions(cmd: SlashCommand): string[] | null {
  if (!cmd.argHint) return null;
  if (cmd.argHint.includes('<')) return null;
  if (!cmd.argHint.includes('|')) return null;
  return cmd.argHint
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function hasArgPicker(cmd: SlashCommand): boolean {
  return cmd.pickerType === 'model' || getEnumOptions(cmd) !== null;
}
