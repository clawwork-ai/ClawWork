type ToolFamily = 'read' | 'write' | 'exec' | 'think' | 'web' | 'default';

const FAMILY_PATTERNS: [ToolFamily, RegExp][] = [
  ['read', /read|search|grep|glob|find|list|get|cat|head|tail|ls/i],
  ['write', /write|edit|create|delete|remove|replace|rename|mv|cp|mkdir/i],
  ['exec', /bash|exec|run|shell|command|terminal|npm|pnpm|pip|make/i],
  ['think', /think|reason|plan|analyze|reflect/i],
  ['web', /web|fetch|http|url|browse|download|curl/i],
];

function getToolFamily(toolName: string): ToolFamily {
  for (const [family, pattern] of FAMILY_PATTERNS) {
    if (pattern.test(toolName)) return family;
  }
  return 'default';
}

export function getToolColor(toolName: string): string {
  return `var(--tool-${getToolFamily(toolName)})`;
}
