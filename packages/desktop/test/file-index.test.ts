import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scanFolder } from '../src/main/context/file-index.js';

describe('scanFolder hidden files', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'clawwork-file-index-'));
    writeFileSync(join(dir, 'file.ts'), 'export const x = 1;\n');
    writeFileSync(join(dir, '.DS_Store'), 'noise');
    writeFileSync(join(dir, '.env'), 'SECRET=1\n');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('skips hidden dotfiles at the scan root but keeps allow-listed ones', () => {
    const names = scanFolder(dir)
      .map((e) => e.fileName)
      .sort();
    expect(names).toEqual(['.env', 'file.ts']);
  });
});
