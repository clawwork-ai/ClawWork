#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PACKAGES = [
  {
    name: 'desktop',
    localeDir: join(ROOT, 'packages/desktop/src/renderer/i18n/locales'),
    sourceDirs: [join(ROOT, 'packages/desktop/src/renderer'), join(ROOT, 'packages/core/src')],
  },
  {
    name: 'pwa',
    localeDir: join(ROOT, 'packages/pwa/src/i18n/locales'),
    sourceDirs: [join(ROOT, 'packages/pwa/src'), join(ROOT, 'packages/core/src')],
  },
];

const SHARED_CONSTANTS = join(ROOT, 'packages/shared/src/constants.ts');
const QUICK_LAUNCH = join(ROOT, 'packages/desktop/src/renderer/quick-launch.html');

let exitCode = 0;

function flatten(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flatten(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function collectFiles(dir, exts) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, exts));
    } else if (exts.includes(extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

for (const pkg of PACKAGES) {
  if (!existsSync(pkg.localeDir)) continue;

  console.log(`\n══ ${pkg.name} ══`);

  // ── Key parity check ──────────────────────────────────────────────
  console.log('── i18n key parity check ──');

  const localeFiles = readdirSync(pkg.localeDir).filter((f) => f.endsWith('.json'));
  const enKeys = flatten(readJson(join(pkg.localeDir, 'en.json')));
  const enSet = new Set(enKeys);

  for (const file of localeFiles) {
    if (file === 'en.json') continue;
    const lang = file.replace('.json', '');
    const langKeys = flatten(readJson(join(pkg.localeDir, file)));
    const langSet = new Set(langKeys);

    const missing = enKeys.filter((k) => !langSet.has(k));
    const extra = langKeys.filter((k) => !enSet.has(k));

    if (missing.length > 0) {
      console.error(
        `  ERROR [${lang}] missing ${missing.length} keys: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`,
      );
      exitCode = 1;
    }
    if (extra.length > 0) {
      console.error(
        `  ERROR [${lang}] extra ${extra.length} keys: ${extra.slice(0, 5).join(', ')}${extra.length > 5 ? '...' : ''}`,
      );
      exitCode = 1;
    }
    if (missing.length === 0 && extra.length === 0) {
      console.log(`  OK [${lang}]`);
    }
  }

  // ── Unused key check ──────────────────────────────────────────────
  console.log('\n── i18n unused key check ──');

  const sourceFiles = pkg.sourceDirs.flatMap((d) => collectFiles(d, ['.ts', '.tsx']));
  const sourceText = sourceFiles.map((f) => readFileSync(f, 'utf-8')).join('\n');

  const dynamicPrefixRe = /t\(\s*`([^$`]+)\$\{/g;
  const dynamicPrefixes = [];
  let dm;
  while ((dm = dynamicPrefixRe.exec(sourceText)) !== null) {
    dynamicPrefixes.push(dm[1]);
  }

  const unreferenced = [];
  for (const key of enKeys) {
    if (sourceText.includes(key)) continue;
    if (dynamicPrefixes.some((p) => key.startsWith(p))) continue;
    unreferenced.push(key);
  }

  if (unreferenced.length > 0) {
    console.error(
      `  ERROR ${unreferenced.length} unused keys (remove from all locale files, or use a scanner-visible pattern like t(\`prefix.\${var}\`)):`,
    );
    for (const k of unreferenced) {
      console.error(`    - ${k}`);
    }
    exitCode = 1;
  } else {
    console.log('  OK — no unused keys detected');
  }

  // ── defaultValue anti-pattern check ───────────────────────────────
  console.log('\n── i18n defaultValue check ──');

  const defaultValueRe = /\bt\(\s*['"][^'"]+['"]\s*,\s*\{[^}]*defaultValue/g;
  const violations = [];
  for (const file of sourceFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (defaultValueRe.test(lines[i])) {
        violations.push(`${file.replace(ROOT + '/', '')}:${i + 1}`);
      }
      defaultValueRe.lastIndex = 0;
    }
  }

  if (violations.length > 0) {
    console.error(`  ERROR ${violations.length} t() calls use defaultValue — add the key to en.json instead:`);
    for (const v of violations) {
      console.error(`    - ${v}`);
    }
    exitCode = 1;
  } else {
    console.log('  OK — no defaultValue usage detected');
  }
}

// ── quick-launch.html drift check (desktop only) ───────────────────
if (existsSync(QUICK_LAUNCH) && existsSync(SHARED_CONSTANTS)) {
  console.log('\n── quick-launch.html locale drift check ──');

  const sharedSrc = readFileSync(SHARED_CONSTANTS, 'utf-8');
  const codesMatch = sharedSrc.match(/SUPPORTED_LANGUAGE_CODES\s*=\s*\[([^\]]+)\]/);
  if (!codesMatch) {
    console.error('  ERROR could not parse SUPPORTED_LANGUAGE_CODES from shared/constants.ts');
    exitCode = 1;
  } else {
    const sharedCodes = new Set(
      codesMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean),
    );

    const qlHtml = readFileSync(QUICK_LAUNCH, 'utf-8');
    const messagesMatch = qlHtml.match(/var\s+messages\s*=\s*\{([\s\S]*?)\};/);
    if (!messagesMatch) {
      console.error('  ERROR could not parse messages object from quick-launch.html');
      exitCode = 1;
    } else {
      const qlCodes = new Set([...messagesMatch[1].matchAll(/['"]?([a-zA-Z-]+)['"]?\s*:\s*\{/g)].map((m) => m[1]));

      const missingInQl = [...sharedCodes].filter((c) => !qlCodes.has(c));
      const extraInQl = [...qlCodes].filter((c) => !sharedCodes.has(c));

      if (missingInQl.length > 0) {
        console.error(`  ERROR quick-launch.html missing locales: ${missingInQl.join(', ')}`);
        exitCode = 1;
      }
      if (extraInQl.length > 0) {
        console.error(`  ERROR quick-launch.html has extra locales: ${extraInQl.join(', ')}`);
        exitCode = 1;
      }
      if (missingInQl.length === 0 && extraInQl.length === 0) {
        console.log('  OK — locale keys match SUPPORTED_LANGUAGE_CODES');
      }
    }
  }
}

// ── Summary ─────────────────────────────────────────────────────────
console.log(`\ni18n check ${exitCode === 0 ? 'passed' : 'FAILED'}`);
process.exit(exitCode);
