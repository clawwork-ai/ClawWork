import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targets = ['dist', 'out', 'coverage', 'playwright-report', 'test-results', 'node_modules/.vite'];

for (const target of targets) {
  const targetPath = resolve(rootDir, target);
  if (!existsSync(targetPath)) continue;
  rmSync(targetPath, { recursive: true, force: true });
  console.log(`removed ${target}`);
}
