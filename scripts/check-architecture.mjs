import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const violations = [];

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

function addViolation(filePath, content, index, message, match) {
  const { line, column } = getLineAndColumn(content, index);
  violations.push({ filePath, line, column, message, match });
}

function scanFile(filePath, regex, message) {
  const absolutePath = path.join(root, filePath);
  const content = readFileSync(absolutePath, 'utf8');
  const matches = content.matchAll(regex);

  for (const match of matches) {
    addViolation(filePath, content, match.index, message, match[0]);
  }
}

const sessionKeySourceFiles = [
  ...walk('packages/shared/src').filter((filePath) => filePath.endsWith('.ts')),
  ...walk('packages/desktop/src').filter((filePath) => /\.(ts|tsx)$/.test(filePath)),
].filter((filePath) => filePath !== 'packages/shared/src/constants.ts');

for (const filePath of sessionKeySourceFiles) {
  scanFile(
    filePath,
    /clawwork:task:/g,
    'Do not construct raw session keys outside buildSessionKey() in @clawwork/shared.',
  );
}

if (violations.length > 0) {
  console.error('Architecture guardrail violations found:\n');
  for (const violation of violations) {
    console.error(`- ${violation.filePath}:${violation.line}:${violation.column} ${violation.message}`);
    console.error(`  ${violation.match}`);
  }
  process.exit(1);
}

console.log('Architecture guardrails passed.');
