#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { argv, stderr, stdout, exit } from 'node:process';

const PREFIX_META = {
  '[Feat]': { emoji: '✨', name: 'Features', order: 1 },
  '[UI]': { emoji: '🎨', name: 'UI / UX', order: 2 },
  '[Fix]': { emoji: '🐛', name: 'Bug Fixes', order: 3 },
  '[Refactor]': { emoji: '♻️', name: 'Refactor', order: 4 },
  '[Build]': { emoji: '🔧', name: 'Build / CI', order: 5 },
  '[Docs]': { emoji: '📚', name: 'Docs', order: 6 },
  '[Chore]': { emoji: '🧹', name: 'Chore', order: 7 },
};

const CONVENTIONAL_MAP = {
  feat: '[Feat]',
  fix: '[Fix]',
  ui: '[UI]',
  style: '[UI]',
  docs: '[Docs]',
  refactor: '[Refactor]',
  perf: '[Refactor]',
  test: '[Refactor]',
  build: '[Build]',
  ci: '[Build]',
  chore: '[Chore]',
};

const PREFIX_ALIASES = {
  '[Bug]': '[Fix]',
  '[Bugfix]': '[Fix]',
  '[Hotfix]': '[Fix]',
  '[Cleanup]': '[Refactor]',
  '[Test]': '[Refactor]',
  '[Tests]': '[Refactor]',
  '[Perf]': '[Refactor]',
  '[CI]': '[Build]',
  '[Ops]': '[Build]',
  '[I18n]': '[Chore]',
  '[Style]': '[UI]',
};

function sh(cmd, { allowFail = false } = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    if (allowFail) return '';
    stderr.write(`command failed: ${cmd}\n${err.stderr ?? err.message}\n`);
    throw err;
  }
}

function parseArgs() {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    stdout.write(
      [
        'Usage: node scripts/generate-release-notes.mjs [RANGE]',
        '',
        'RANGE forms:',
        '  v0.0.14                previous tag..v0.0.14',
        '  v0.0.13..v0.0.14       explicit range',
        '  (no arg)               previous tag..HEAD',
        '',
        'Output: markdown to stdout. Log to stderr.',
        '',
      ].join('\n'),
    );
    exit(0);
  }

  const arg = args[0];
  let base;
  let head;
  if (!arg) {
    head = 'HEAD';
    base = sh('git describe --tags --abbrev=0 HEAD^', { allowFail: true });
  } else if (arg.includes('..')) {
    [base, head] = arg.split('..');
  } else {
    head = arg;
    base = sh(`git describe --tags --abbrev=0 ${head}^`, { allowFail: true });
  }
  if (!base || !head) {
    stderr.write('error: could not resolve base..head range\n');
    exit(1);
  }
  return { base, head };
}

function getPrCandidates(base, head) {
  const log = sh(`git log ${base}..${head} --format=%H%x09%s --no-merges`);
  const byNum = new Map();
  const needsLookup = [];
  for (const line of log.split('\n')) {
    if (!line) continue;
    const tab = line.indexOf('\t');
    const sha = line.slice(0, tab);
    const subject = line.slice(tab + 1);
    const m = subject.match(/^(.+?)\s*\(#(\d+)\)\s*$/);
    if (m) {
      const num = Number(m[2]);
      if (!byNum.has(num)) byNum.set(num, { number: num, sha, subjectTitle: m[1] });
    } else {
      needsLookup.push({ sha, subjectTitle: subject });
    }
  }

  if (needsLookup.length > 0) {
    stderr.write(`resolving ${needsLookup.length} commit(s) without PR suffix...\n`);
    let i = 0;
    for (const c of needsLookup) {
      i += 1;
      stderr.write(`  [${i}/${needsLookup.length}] commit->PR ${c.sha.slice(0, 8)}\r`);
      const out = sh(
        `gh api repos/:owner/:repo/commits/${c.sha}/pulls --jq '[.[] | select(.merged_at != null)] | .[0].number // empty'`,
        { allowFail: true },
      );
      const num = Number(out);
      if (Number.isFinite(num) && num > 0) {
        if (!byNum.has(num)) byNum.set(num, { number: num, sha: c.sha, subjectTitle: c.subjectTitle });
      } else {
        const synthetic = -Math.abs([...c.sha].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0));
        byNum.set(synthetic, {
          number: synthetic,
          sha: c.sha,
          subjectTitle: c.subjectTitle,
          orphan: true,
        });
      }
    }
    stderr.write('\n');
  }

  return [...byNum.values()].sort((a, b) => a.number - b.number);
}

function fetchPr(num) {
  const raw = sh(`gh pr view ${num} --json number,title,body,author,mergedAt`);
  return JSON.parse(raw);
}

function classify(title) {
  for (const [prefix, meta] of Object.entries(PREFIX_META)) {
    if (title.startsWith(prefix)) {
      return { prefix, strippedTitle: title.slice(prefix.length).trim(), ...meta };
    }
  }
  for (const [alias, canonical] of Object.entries(PREFIX_ALIASES)) {
    if (title.toLowerCase().startsWith(alias.toLowerCase())) {
      const stripped = title.slice(alias.length).trim();
      return { prefix: canonical, strippedTitle: stripped, ...PREFIX_META[canonical] };
    }
  }
  const m = title.match(/^(\w+)(\([^)]+\))?!?:\s*(.+)$/);
  if (m) {
    const type = m[1].toLowerCase();
    const mapped = CONVENTIONAL_MAP[type];
    if (mapped) {
      return { prefix: mapped, strippedTitle: m[3], ...PREFIX_META[mapped] };
    }
  }
  return { prefix: null, strippedTitle: title, emoji: '📦', name: 'Other', order: 99 };
}

function extractReleaseNote(body) {
  if (!body) return null;
  const m = body.match(/```release-note\s*([\s\S]*?)```/);
  if (!m) return null;
  const text = m[1].trim();
  if (!text || text.toUpperCase() === 'NONE') return null;
  return text;
}

function findNewContributors(prs) {
  const firstByAuthor = new Map();
  for (const pr of prs) {
    const login = pr.author?.login;
    if (!login) continue;
    const prev = firstByAuthor.get(login);
    if (!prev || pr.number < prev.number) firstByAuthor.set(login, pr);
  }

  const result = [];
  for (const [login, firstPr] of firstByAuthor) {
    const out = sh(
      `gh pr list --state merged --author ${JSON.stringify(login)} --search "sort:created-asc" --limit 1 --json number`,
      { allowFail: true },
    );
    let earliest = null;
    try {
      const arr = JSON.parse(out || '[]');
      if (arr.length > 0) earliest = arr[0].number;
    } catch {
      earliest = null;
    }
    if (earliest === firstPr.number) {
      result.push({ login, firstPr });
    }
  }
  return result.sort((a, b) => a.firstPr.number - b.firstPr.number);
}

function render({ base, head, groups, newContributors, repo }) {
  const lines = [];
  const sorted = [...groups.values()].sort((a, b) => a.order - b.order);
  for (const group of sorted) {
    if (group.items.length === 0) continue;
    lines.push(`## ${group.emoji} ${group.name}`);
    lines.push('');
    for (const item of group.items) {
      const text = item.text.replace(/\s+/g, ' ').trim();
      if (item.orphan) {
        lines.push(`- ${text} by ${item.author} (${item.sha.slice(0, 7)})`);
      } else {
        lines.push(`- ${text} by @${item.author} in #${item.number}`);
      }
    }
    lines.push('');
  }
  if (newContributors.length > 0) {
    lines.push('## 👋 New Contributors');
    lines.push('');
    for (const nc of newContributors) {
      lines.push(`- @${nc.login} made their first contribution in #${nc.firstPr.number}`);
    }
    lines.push('');
  }
  lines.push(`**Full Changelog**: https://github.com/${repo}/compare/${base}...${head}`);
  return lines.join('\n') + '\n';
}

function main() {
  const { base, head } = parseArgs();
  stderr.write(`range: ${base}..${head}\n`);

  const candidates = getPrCandidates(base, head);
  stderr.write(`found ${candidates.length} PR references\n`);

  const groups = new Map();
  for (const [prefix, meta] of Object.entries(PREFIX_META)) {
    groups.set(prefix, { ...meta, items: [] });
  }
  groups.set('__other__', { emoji: '📦', name: 'Other', order: 99, items: [] });

  const prs = [];
  const unresolved = [];
  let done = 0;
  for (const candidate of candidates) {
    done += 1;
    if (candidate.orphan) {
      stderr.write(`  [${done}/${candidates.length}] orphan ${candidate.sha.slice(0, 8)}\n`);
      const { prefix, strippedTitle } = classify(candidate.subjectTitle);
      const commitAuthor = sh(`git log -1 --format=%aN ${candidate.sha}`, { allowFail: true });
      const bucket = prefix ? groups.get(prefix) : groups.get('__other__');
      bucket.items.push({
        text: strippedTitle,
        author: commitAuthor || 'unknown',
        sha: candidate.sha,
        orphan: true,
      });
      continue;
    }
    stderr.write(`  [${done}/${candidates.length}] fetching #${candidate.number}\r`);
    try {
      const pr = fetchPr(candidate.number);
      prs.push(pr);
      const { prefix, strippedTitle } = classify(pr.title);
      const note = extractReleaseNote(pr.body);
      const text = note ?? strippedTitle;
      const bucket = prefix ? groups.get(prefix) : groups.get('__other__');
      bucket.items.push({
        text,
        author: pr.author?.login ?? 'unknown',
        number: pr.number,
      });
    } catch {
      stderr.write(`\n  unresolved #${candidate.number} — using commit subject\n`);
      const { prefix, strippedTitle } = classify(candidate.subjectTitle);
      const commitAuthor = sh(`git log -1 --format=%aN ${candidate.sha}`, { allowFail: true });
      const bucket = prefix ? groups.get(prefix) : groups.get('__other__');
      bucket.items.push({
        text: strippedTitle,
        author: commitAuthor || 'unknown',
        number: candidate.number,
        unresolved: true,
      });
      unresolved.push(candidate.number);
    }
  }
  stderr.write('\n');

  const repo = sh('gh repo view --json nameWithOwner -q .nameWithOwner');
  stderr.write(`resolving first-time contributors...\n`);
  const newContributors = findNewContributors(prs);
  stderr.write(`  ${newContributors.length} new contributors\n`);

  if (unresolved.length > 0) {
    stderr.write(
      `warning: ${unresolved.length} PR(s) could not be resolved via gh API: ${unresolved
        .map((n) => `#${n}`)
        .join(', ')}\n`,
    );
  }

  stdout.write(render({ base, head, groups, newContributors, repo }));
}

main();
