import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const workflowPath = '.github/workflows/ci-bot.yml';
const content = readFileSync(path.join(root, workflowPath), 'utf8');
const violations = [];

function record(line, message, match = '') {
  violations.push({ line, message, match });
}

for (const [index, line] of content.split('\n').entries()) {
  const lineNo = index + 1;

  if (/MESSAGE:\s*\$\{\{\s*github\.event\.[^}]+\.body\s*\}\}/.test(line)) {
    record(lineNo, 'Untrusted issue/PR/comment bodies must not be interpolated into MESSAGE env vars.', line.trim());
  }

  if (/uses:\s*wzshiming\/gh-ci-bot@v/.test(line)) {
    record(lineNo, 'gh-ci-bot must be pinned to a commit SHA, not a mutable version tag.', line.trim());
  }

  if (/^\s*actions:\s*write\s*$/.test(line)) {
    record(lineNo, 'ci-bot must not request actions: write permission.', line.trim());
  }

  if (/^\s*contents:\s*write\s*$/.test(line)) {
    record(lineNo, 'ci-bot must not request contents: write permission.', line.trim());
  }
}

if (!/uses:\s*wzshiming\/gh-ci-bot@[0-9a-f]{40}/.test(content)) {
  record(0, 'Expected at least one gh-ci-bot action pinned to a 40-character commit SHA.');
}

if (!/name:\s*Load message body safely/.test(content)) {
  record(0, 'Expected a step that loads comment bodies via the GitHub API.');
}

if (violations.length > 0) {
  console.error('CI bot workflow security violations found:\n');
  for (const v of violations) {
    const prefix = v.line > 0 ? `${workflowPath}:${v.line}` : workflowPath;
    console.error(`  ${prefix}  ${v.message}`);
    if (v.match) console.error(`    ${v.match}`);
  }
  process.exit(1);
}

console.log('CI bot workflow security guardrails passed.');
