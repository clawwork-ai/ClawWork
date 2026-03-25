import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ALLOWLIST_CATEGORIES, uiContractAllowlist } from './ui-contract-allowlist.mjs';

const root = process.cwd();
const violations = [];

const EXCLUDED_FILES = new Set([
  'packages/desktop/src/renderer/styles/theme.css',
  'packages/desktop/src/renderer/styles/design-tokens.ts',
]);

const RULES = [
  {
    category: 'raw-color',
    regex: /#[0-9a-fA-F]{3,8}\b|rgba?\s*\(|hsla?\s*\(/g,
    message: 'Use theme.css semantic tokens instead of raw color values.',
  },
  {
    category: 'tailwind-palette-color',
    regex:
      /\b(?:bg|text|border|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{2,3}|\/\d+)?\b/g,
    message: 'Use semantic token classes instead of Tailwind palette colors.',
  },
  {
    category: 'default-shadow',
    regex: /\bshadow-(?:sm|md|lg|xl|2xl)\b/g,
    message: 'Use semantic shadow tokens instead of Tailwind default shadows.',
  },
  {
    category: 'arbitrary-font-size',
    regex: /\btext-\[(?:\d+(?:\.\d+)?(?:px|rem|em)|\d+%)\]\b/g,
    message: 'Use the shared typography scale instead of arbitrary font sizes.',
  },
  {
    category: 'raw-motion-duration',
    regex: /transition=\{\{[^}]*duration:\s*(?:0?\.\d+|\d+)|transition:\s*\{[^}]*duration:\s*(?:0?\.\d+|\d+)/g,
    message: 'Use motion tokens or presets instead of literal transition durations.',
  },
  {
    category: 'raw-motion-ease',
    regex: /ease:\s*\[[^\]]+\]|ease:\s*['"][^'"]+['"]/g,
    message: 'Use motion tokens or presets instead of literal easing values.',
  },
  {
    category: 'hardcoded-content-width',
    regex: /\bmax-w-3xl\b/g,
    message: 'Use --content-max-width for content area max width.',
  },
  {
    category: 'layout-escape',
    regex:
      /(?:^|[\s'"`])(?:gap|gap-x|gap-y|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-\[[^\]]+\]|(?:^|[\s'"`])(?:w|min-w|max-w|h|min-h|max-h)-\[[^\]]+\]|grid-cols-\[[^\]]+\]|grid-rows-\[[^\]]+\]/gm,
    message: 'Use shared layout scales; arbitrary layout escapes must be explicitly allowlisted.',
  },
];

function walk(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  const entries = readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const nextRelativePath = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(nextRelativePath));
      continue;
    }
    files.push(nextRelativePath);
  }

  return files;
}

function getLineAndColumn(content, index) {
  const before = content.slice(0, index);
  const lines = before.split('\n');
  return { line: lines.length, column: lines.at(-1).length + 1 };
}

function isAllowed(filePath, matchText, category) {
  if (category === 'layout-escape' && /var\(--(?:density|content)-/.test(matchText)) {
    return true;
  }

  for (const entry of uiContractAllowlist) {
    if (entry.file !== filePath) continue;
    if (!ALLOWLIST_CATEGORIES.has(entry.category)) {
      throw new Error(`Invalid UI contract allowlist category: ${entry.category}`);
    }
    if (category !== 'layout-escape') continue;
    if (entry.pattern.test(matchText)) {
      entry.pattern.lastIndex = 0;
      return true;
    }
    entry.pattern.lastIndex = 0;
  }
  return false;
}

function addViolation(filePath, content, index, category, message, match) {
  const { line, column } = getLineAndColumn(content, index);
  violations.push({ filePath, line, column, category, message, match: match.trim() || match });
}

const rendererFiles = walk('packages/desktop/src/renderer').filter(
  (filePath) => /\.(ts|tsx|css)$/.test(filePath) && !EXCLUDED_FILES.has(filePath),
);

const COMPONENT_USAGE_RULES = [
  {
    file: 'packages/desktop/src/renderer/layouts/Settings/sections/GeneralSection.tsx',
    requiredPattern: /\bSettingGroup\b/,
    category: 'component-usage',
    message: 'Settings sections must use SettingGroup instead of hand-rolled shell containers.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/Settings/sections/AboutSection.tsx',
    requiredPattern: /\bSettingGroup\b/,
    category: 'component-usage',
    message: 'Settings sections must use SettingGroup instead of hand-rolled shell containers.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/Settings/sections/SystemSection.tsx',
    requiredPattern: /\bSettingGroup\b/,
    category: 'component-usage',
    message: 'Settings sections must use SettingGroup instead of hand-rolled shell containers.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/MainArea/index.tsx',
    requiredPattern: /\bDataTable\b/,
    category: 'component-usage',
    message: 'Structured archived task rows must use DataTable.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/CronPanel/CronRunHistory.tsx',
    requiredPattern: /\bDataTable\b/,
    category: 'component-usage',
    message: 'Structured run history rows must use DataTable.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/Settings/sections/GatewaysSection.tsx',
    requiredPattern: /\b(?:SettingGroup|ToolbarButton|EmptyState)\b/,
    category: 'component-usage',
    message: 'Gateway settings must use semantic settings shells and actions.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/Settings/sections/AgentsSection.tsx',
    requiredPattern: /\b(?:SettingGroup|ToolbarButton|EmptyState)\b/,
    category: 'component-usage',
    message: 'Agent settings must use semantic settings shells and actions.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/FileBrowser/index.tsx',
    requiredPattern: /\b(?:ListItem|SectionCard|ToolbarButton|EmptyState)\b/,
    category: 'component-usage',
    message: 'File browser must use semantic file browsing shells and list primitives.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/LeftNav/index.tsx',
    requiredPattern: /\b(?:ToolbarButton|EmptyState)\b/,
    category: 'component-usage',
    message: 'Left nav must use semantic navigation actions and empty states.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/CronPanel/index.tsx',
    requiredPattern: /\b(?:ToolbarButton|EmptyState|InlineNotice)\b/,
    category: 'component-usage',
    message: 'Cron panel must use semantic toolbar actions and panel notices.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/Setup/index.tsx',
    requiredPattern: /\b(?:SectionCard|ToolbarButton|InlineNotice)\b/,
    category: 'component-usage',
    message: 'Setup flow must use semantic setup shells, actions, and notices.',
  },
  {
    file: 'packages/desktop/src/renderer/layouts/RightPanel/index.tsx',
    requiredPattern: /\b(?:PanelHeader|ListItem|EmptyState)\b/,
    category: 'component-usage',
    message: 'Right panel must use semantic panel header, list items, and empty states.',
  },
  {
    file: 'packages/desktop/src/renderer/components/ToolsCatalog.tsx',
    requiredPattern: /\b(?:ToolbarButton|ListItem|SectionCard)\b/,
    category: 'component-usage',
    message: 'Tools catalog must use semantic toolbar and list/display primitives.',
  },
  {
    file: 'packages/desktop/src/renderer/components/ContextMenu.tsx',
    requiredPattern: /\bListItem\b/,
    category: 'component-usage',
    message: 'Context menus must render semantic list items instead of hand-built rows.',
  },
  {
    file: 'packages/desktop/src/renderer/components/ConnectionBanner.tsx',
    requiredPattern: /\bInlineNotice\b/,
    category: 'component-usage',
    message: 'Connection banners must use semantic inline notices.',
  },
];

for (const filePath of rendererFiles) {
  const absolutePath = path.join(root, filePath);
  const content = readFileSync(absolutePath, 'utf8');

  for (const rule of RULES) {
    const matches = content.matchAll(rule.regex);
    for (const match of matches) {
      const matchText = match[0].trimStart();
      if (isAllowed(filePath, matchText, rule.category)) {
        continue;
      }
      addViolation(filePath, content, match.index, rule.category, rule.message, matchText);
    }
  }

  if (content.includes('<table') && /grid-cols-\[[^\]]+\]/.test(content)) {
    const match = /grid-cols-\[[^\]]+\]/.exec(content);
    if (match) {
      addViolation(
        filePath,
        content,
        match.index,
        'mixed-table-layout',
        'Do not mix native table markup with arbitrary grid column templates in the same file.',
        match[0],
      );
    }
  }

  for (const rule of COMPONENT_USAGE_RULES) {
    if (rule.file !== filePath) continue;
    if (!rule.requiredPattern.test(content)) {
      addViolation(filePath, content, 0, rule.category, rule.message, rule.requiredPattern.source);
    }
  }
}

if (violations.length > 0) {
  console.error('UI contract violations found:\n');
  for (const violation of violations) {
    console.error(
      `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.category}] ${violation.message}`,
    );
    console.error(`  ${violation.match}`);
  }
  process.exit(1);
}

console.log('UI contract passed.');
