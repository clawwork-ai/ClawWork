#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { argv, exit, stderr, stdout } from 'node:process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const STRICT_SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:alpha|beta|rc)\.[1-9]\d*))?$/;

export const STRICT_SEMVER_TAG_RE = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:alpha|beta|rc)\.[1-9]\d*))?$/;

export function parseSemVerTag(tag) {
  if (typeof tag !== 'string' || !STRICT_SEMVER_TAG_RE.test(tag)) {
    throw new Error(`Invalid SemVer release tag: ${String(tag)}`);
  }
  const match = tag.match(STRICT_SEMVER_TAG_RE);
  const prerelease = match[4] ?? null;
  const stage = prerelease ? prerelease.split('.')[0] : 'latest';
  return {
    tag,
    version: tag.slice(1),
    core: `${match[1]}.${match[2]}.${match[3]}`,
    isPrerelease: Boolean(prerelease),
    stage,
  };
}

export function parseWorkspacePackageDirs(rootDir) {
  const workspaceFile = resolve(rootDir, 'pnpm-workspace.yaml');
  if (!existsSync(workspaceFile)) {
    throw new Error(`Missing pnpm-workspace.yaml in ${rootDir}`);
  }
  const raw = readFileSync(workspaceFile, 'utf8');
  const lines = raw.split(/\r?\n/);
  const dirs = [];
  let inPackages = false;
  for (const line of lines) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) continue;
    if (/^\S/.test(line)) break;
    const itemMatch = line.match(/^\s*-\s*(.+?)\s*$/);
    if (!itemMatch) continue;
    const value = itemMatch[1].replace(/^['"]|['"]$/g, '').trim();
    if (value) dirs.push(value);
  }
  if (dirs.length === 0) {
    throw new Error(`No workspace packages found in ${workspaceFile}`);
  }
  return dirs;
}

export function getAuthoritativeManifestPaths(rootDir) {
  const workspaceDirs = parseWorkspacePackageDirs(rootDir);
  return ['package.json', ...workspaceDirs.map((dir) => `${dir}/package.json`)];
}

export function verifyWorkspaceVersions({ rootDir = process.cwd(), expectedVersion = null } = {}) {
  const relPaths = getAuthoritativeManifestPaths(rootDir);
  const manifests = [];
  const errors = [];

  for (const relPath of relPaths) {
    const absPath = resolve(rootDir, relPath);
    if (!existsSync(absPath)) {
      errors.push(`Missing manifest: ${relPath}`);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(absPath, 'utf8'));
    } catch (err) {
      errors.push(`Unreadable JSON in ${relPath}: ${err.message}`);
      continue;
    }
    const version = parsed.version;
    if (typeof version !== 'string' || !STRICT_SEMVER_RE.test(version)) {
      errors.push(`Invalid or missing SemVer version in ${relPath}: ${JSON.stringify(version)}`);
      continue;
    }
    manifests.push({ path: relPath, name: parsed.name ?? relPath, version });
  }

  if (expectedVersion !== null && !STRICT_SEMVER_RE.test(expectedVersion)) {
    errors.push(`Invalid expected SemVer version: ${expectedVersion}`);
  }

  if (manifests.length > 0) {
    const baseline = expectedVersion ?? manifests[0].version;
    for (const item of manifests) {
      if (item.version !== baseline) {
        errors.push(`Version mismatch in ${item.path}: expected ${baseline}, found ${item.version}`);
      }
    }
    if (errors.length === 0) {
      return { version: baseline, manifests };
    }
  }

  throw new Error(errors.join('\n'));
}

export function verifyTaggedCommit({ rootDir = process.cwd(), tag, exec = execFileSync } = {}) {
  parseSemVerTag(tag);
  const headSha = exec('git', ['-C', rootDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const tagSha = exec('git', ['-C', rootDir, 'rev-parse', `refs/tags/${tag}^{commit}`], { encoding: 'utf8' }).trim();
  if (headSha !== tagSha) {
    throw new Error(`Checked out commit ${headSha} does not match tag ${tag} (${tagSha})`);
  }
  return { headSha, tagSha };
}

function parseCliArgs(args) {
  const options = {
    checkWorkspace: false,
    tag: null,
    verifyCommit: false,
    githubOutput: null,
    rootDir: process.cwd(),
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--check-workspace') {
      options.checkWorkspace = true;
    } else if (arg === '--verify-commit') {
      options.verifyCommit = true;
    } else if (arg === '--tag') {
      options.tag = args[i + 1] ?? null;
      i += 1;
    } else if (arg === '--github-output') {
      options.githubOutput = args[i + 1] ?? null;
      i += 1;
    } else if (arg === '--root') {
      options.rootDir = resolve(args[i + 1] ?? process.cwd());
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.checkWorkspace && !options.tag) {
    throw new Error('Specify --check-workspace or --tag <vX.Y.Z>');
  }

  return options;
}

export function runCli(args = argv.slice(2)) {
  const options = parseCliArgs(args);

  if (options.tag) {
    const meta = parseSemVerTag(options.tag);
    if (options.verifyCommit) {
      verifyTaggedCommit({ rootDir: options.rootDir, tag: meta.tag });
    }
    const result = verifyWorkspaceVersions({ rootDir: options.rootDir, expectedVersion: meta.version });
    if (options.githubOutput) {
      const lines = [
        `release_tag=${meta.tag}`,
        `version=${meta.version}`,
        `stage=${meta.stage}`,
        `is_prerelease=${meta.isPrerelease}`,
      ];
      appendFileSync(options.githubOutput, `${lines.join('\n')}\n`, 'utf8');
    }
    stdout.write(
      `Verified ${meta.tag} (version=${result.version}, stage=${meta.stage}, prerelease=${meta.isPrerelease}) across ${result.manifests.length} workspace manifests.\n`,
    );
    return;
  }

  const result = verifyWorkspaceVersions({ rootDir: options.rootDir });
  stdout.write(`Workspace manifests aligned at version ${result.version} (${result.manifests.length} files).\n`);
}

const isMain = argv[1] && import.meta.url === pathToFileURL(resolve(argv[1])).href;
if (isMain) {
  try {
    runCli();
  } catch (err) {
    stderr.write(`${err.message}\n`);
    exit(1);
  }
}
