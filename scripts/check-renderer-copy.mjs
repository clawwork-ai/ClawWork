import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const violations = [];

const SCAN_PATHS = [
  'packages/desktop/src/renderer/components/semantic',
  'packages/desktop/src/renderer/components/data-display',
  'packages/desktop/src/renderer/context',
  'packages/desktop/src/renderer/components/ErrorBoundary.tsx',
  'packages/desktop/src/renderer/components/ChatInput.tsx',
  'packages/desktop/src/renderer/components/FileCard.tsx',
  'packages/desktop/src/renderer/components/ConnectionBanner.tsx',
  'packages/desktop/src/renderer/components/ContextMenu.tsx',
  'packages/desktop/src/renderer/components/ToolCallCard.tsx',
  'packages/desktop/src/renderer/components/ToolsCatalog.tsx',
  'packages/desktop/src/renderer/components/MentionPicker.tsx',
  'packages/desktop/src/renderer/components/SlashCommandMenu.tsx',
  'packages/desktop/src/renderer/components/SlashArgPicker.tsx',
  'packages/desktop/src/renderer/components/FilePreview.tsx',
  'packages/desktop/src/renderer/components/FilePreviewModal.tsx',
  'packages/desktop/src/renderer/components/ImageLightbox.tsx',
  'packages/desktop/src/renderer/layouts/LeftNav',
  'packages/desktop/src/renderer/layouts/FileBrowser',
  'packages/desktop/src/renderer/layouts/CronPanel/index.tsx',
  'packages/desktop/src/renderer/layouts/Setup/index.tsx',
  'packages/desktop/src/renderer/layouts/RightPanel/index.tsx',
  'packages/desktop/src/renderer/layouts/Settings',
  'packages/desktop/src/renderer/layouts/MainArea/index.tsx',
  'packages/desktop/src/renderer/layouts/CronPanel/CronRunHistory.tsx',
  'packages/desktop/src/renderer/quick-launch.html',
];

const LINE_PATTERNS = [
  />\s*([A-Za-z][^<{]{1,})\s*</g,
  /aria-label="([A-Za-z][^"]+)"/g,
  /title="([A-Za-z][^"]+)"/g,
  /toast\.(?:success|error)\(\s*'([^']*[A-Za-z][^']*)'/g,
  /toast\.(?:success|error)\(\s*"([^"]*[A-Za-z][^"]*)"/g,
];

const IGNORE_MATCHES = [
  'ClawWork',
  'GitHub',
  'Markdown',
  'OpenClaw',
  'Esc',
  'Tab',
  'close',
  'select',
  'navigate',
  'ws://',
  'wss://',
  'Alt+Space',
  'CommandOrControl',
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

function expandPaths() {
  const files = [];
  for (const relativePath of SCAN_PATHS) {
    const absolutePath = path.join(root, relativePath);
    const isDirectory = !path.extname(absolutePath);
    if (isDirectory) {
      files.push(...walk(relativePath).filter((filePath) => /\.(ts|tsx|html)$/.test(filePath)));
      continue;
    }
    files.push(relativePath);
  }
  return files;
}

function getLineAndColumn(content, index) {
  const before = content.slice(0, index);
  const lines = before.split('\n');
  return { line: lines.length, column: lines.at(-1)?.length ?? 0 };
}

for (const filePath of expandPaths()) {
  const content = readFileSync(path.join(root, filePath), 'utf8');
  const lines = content.split('\n');

  lines.forEach((lineContent, lineIndex) => {
    for (const pattern of LINE_PATTERNS) {
      for (const match of lineContent.matchAll(pattern)) {
        const text = (match[1] ?? '').trim();
        if (!text || IGNORE_MATCHES.some((token) => text.includes(token))) {
          continue;
        }
        violations.push({ filePath, line: lineIndex + 1, column: (match.index ?? 0) + 1, text });
      }
    }
  });
}

if (violations.length > 0) {
  console.error('Renderer copy contract violations found:\n');
  for (const violation of violations) {
    console.error(`- ${violation.filePath}:${violation.line}:${violation.column}`);
    console.error(`  ${violation.text}`);
  }
  process.exit(1);
}

console.log('Renderer copy contract passed.');
