import type { CommandArg, CommandCategory, CommandEntry, CommandSource } from '@clawwork/shared';

export type SlashPickerType = 'model' | 'choices' | 'free';

export interface SlashCommandView {
  name: string;
  nativeName?: string;
  description: string;
  aliases: string[];
  category: CommandCategory;
  source: CommandSource;
  acceptsArgs: boolean;
  args: CommandArg[];
  pickerType: SlashPickerType;
  argHint?: string;
}

const CATEGORY_ORDER: CommandCategory[] = ['session', 'options', 'management', 'tools', 'media', 'docks', 'status'];

export const CATEGORY_I18N_KEYS: Record<CommandCategory, string> = {
  session: 'slashDashboard.categorySession',
  options: 'slashDashboard.categoryOptions',
  status: 'slashDashboard.categoryStatus',
  management: 'slashDashboard.categoryManagement',
  media: 'slashDashboard.categoryMedia',
  tools: 'slashDashboard.categoryTools',
  docks: 'slashDashboard.categoryDocks',
};

export const SOURCE_I18N_KEYS: Record<CommandSource, string> = {
  native: 'slashDashboard.sourceNative',
  skill: 'slashDashboard.sourceSkill',
  plugin: 'slashDashboard.sourcePlugin',
};

const MODEL_PICKER_COMMAND = 'model';

function detectPickerType(entry: CommandEntry): SlashPickerType {
  if (!entry.acceptsArgs) return 'free';
  const first = entry.args?.[0];
  if (!first) return 'free';
  if (first.dynamic) {
    const key = entry.nativeName ?? entry.name;
    if (key === MODEL_PICKER_COMMAND) return 'model';
    return 'free';
  }
  if (first.choices && first.choices.length > 0) return 'choices';
  return 'free';
}

function buildArgHint(entry: CommandEntry, picker: SlashPickerType): string | undefined {
  if (!entry.acceptsArgs) return undefined;
  const first = entry.args?.[0];
  if (!first) return undefined;
  if (picker === 'choices' && first.choices) {
    return first.choices.map((c) => c.value).join('|');
  }
  return `<${first.name}>`;
}

function commandEntryToView(entry: CommandEntry): SlashCommandView {
  const picker = detectPickerType(entry);
  const aliases = Array.from(new Set([entry.name, ...(entry.textAliases ?? [])]));
  return {
    name: entry.name,
    nativeName: entry.nativeName,
    description: entry.description,
    aliases,
    category: entry.category ?? 'status',
    source: entry.source,
    acceptsArgs: entry.acceptsArgs,
    args: entry.args ?? [],
    pickerType: picker,
    argHint: buildArgHint(entry, picker),
  };
}

function enumArg(name: string, description: string, values: string[], dynamic = false): CommandArg {
  return {
    name,
    description,
    type: 'string',
    choices: values.map((v) => ({ value: v, label: v })),
    dynamic,
  };
}

function dynamicArg(name: string, description: string): CommandArg {
  return { name, description, type: 'string', dynamic: true };
}

const NATIVE_OVERLAY: CommandEntry[] = [
  {
    name: 'new',
    description: 'Reset the session',
    source: 'native',
    scope: 'text',
    category: 'session',
    acceptsArgs: false,
  },
  {
    name: 'reset',
    description: 'Reset the session',
    source: 'native',
    scope: 'text',
    category: 'session',
    acceptsArgs: false,
  },
  {
    name: 'abort',
    description: 'Abort the active run',
    source: 'native',
    scope: 'text',
    category: 'session',
    acceptsArgs: false,
  },
  {
    name: 'agent',
    description: 'Switch agent (or open picker)',
    source: 'native',
    scope: 'text',
    category: 'session',
    acceptsArgs: true,
    args: [dynamicArg('id', 'Agent id')],
  },
  {
    name: 'agents',
    description: 'Open agent picker',
    source: 'native',
    scope: 'text',
    category: 'session',
    acceptsArgs: false,
  },
  {
    name: 'session',
    description: 'Switch session (or open picker)',
    source: 'native',
    scope: 'text',
    category: 'session',
    acceptsArgs: true,
    args: [dynamicArg('key', 'Session key')],
  },
  {
    name: 'sessions',
    description: 'Open session picker',
    source: 'native',
    scope: 'text',
    category: 'session',
    acceptsArgs: false,
  },
  {
    name: 'model',
    description: 'Set model (or open picker)',
    source: 'native',
    scope: 'text',
    category: 'options',
    acceptsArgs: true,
    args: [dynamicArg('model', 'Model id')],
  },
  {
    name: 'models',
    description: 'Open model picker',
    source: 'native',
    scope: 'text',
    category: 'options',
    acceptsArgs: false,
  },
  {
    name: 'think',
    description: 'Set thinking level',
    source: 'native',
    scope: 'text',
    category: 'options',
    acceptsArgs: true,
    args: [enumArg('level', 'Thinking level', ['off', 'minimal', 'low', 'medium', 'high', 'adaptive'])],
  },
  {
    name: 'fast',
    description: 'Set fast mode',
    source: 'native',
    scope: 'text',
    category: 'options',
    acceptsArgs: true,
    args: [enumArg('mode', 'Fast mode', ['status', 'on', 'off'])],
  },
  {
    name: 'verbose',
    description: 'Set verbose on/off',
    source: 'native',
    scope: 'text',
    category: 'options',
    acceptsArgs: true,
    args: [enumArg('state', 'Verbose state', ['on', 'off'])],
  },
  {
    name: 'reasoning',
    description: 'Set reasoning on/off',
    source: 'native',
    scope: 'text',
    category: 'options',
    acceptsArgs: true,
    args: [enumArg('state', 'Reasoning state', ['on', 'off', 'stream'])],
  },
  {
    name: 'usage',
    description: 'Toggle per-response usage line',
    source: 'native',
    scope: 'text',
    category: 'options',
    acceptsArgs: true,
    args: [enumArg('mode', 'Usage mode', ['off', 'tokens', 'full', 'cost'])],
  },
  {
    name: 'elevated',
    description: 'Set elevated permission level',
    textAliases: ['elev'],
    source: 'native',
    scope: 'text',
    category: 'management',
    acceptsArgs: true,
    args: [enumArg('level', 'Elevated level', ['on', 'off', 'ask', 'full'])],
  },
  {
    name: 'activation',
    description: 'Set group activation mode',
    source: 'native',
    scope: 'text',
    category: 'management',
    acceptsArgs: true,
    args: [enumArg('mode', 'Activation mode', ['mention', 'always'])],
  },
  {
    name: 'help',
    description: 'Show slash command help',
    source: 'native',
    scope: 'text',
    category: 'status',
    acceptsArgs: false,
  },
  {
    name: 'status',
    description: 'Show gateway status summary',
    source: 'native',
    scope: 'text',
    category: 'status',
    acceptsArgs: false,
  },
  {
    name: 'settings',
    description: 'Open settings',
    source: 'native',
    scope: 'text',
    category: 'management',
    acceptsArgs: false,
  },
];

const OVERLAY_BY_NAME = new Map<string, CommandEntry>();
for (const overlay of NATIVE_OVERLAY) {
  OVERLAY_BY_NAME.set(overlay.name, overlay);
  if (overlay.nativeName) OVERLAY_BY_NAME.set(overlay.nativeName, overlay);
  for (const alias of overlay.textAliases ?? []) OVERLAY_BY_NAME.set(alias, overlay);
}

function mergeWithOverlay(entry: CommandEntry): CommandEntry {
  if (entry.source !== 'native') return entry;
  const overlay = OVERLAY_BY_NAME.get(entry.nativeName ?? entry.name);
  if (!overlay) return entry;
  const gwFirst = entry.args?.[0];
  const ovFirst = overlay.args?.[0];
  if (!gwFirst || !ovFirst) return entry;
  const gwHasChoices = (gwFirst.choices?.length ?? 0) > 0;
  const ovHasChoices = (ovFirst.choices?.length ?? 0) > 0;
  if (gwHasChoices || !ovHasChoices) return entry;
  return {
    ...entry,
    args: [{ ...gwFirst, choices: ovFirst.choices }, ...(entry.args ?? []).slice(1)],
  };
}

export function getCommandsForGateway(catalog: CommandEntry[] | undefined): SlashCommandView[] {
  if (!catalog || catalog.length === 0) return NATIVE_OVERLAY.map(commandEntryToView);
  return catalog.map(mergeWithOverlay).map(commandEntryToView);
}

export function groupCommandsByCategory(
  commands: SlashCommandView[],
): { category: CommandCategory; commands: SlashCommandView[] }[] {
  const groups = new Map<CommandCategory, SlashCommandView[]>();
  for (const cmd of commands) {
    const arr = groups.get(cmd.category);
    if (arr) arr.push(cmd);
    else groups.set(cmd.category, [cmd]);
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((c) => ({
    category: c,
    commands: groups.get(c)!,
  }));
}

export function filterSlashCommands(query: string, commands: SlashCommandView[]): SlashCommandView[] {
  const q = query.toLowerCase();
  if (!q) return commands;
  return commands.filter((cmd) => cmd.aliases.some((a) => a.toLowerCase().startsWith(q)));
}

export function parseSlashQuery(
  value: string,
  selectionStart: number,
): { active: false } | { active: true; query: string } {
  const before = value.slice(0, selectionStart);
  if (before.includes('\n')) return { active: false };
  if (!before.startsWith('/')) return { active: false };
  const afterSlash = before.slice(1);
  if (afterSlash.includes(' ')) return { active: false };
  return { active: true, query: afterSlash };
}

export function hasArgPicker(cmd: SlashCommandView): boolean {
  return cmd.pickerType !== 'free';
}

export function getChoiceOptions(cmd: SlashCommandView): { value: string; label: string }[] | null {
  if (cmd.pickerType !== 'choices') return null;
  const first = cmd.args[0];
  if (!first?.choices) return null;
  return first.choices;
}
