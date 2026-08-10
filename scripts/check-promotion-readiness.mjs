#!/usr/bin/env node
/**
 * Validates in-repo pre-launch promotion checklist items from #11.
 * Manual steps (demo GIF recording, GitHub topics, platform posts) are reported as warnings.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`Missing file: ${relativePath}`);
    return null;
  }
  return readFileSync(absolutePath, 'utf8');
}

const REQUIRED_PROMOTION_FILES = [
  'docs/promotion/README.md',
  'docs/promotion/hacker-news.md',
  'docs/promotion/v2ex.md',
  'docs/promotion/reddit-selfhosted.md',
  'docs/promotion/reddit-opensource.md',
  'docs/promotion/reddit-localllama.md',
  'docs/promotion/twitter-thread.md',
  'docs/promotion/jike.md',
  'docs/promotion/juejin-outline.md',
  'docs/promotion/zhihu-outline.md',
  'docs/promotion/sspai-outline.md',
  'docs/promotion/wechat-launch-article.md',
  'docs/promotion/openclaw-docs-pr.md',
  'docs/promotion/awesome-list-pr.md',
  'docs/promotion/homebrew-cask.md',
  'docs/promotion/demo-recording.md',
  'docs/promotion/github-topics.md',
  'docs/promotion/product-hunt.md',
  'docs/promotion/bilibili-script.md',
  'docs/promotion/youtube-script.md',
];

for (const file of REQUIRED_PROMOTION_FILES) {
  if (!existsSync(path.join(root, file))) {
    fail(`Missing promotion draft: ${file}`);
  }
}

const readme = read('README.md');
if (readme) {
  if (!/Feishu\s*\/\s*DingTalk\s*\/\s*Slack/.test(readme)) {
    fail('README.md missing channel comparison table (Feishu / DingTalk / Slack)');
  }
  if (!/## Demo/.test(readme)) {
    fail('README.md missing ## Demo section');
  }
  if (/docs\/demo\.gif/.test(readme) && !existsSync(path.join(root, 'docs/demo.gif'))) {
    warn('README references docs/demo.gif but file is not present yet (record per demo-recording.md)');
  }
}

const pkgRaw = read('package.json');
if (pkgRaw) {
  const pkg = JSON.parse(pkgRaw);
  if (!pkg.repository?.url) fail('package.json missing repository.url');
  if (!pkg.homepage) fail('package.json missing homepage');
  if (!pkg.license) fail('package.json missing license');
}

const changelog = read('CHANGELOG.md');
if (changelog && !/\[0\.1\.0\]/.test(changelog)) {
  fail('CHANGELOG.md missing [0.1.0] release section');
}

if (!existsSync(path.join(root, 'docs/demo.gif'))) {
  warn('docs/demo.gif not found — record 60-second demo before launch (see docs/promotion/demo-recording.md)');
}

if (!existsSync(path.join(root, 'docs/screenshot.png'))) {
  warn('docs/screenshot.png not found — update hero screenshot before launch');
}

if (warnings.length > 0) {
  console.warn('Promotion readiness warnings (manual launch steps):\n');
  for (const message of warnings) {
    console.warn(`  ⚠ ${message}`);
  }
  console.warn('');
}

if (errors.length > 0) {
  console.error('Promotion readiness check failed:\n');
  for (const message of errors) {
    console.error(`  ✗ ${message}`);
  }
  process.exit(1);
}

console.log('Promotion readiness check passed (in-repo items).');
if (warnings.length > 0) {
  console.log(`${warnings.length} manual step(s) still pending — see warnings above.`);
}
