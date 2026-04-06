import { readFileSync, writeFileSync } from 'node:fs';

function sortDeep(obj) {
  if (Array.isArray(obj)) return obj.map(sortDeep);
  if (typeof obj !== 'object' || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, sortDeep(v)]),
  );
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/sort-i18n.mjs <file ...>');
  process.exit(1);
}

let changed = false;
for (const file of files) {
  try {
    const raw = readFileSync(file, 'utf8');
    const sorted = JSON.stringify(sortDeep(JSON.parse(raw)), null, 2) + '\n';
    if (raw !== sorted) {
      writeFileSync(file, sorted);
      changed = true;
    }
  } catch (error) {
    console.error(`sort-i18n: ${file}: ${error.message}`);
    process.exit(1);
  }
}
