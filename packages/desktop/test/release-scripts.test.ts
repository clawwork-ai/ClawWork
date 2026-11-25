import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../../..');
const verifyScript = path.join(repoRoot, 'scripts/verify-release-version.mjs');
const releaseNotesScript = path.join(repoRoot, 'scripts/generate-release-notes.mjs');
const updateTapScript = path.join(repoRoot, 'scripts/update-homebrew-tap.sh');

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function runNode(args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): string {
  return execFileSync(process.execPath, args, {
    cwd: opts.cwd ?? repoRoot,
    env: opts.env ?? process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runScriptModule(scriptPath: string, expression: string, args: unknown[] = []): string {
  const moduleUrl = pathToFileURL(scriptPath).href;
  const code = [
    `import * as mod from ${JSON.stringify(moduleUrl)};`,
    `const args = JSON.parse(process.argv[1]);`,
    `const result = await (${expression})(mod, ...args);`,
    `if (result !== undefined) process.stdout.write(JSON.stringify(result));`,
  ].join('\n');
  return runNode(['--input-type=module', '-e', code, JSON.stringify(args)]);
}

function createWorkspaceFixture(version = '0.0.16'): string {
  const dir = makeTempDir('clawwork-ws-');
  const pkgDirs = ['packages/shared', 'packages/core', 'packages/pwa', 'packages/desktop', 'website', 'keynote'];
  writeFileSync(
    path.join(dir, 'pnpm-workspace.yaml'),
    `packages:\n${pkgDirs.map((p) => `  - '${p}'`).join('\n')}\n`,
    'utf8',
  );
  writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'clawwork', version, private: true }, null, 2),
    'utf8',
  );
  for (const pkgDir of pkgDirs) {
    const abs = path.join(dir, pkgDir);
    mkdirSync(abs, { recursive: true });
    writeFileSync(
      path.join(abs, 'package.json'),
      JSON.stringify({ name: `@clawwork/${path.basename(pkgDir)}`, version, private: true }, null, 2),
      'utf8',
    );
  }
  return dir;
}

function initPlumbingRepo(dir: string): void {
  execFileSync('git', ['-C', dir, 'init'], { stdio: 'ignore' });
  execFileSync('git', ['-C', dir, 'symbolic-ref', 'HEAD', 'refs/heads/main'], { stdio: 'ignore' });
}

function commitPlumbingTree(dir: string, message: string, parentSha?: string): string {
  execFileSync('git', ['-C', dir, 'add', '.'], { stdio: 'ignore' });
  const treeSha = execFileSync('git', ['-C', dir, 'write-tree'], { encoding: 'utf8' }).trim();
  const commitArgs = ['-C', dir, 'commit-tree', treeSha];
  if (parentSha) commitArgs.push('-p', parentSha);
  commitArgs.push('-m', message);
  const sha = execFileSync('git', commitArgs, {
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'Test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
    },
  }).trim();
  execFileSync('git', ['-C', dir, 'update-ref', 'refs/heads/main', sha], { stdio: 'ignore' });
  return sha;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('verify-release-version.mjs', () => {
  it('verifies workspace manifest alignment in the repository', () => {
    const out = runNode([verifyScript, '--check-workspace', '--root', repoRoot]);
    expect(out).toContain('Workspace manifests aligned at version 0.0.16');
  });

  it('validates strict SemVer tags and emits GitHub outputs for stable and prerelease tags', () => {
    const wsStable = createWorkspaceFixture('0.1.0');
    const outputStable = path.join(wsStable, 'github-output.txt');
    const stableOut = runNode([verifyScript, '--root', wsStable, '--tag', 'v0.1.0', '--github-output', outputStable]);
    expect(stableOut).toContain('Verified v0.1.0');
    expect(readFileSync(outputStable, 'utf8')).toBe(
      'release_tag=v0.1.0\nversion=0.1.0\nstage=latest\nis_prerelease=false\n',
    );

    const wsBeta = createWorkspaceFixture('0.1.0-beta.2');
    const outputBeta = path.join(wsBeta, 'github-output.txt');
    const betaOut = runNode([verifyScript, '--root', wsBeta, '--tag', 'v0.1.0-beta.2', '--github-output', outputBeta]);
    expect(betaOut).toContain('Verified v0.1.0-beta.2');
    expect(readFileSync(outputBeta, 'utf8')).toBe(
      'release_tag=v0.1.0-beta.2\nversion=0.1.0-beta.2\nstage=beta\nis_prerelease=true\n',
    );
  });

  it('rejects invalid SemVer tags including leading zeros and non-standard suffixes', () => {
    const ws = createWorkspaceFixture('0.1.0');
    const badTags = ['v0.1.0-fix.1', 'v01.2.0', 'v0.01.0', 'v0.1.0-alpha.0', 'v0.1.0-beta2', '0.1.0', 'dev'];
    for (const tag of badTags) {
      expect(() => runNode([verifyScript, '--root', ws, '--tag', tag])).toThrow(/Invalid SemVer release tag/);
    }
  });

  it('fails when any workspace manifest drifts or lacks version', () => {
    const ws = createWorkspaceFixture('0.0.16');
    writeFileSync(
      path.join(ws, 'packages/pwa/package.json'),
      JSON.stringify({ name: '@clawwork/pwa', version: '0.1.0', private: true }, null, 2),
      'utf8',
    );
    expect(() => runNode([verifyScript, '--root', ws, '--check-workspace'])).toThrow(/packages\/pwa\/package\.json/);
    expect(() => runNode([verifyScript, '--root', ws, '--tag', 'v0.0.16'])).toThrow(/packages\/pwa\/package\.json/);

    writeFileSync(path.join(ws, 'package.json'), JSON.stringify({ name: 'clawwork', private: true }, null, 2), 'utf8');
    expect(() => runNode([verifyScript, '--root', ws, '--check-workspace'])).toThrow(/package\.json/);
  });

  it('enforces tagged commit SHA parity via --verify-commit', () => {
    const ws = createWorkspaceFixture('0.0.16');
    initPlumbingRepo(ws);
    const sha1 = commitPlumbingTree(ws, 'chore: release v0.0.16');
    execFileSync('git', ['-C', ws, 'tag', 'v0.0.16', sha1], { stdio: 'ignore' });

    const ok = runNode([verifyScript, '--root', ws, '--tag', 'v0.0.16', '--verify-commit']);
    expect(ok).toContain('Verified v0.0.16');

    writeFileSync(path.join(ws, 'extra.txt'), 'drift\n', 'utf8');
    commitPlumbingTree(ws, 'chore: post-tag commit', sha1);

    expect(() => runNode([verifyScript, '--root', ws, '--tag', 'v0.0.16', '--verify-commit'])).toThrow(
      /does not match tag v0\.0\.16/,
    );
  });
});

describe('generate-release-notes.mjs and CHANGELOG.md', () => {
  it('extracts anchored historical entries from CHANGELOG.md with Full Changelog footer', () => {
    expect(() => runNode([releaseNotesScript, '--has-changelog', 'v0.0.16'])).not.toThrow();
    const notes = runNode([releaseNotesScript, '--from-changelog', 'v0.0.16']);
    expect(notes).toContain('Published GitHub Release before triggering Homebrew tap updates');
    expect(notes).toContain('**Full Changelog**: https://github.com/clawwork-ai/ClawWork/compare/v0.0.15...v0.0.16');

    const shallowNotes = JSON.parse(
      runScriptModule(
        releaseNotesScript,
        `(m, cl) => m.renderFromChangelog({ changelogText: cl, tag: 'v0.0.16', base: '', repo: 'clawwork-ai/ClawWork' })`,
        [readFileSync(path.join(repoRoot, 'CHANGELOG.md'), 'utf8')],
      ),
    ) as string;
    expect(shallowNotes).toContain(
      '**Full Changelog**: https://github.com/clawwork-ai/ClawWork/compare/v0.0.15...v0.0.16',
    );
  });

  it('fails when CHANGELOG.md entry is missing, empty, or given an invalid SemVer tag', () => {
    expect(() => runNode([releaseNotesScript, '--from-changelog', 'v0.1.0'])).toThrow(/no non-empty entry/);
    expect(() => runNode([releaseNotesScript, '--from-changelog', 'v0.1.0-fix.1'])).toThrow(/Invalid SemVer/);

    const dir = makeTempDir('clawwork-cl-');
    const emptyChangelog = path.join(dir, 'CHANGELOG.md');
    writeFileSync(
      emptyChangelog,
      '# Changelog\n\n## [0.2.0] - 2026-06-01\n\n## [0.1.0] - 2026-05-01\n\n- Init\n',
      'utf8',
    );
    expect(() =>
      runNode([
        releaseNotesScript,
        '--from-changelog',
        'v0.2.0',
        '--changelog-file',
        emptyChangelog,
        '--base',
        'v0.1.0',
      ]),
    ).toThrow(/no non-empty entry/);
  });

  it('anchors previousTag to valid SemVer v-tags and skips non-SemVer dev tags', () => {
    const dir = makeTempDir('clawwork-git-');
    initPlumbingRepo(dir);

    writeFileSync(path.join(dir, 'a.txt'), '1\n', 'utf8');
    const sha1 = commitPlumbingTree(dir, 'feat: one');
    execFileSync('git', ['-C', dir, 'tag', 'v0.0.13', sha1], { stdio: 'ignore' });
    execFileSync('git', ['-C', dir, 'tag', 'dev', sha1], { stdio: 'ignore' });

    writeFileSync(path.join(dir, 'a.txt'), '2\n', 'utf8');
    const sha2 = commitPlumbingTree(dir, 'feat: beta', sha1);
    execFileSync('git', ['-C', dir, 'tag', 'v0.0.14-beta.1', sha2], { stdio: 'ignore' });

    writeFileSync(path.join(dir, 'a.txt'), '3\n', 'utf8');
    const sha3 = commitPlumbingTree(dir, 'chore: release', sha2);
    execFileSync('git', ['-C', dir, 'tag', 'v0.0.14', sha3], { stdio: 'ignore' });

    const prevForStable = JSON.parse(
      runScriptModule(
        releaseNotesScript,
        '(m, d) => m.previousTag("v0.0.14", (cmd, opts) => { const { execSync } = process.getBuiltinModule("node:child_process"); return execSync(cmd, { ...opts, cwd: d }); })',
        [dir],
      ),
    );
    expect(prevForStable).toBe('v0.0.13');

    const prevForBeta = JSON.parse(
      runScriptModule(
        releaseNotesScript,
        '(m, d) => m.previousTag("v0.0.14-beta.1", (cmd, opts) => { const { execSync } = process.getBuiltinModule("node:child_process"); return execSync(cmd, { ...opts, cwd: d }); })',
        [dir],
      ),
    );
    expect(prevForBeta).toBe('v0.0.13');
  });

  it('rejects empty release note output and formats Keep a Changelog sections consistently', () => {
    expect(() =>
      runScriptModule(
        releaseNotesScript,
        `(m) => {
          const groups = new Map([['[Feat]', { emoji: '✨', name: 'Features', changelogSection: 'Added', order: 1, items: [] }]]);
          return m.renderGithubNotes({ base: 'v0.0.15', head: 'v0.0.16', groups, newContributors: [], repo: 'clawwork-ai/clawwork' });
        }`,
      ),
    ).toThrow(/empty/);

    const changelogOut = JSON.parse(
      runScriptModule(
        releaseNotesScript,
        `(m) => {
          const groups = new Map([
            ['[Feat]', { emoji: '✨', name: 'Features', changelogSection: 'Added', order: 1, items: [{ text: 'Add strict SemVer gate', number: 569 }] }],
            ['[Fix]', { emoji: '🐛', name: 'Bug Fixes', changelogSection: 'Fixed', order: 3, items: [{ text: 'Fix cask stanza wipe', sha: '1234567890', orphan: true }] }],
          ]);
          return m.renderChangelogSection({ base: 'v0.0.16', head: 'HEAD', targetTag: 'v0.0.17', date: '2026-06-01', groups, repo: 'clawwork-ai/clawwork' });
        }`,
      ),
    ) as string;

    expect(changelogOut).toContain('## [0.0.17] - 2026-06-01');
    expect(changelogOut).toContain('### Added\n\n- Add strict SemVer gate (#569)');
    expect(changelogOut).toContain('### Fixed\n\n- Fix cask stanza wipe (1234567)');
    expect(changelogOut).toContain('[0.0.17]: https://github.com/clawwork-ai/ClawWork/compare/v0.0.16...v0.0.17');
  });
});

describe('update-homebrew-tap.sh', () => {
  const armSha = 'a'.repeat(64);
  const intelSha = 'b'.repeat(64);
  const oldArmSha = '1'.repeat(64);
  const oldIntelSha = '2'.repeat(64);

  const sampleCask = `cask "clawwork" do
  arch arm: "arm64", intel: "x64"

  version "0.0.16"
  sha256 arm:   "${oldArmSha}",
         intel: "${oldIntelSha}"

  url "https://github.com/clawwork-ai/clawwork/releases/download/v#{version}/ClawWork-#{version}-mac-#{arch}.dmg"
  name "ClawWork"
  desc "Desktop client for OpenClaw"
  homepage "https://github.com/clawwork-ai/clawwork"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on macos: ">= :sonoma"

  app "ClawWork.app"

  postflight do
    system_command "xattr", args: ["-cr", "#{appdir}/ClawWork.app"]
  end

  zap trash: [
    "~/Library/Application Support/ClawWork",
    "~/Library/Preferences/com.clawwork.app.plist",
  ]
end
`;

  function createTapFixture(): { tapDir: string; caskPath: string; binDir: string } {
    const dir = makeTempDir('clawwork-tap-');
    const tapDir = path.join(dir, 'homebrew-clawwork');
    const casksDir = path.join(tapDir, 'Casks');
    const binDir = path.join(dir, 'bin');
    mkdirSync(casksDir, { recursive: true });
    mkdirSync(binDir, { recursive: true });
    const caskPath = path.join(casksDir, 'clawwork.rb');
    writeFileSync(caskPath, sampleCask, 'utf8');

    const mockGh = path.join(binDir, 'gh');
    writeFileSync(
      mockGh,
      `#!/usr/bin/env bash
set -euo pipefail
args="$*"
if [[ "$args" == *"-mac-arm64.dmg"* ]]; then
  echo '{"name":"ClawWork-0.0.17-mac-arm64.dmg","digest":"sha256:${armSha}"}'
elif [[ "$args" == *"-mac-x64.dmg"* ]]; then
  echo '{"name":"ClawWork-0.0.17-mac-x64.dmg","digest":"sha256:${intelSha}"}'
else
  exit 1
fi
`,
      'utf8',
    );
    chmodSync(mockGh, 0o755);

    const mockJq = path.join(binDir, 'jq');
    writeFileSync(
      mockJq,
      `#!/usr/bin/env bash
set -euo pipefail
node -e '
const fs = require("fs");
const input = JSON.parse(fs.readFileSync(0, "utf8"));
const q = process.argv.slice(1).find((a) => !a.startsWith("-")) || "";
if (q === ".name") {
  console.log(input.name);
} else if (q === ".digest // empty") {
  console.log(input.digest || "");
}
' -- "$@"
`,
      'utf8',
    );
    chmodSync(mockJq, 0o755);

    return { tapDir, caskPath, binDir };
  }

  it('updates version, sha256, and canonical repo slug in-place while preserving livecheck and zap stanzas', () => {
    const { tapDir, caskPath, binDir } = createTapFixture();
    execFileSync('bash', [updateTapScript], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH ?? ''}`,
        TAP_DIR: tapDir,
        RELEASE_TAG: 'v0.0.17',
      },
      encoding: 'utf8',
    });

    const updated = readFileSync(caskPath, 'utf8');
    expect(updated).toContain('version "0.0.17"');
    expect(updated).toContain(`sha256 arm:   "${armSha}",`);
    expect(updated).toContain(`       intel: "${intelSha}"`);
    expect(updated).toContain(
      'url "https://github.com/clawwork-ai/ClawWork/releases/download/v#{version}/ClawWork-#{version}-mac-#{arch}.dmg"',
    );
    expect(updated).toContain('homepage "https://github.com/clawwork-ai/ClawWork"');
    expect(updated).not.toContain('clawwork-ai/clawwork');
    expect(updated).toContain('livecheck do\n    url :url\n    strategy :github_latest\n  end');
    expect(updated).toContain('depends_on macos: ">= :sonoma"');
    expect(updated).toContain('zap trash: [\n    "~/Library/Application Support/ClawWork",');
  });

  it('skips stable Homebrew cask updates on valid prerelease tags without modifying Casks/clawwork.rb', () => {
    const { tapDir, caskPath, binDir } = createTapFixture();
    const out = execFileSync('bash', [updateTapScript], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH ?? ''}`,
        TAP_DIR: tapDir,
        RELEASE_TAG: 'v0.1.0-beta.1',
      },
      encoding: 'utf8',
    });

    expect(out).toContain('Skipping stable Homebrew cask update for prerelease tag: v0.1.0-beta.1');
    expect(readFileSync(caskPath, 'utf8')).toBe(sampleCask);
  });

  it('fails on invalid SemVer tags, missing cask file, or missing sha256 stanzas', () => {
    const { tapDir, caskPath, binDir } = createTapFixture();

    for (const badTag of ['v0.1.0-fix.1', 'v01.2.0', 'dev']) {
      expect(() =>
        execFileSync('bash', [updateTapScript], {
          cwd: repoRoot,
          env: {
            ...process.env,
            PATH: `${binDir}:${process.env.PATH ?? ''}`,
            TAP_DIR: tapDir,
            RELEASE_TAG: badTag,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        }),
      ).toThrow();
    }

    writeFileSync(caskPath, 'cask "clawwork" do\n  version "0.0.16"\nend\n', 'utf8');
    expect(() =>
      execFileSync('bash', [updateTapScript], {
        cwd: repoRoot,
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH ?? ''}`,
          TAP_DIR: tapDir,
          RELEASE_TAG: 'v0.0.17',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    ).toThrow(/sha256 stanza/);

    rmSync(caskPath);
    expect(() =>
      execFileSync('bash', [updateTapScript], {
        cwd: repoRoot,
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH ?? ''}`,
          TAP_DIR: tapDir,
          RELEASE_TAG: 'v0.0.17',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    ).toThrow(/Cask file not found/);

    const leakDir = makeTempDir('clawwork-tmpdir-');
    writeFileSync(caskPath, sampleCask, 'utf8');
    const failDownloadGh = path.join(binDir, 'gh');
    writeFileSync(
      failDownloadGh,
      `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "release" && "$2" == "view" ]]; then
  echo '{"name":"ClawWork-0.0.17-mac-arm64.dmg","digest":""}'
  exit 0
fi
exit 1
`,
      'utf8',
    );
    chmodSync(failDownloadGh, 0o755);
    expect(() =>
      execFileSync('bash', [updateTapScript], {
        cwd: repoRoot,
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH ?? ''}`,
          TMPDIR: leakDir,
          TAP_DIR: tapDir,
          RELEASE_TAG: 'v0.0.17',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    ).toThrow();
    expect(readdirSync(leakDir)).toEqual([]);
  });
});

describe('release workflow and packaging canonical slug parity', () => {
  it('contains zero lowercase clawwork-ai/clawwork slugs across release and Homebrew files', () => {
    const files = [
      '.github/workflows/release.yml',
      '.github/workflows/update-homebrew.yml',
      '.claude/skills/release-publish/SKILL.md',
      'scripts/update-homebrew-tap.sh',
      'scripts/generate-release-notes.mjs',
      'packages/desktop/electron-builder.yml',
      'packages/desktop/package.json',
    ];
    for (const rel of files) {
      const content = readFileSync(path.join(repoRoot, rel), 'utf8');
      expect(content, `${rel} still contains lowercase slug`).not.toContain('clawwork-ai/clawwork');
    }
    const builderYml = readFileSync(path.join(repoRoot, 'packages/desktop/electron-builder.yml'), 'utf8');
    expect(builderYml).toContain('owner: clawwork-ai');
    expect(builderYml).toContain('repo: ClawWork');
  });

  it('enforces strict SemVer, prerelease release flags, and Homebrew dispatch guards in workflows', () => {
    const releaseYml = readFileSync(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
    expect(releaseYml).toContain('scripts/verify-release-version.mjs --tag "$RELEASE_TAG" --verify-commit');
    expect(releaseYml).toContain(
      '^v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-((alpha|beta|rc)\\.[1-9][0-9]*))?$',
    );
    expect(releaseYml).toContain('--prerelease');

    const homebrewYml = readFileSync(path.join(repoRoot, '.github/workflows/update-homebrew.yml'), 'utf8');
    expect(homebrewYml).toContain('CLAWWORK_REPO: clawwork-ai/ClawWork');
    expect(homebrewYml).toContain(
      "!contains(github.event_name == 'workflow_dispatch' && inputs.tag || github.event.release.tag_name, '-')",
    );
  });
});
