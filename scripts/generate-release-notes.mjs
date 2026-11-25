#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { argv, env, exit, stderr, stdout } from 'node:process';
import { pathToFileURL } from 'node:url';

export const CANONICAL_REPO = 'clawwork-ai/ClawWork';

export const STRICT_SEMVER_TAG_RE = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:alpha|beta|rc)\.[1-9]\d*))?$/;

export const STABLE_SEMVER_TAG_RE = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

const PREFIX_META = {
  '[Feat]': { emoji: '✨', name: 'Features', changelogSection: 'Added', order: 1 },
  '[UI]': { emoji: '🎨', name: 'UI / UX', changelogSection: 'Changed', order: 2 },
  '[Fix]': { emoji: '🐛', name: 'Bug Fixes', changelogSection: 'Fixed', order: 3 },
  '[Refactor]': { emoji: '♻️', name: 'Refactor', changelogSection: 'Changed', order: 4 },
  '[Build]': { emoji: '🔧', name: 'Build / CI', changelogSection: 'Changed', order: 5 },
  '[Docs]': { emoji: '📚', name: 'Docs', changelogSection: 'Changed', order: 6 },
  '[Chore]': { emoji: '🧹', name: 'Chore', changelogSection: 'Changed', order: 7 },
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

const CHANGELOG_SECTION_ORDER = ['Added', 'Changed', 'Fixed'];

function sh(cmd, { allowFail = false, exec = execSync } = {}) {
  try {
    return exec(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    if (allowFail) return '';
    stderr.write(`command failed: ${cmd}\n${err.stderr ?? err.message}\n`);
    throw err;
  }
}

export function isValidSemVerTag(ref) {
  return typeof ref === 'string' && STRICT_SEMVER_TAG_RE.test(ref);
}

export function isStableTag(ref) {
  return typeof ref === 'string' && STABLE_SEMVER_TAG_RE.test(ref);
}

export function normalizeRepoSlug(slug) {
  if (!slug) return CANONICAL_REPO;
  if (slug.toLowerCase() === CANONICAL_REPO.toLowerCase()) return CANONICAL_REPO;
  return slug;
}

export function previousTag(head, exec = execSync) {
  if (head !== 'HEAD' && !isValidSemVerTag(head)) {
    throw new Error(`Invalid SemVer release tag: ${head}`);
  }
  const stableTarget = head === 'HEAD' || isStableTag(head);
  const prereleaseFilter = stableTarget ? " --exclude 'v*-*'" : '';
  const resolved = sh(`git describe --tags --abbrev=0 --match 'v[0-9]*'${prereleaseFilter} ${head}^`, {
    allowFail: true,
    exec,
  });
  if (!resolved) return '';
  if (!isValidSemVerTag(resolved)) {
    throw new Error(`Resolved base tag is not valid SemVer: ${resolved}`);
  }
  return resolved;
}

export function extractChangelogSection(changelogText, tag) {
  if (!isValidSemVerTag(tag)) {
    throw new Error(`Invalid SemVer release tag: ${tag}`);
  }
  const version = tag.slice(1);
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lines = changelogText.split(/\r?\n/);
  const headingRe = new RegExp(`^##\\s+\\[${escaped}\\](?:\\s+-\\s+.*)?\\s*$`);
  let startIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (headingRe.test(lines[i])) {
      startIndex = i + 1;
      break;
    }
  }
  if (startIndex === -1) return null;

  const collected = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^##\s+\[/.test(line) || /^\[[^\]]+\]:\s+https?:\/\//.test(line)) {
      break;
    }
    collected.push(line);
  }
  const body = collected.join('\n').trim();
  return body || null;
}

function resolveRepoSlug(exec = execSync) {
  if (env.GITHUB_REPOSITORY) {
    return normalizeRepoSlug(env.GITHUB_REPOSITORY);
  }
  const remoteUrl = sh('git remote get-url origin', { allowFail: true, exec });
  const remoteMatch = remoteUrl.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/i);
  if (remoteMatch) {
    return normalizeRepoSlug(remoteMatch[1]);
  }
  const ghRepo = sh('gh repo view --json nameWithOwner -q .nameWithOwner', { allowFail: true, exec });
  return normalizeRepoSlug(ghRepo);
}

function parseArgs(args = argv.slice(2)) {
  if (args.includes('--help') || args.includes('-h')) {
    stdout.write(
      [
        'Usage: node scripts/generate-release-notes.mjs [OPTIONS] [RANGE]',
        '',
        'Options:',
        '  --format github|changelog   Output format (default: github)',
        '  --from-changelog <TAG>      Extract non-empty section from CHANGELOG.md',
        '  --has-changelog <TAG>       Exit 0 if CHANGELOG.md contains <TAG>, else 1',
        '  --changelog-file <PATH>     Override CHANGELOG.md path',
        '  --date <YYYY-MM-DD>         Release date for --format changelog',
        '  --base <REF>                Override base tag for compare footer',
        '',
        'RANGE forms:',
        '  v0.0.15                     previous stable tag..v0.0.15',
        '  v0.0.15-beta.4              previous tag..v0.0.15-beta.4',
        '  v0.0.13..v0.0.14            explicit range',
        '  (no arg)                    previous tag..HEAD',
        '',
      ].join('\n'),
    );
    exit(0);
  }

  const options = {
    format: 'github',
    fromChangelog: null,
    hasChangelog: null,
    changelogFile: resolve('CHANGELOG.md'),
    date: null,
    baseOverride: null,
    rangeArg: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--format') {
      options.format = args[i + 1] ?? '';
      i += 1;
    } else if (arg === '--from-changelog') {
      options.fromChangelog = args[i + 1] ?? '';
      i += 1;
    } else if (arg === '--has-changelog') {
      options.hasChangelog = args[i + 1] ?? '';
      i += 1;
    } else if (arg === '--changelog-file') {
      options.changelogFile = resolve(args[i + 1] ?? 'CHANGELOG.md');
      i += 1;
    } else if (arg === '--date') {
      options.date = args[i + 1] ?? '';
      i += 1;
    } else if (arg === '--base') {
      options.baseOverride = args[i + 1] ?? '';
      i += 1;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`);
    } else if (!options.rangeArg) {
      options.rangeArg = arg;
    } else {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }
  }

  if (options.format !== 'github' && options.format !== 'changelog') {
    throw new Error(`Unsupported format: ${options.format}`);
  }

  return options;
}

function resolveRange(rangeArg, baseOverride, exec = execSync) {
  let base;
  let head;
  if (!rangeArg) {
    head = 'HEAD';
    base = baseOverride ?? previousTag(head, exec);
  } else if (rangeArg.includes('..')) {
    [base, head] = rangeArg.split('..');
    if (baseOverride) base = baseOverride;
  } else {
    if (!isValidSemVerTag(rangeArg)) {
      throw new Error(`Invalid SemVer release tag: ${rangeArg}`);
    }
    head = rangeArg;
    base = baseOverride ?? previousTag(head, exec);
  }
  if (!base || !head) {
    throw new Error('Could not resolve base..head range');
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

export function classify(title) {
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
  return {
    prefix: null,
    strippedTitle: title,
    emoji: '📦',
    name: 'Other',
    changelogSection: 'Changed',
    order: 99,
  };
}

export function extractReleaseNote(body) {
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

export function renderGithubNotes({ base, head, groups, newContributors, repo }) {
  const lines = [];
  const sorted = [...groups.values()].sort((a, b) => a.order - b.order);
  let itemCount = 0;
  for (const group of sorted) {
    if (group.items.length === 0) continue;
    lines.push(`## ${group.emoji} ${group.name}`);
    lines.push('');
    for (const item of group.items) {
      itemCount += 1;
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
  if (itemCount === 0 && newContributors.length === 0) {
    throw new Error(`Generated release notes are empty for ${base}..${head}`);
  }
  lines.push(`**Full Changelog**: https://github.com/${normalizeRepoSlug(repo)}/compare/${base}...${head}`);
  return `${lines.join('\n')}\n`;
}

export function renderChangelogSection({ base, head, date, groups, repo }) {
  const version = isValidSemVerTag(head) ? head.slice(1) : 'Unreleased';
  const sectionBuckets = new Map(CHANGELOG_SECTION_ORDER.map((section) => [section, []]));
  const sorted = [...groups.values()].sort((a, b) => a.order - b.order);
  let itemCount = 0;

  for (const group of sorted) {
    const targetSection = group.changelogSection ?? 'Changed';
    const bucket = sectionBuckets.get(targetSection);
    for (const item of group.items) {
      itemCount += 1;
      const text = item.text.replace(/\s+/g, ' ').trim();
      const suffix = item.orphan ? `(${item.sha.slice(0, 7)})` : `(#${item.number})`;
      bucket.push(`- ${text} ${suffix}`);
    }
  }

  if (itemCount === 0) {
    throw new Error(`Generated changelog section is empty for ${base}..${head}`);
  }

  const lines = [];
  lines.push(version === 'Unreleased' ? '## [Unreleased]' : `## [${version}] - ${date}`);
  lines.push('');

  for (const section of CHANGELOG_SECTION_ORDER) {
    const items = sectionBuckets.get(section);
    if (!items || items.length === 0) continue;
    lines.push(`### ${section}`);
    lines.push('');
    lines.push(...items);
    lines.push('');
  }

  if (version !== 'Unreleased') {
    lines.push(`[${version}]: https://github.com/${normalizeRepoSlug(repo)}/compare/${base}...${head}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderFromChangelog({ changelogText, tag, base, repo }) {
  const section = extractChangelogSection(changelogText, tag);
  if (!section) {
    throw new Error(`CHANGELOG.md has no non-empty entry for ${tag}`);
  }
  const normalizedRepo = normalizeRepoSlug(repo);
  if (!base || /\*\*Full Changelog\*\*:/.test(section)) {
    return `${section}\n`;
  }
  return `${section}\n\n**Full Changelog**: https://github.com/${normalizedRepo}/compare/${base}...${tag}\n`;
}

function resolveReleaseDate(head, overrideDate, exec = execSync) {
  if (overrideDate) return overrideDate;
  if (head !== 'HEAD') {
    const tagDate = sh(`git log -1 --format=%cs ${head}`, { allowFail: true, exec });
    if (tagDate) return tagDate;
  }
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const options = parseArgs();

  if (options.hasChangelog) {
    if (!existsSync(options.changelogFile)) {
      exit(1);
    }
    const changelogText = readFileSync(options.changelogFile, 'utf8');
    const section = isValidSemVerTag(options.hasChangelog)
      ? extractChangelogSection(changelogText, options.hasChangelog)
      : null;
    exit(section ? 0 : 1);
  }

  const repo = resolveRepoSlug();

  if (options.fromChangelog) {
    if (!existsSync(options.changelogFile)) {
      throw new Error(`CHANGELOG.md not found at ${options.changelogFile}`);
    }
    const changelogText = readFileSync(options.changelogFile, 'utf8');
    const base = options.baseOverride ?? previousTag(options.fromChangelog);
    const out = renderFromChangelog({
      changelogText,
      tag: options.fromChangelog,
      base,
      repo,
    });
    stdout.write(out);
    return;
  }

  const { base, head } = resolveRange(options.rangeArg, options.baseOverride);
  stderr.write(`range: ${base}..${head}\n`);

  const candidates = getPrCandidates(base, head);
  stderr.write(`found ${candidates.length} PR references\n`);

  const groups = new Map();
  for (const [prefix, meta] of Object.entries(PREFIX_META)) {
    groups.set(prefix, { ...meta, items: [] });
  }
  groups.set('__other__', { emoji: '📦', name: 'Other', changelogSection: 'Changed', order: 99, items: [] });

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

  if (unresolved.length > 0) {
    stderr.write(
      `warning: ${unresolved.length} PR(s) could not be resolved via gh API: ${unresolved
        .map((n) => `#${n}`)
        .join(', ')}\n`,
    );
  }

  if (options.format === 'changelog') {
    const date = resolveReleaseDate(head, options.date);
    stdout.write(renderChangelogSection({ base, head, date, groups, repo }));
    return;
  }

  stderr.write('resolving first-time contributors...\n');
  const newContributors = findNewContributors(prs);
  stderr.write(`  ${newContributors.length} new contributors\n`);
  stdout.write(renderGithubNotes({ base, head, groups, newContributors, repo }));
}

const isMain = argv[1] && import.meta.url === pathToFileURL(resolve(argv[1])).href;
if (isMain) {
  try {
    main();
  } catch (err) {
    stderr.write(`${err.message}\n`);
    exit(1);
  }
}
