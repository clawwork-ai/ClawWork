const modules: Record<string, Record<string, string>> = {
  en: import.meta.glob('./en/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>,
  zh: import.meta.glob('./zh/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>,
};

interface DocMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  content: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return { meta, content: match[2] };
}

function parseFilename(path: string): { date: string; slug: string } {
  const filename = path.split('/').pop()!.replace(/\.md$/, '');
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (dateMatch) return { date: dateMatch[1], slug: dateMatch[2] };
  return { date: '', slug: filename };
}

function buildRegistry(mods: Record<string, string>): Map<string, DocMeta> {
  const map = new Map<string, DocMeta>();
  for (const [path, raw] of Object.entries(mods)) {
    const { date, slug } = parseFilename(path);
    const { meta, content } = parseFrontmatter(raw);
    map.set(slug, {
      slug,
      title: meta.title ?? slug,
      description: meta.description ?? '',
      date: meta.date ?? date,
      content,
    });
  }
  return map;
}

const registries: Record<string, Map<string, DocMeta>> = {};
for (const [locale, mods] of Object.entries(modules)) {
  registries[locale] = buildRegistry(mods);
}

export function getDoc(locale: string, slug: string): { doc: DocMeta; fallback: boolean } | null {
  const primary = registries[locale]?.get(slug);
  if (primary) return { doc: primary, fallback: false };
  const other = locale === 'zh' ? 'en' : 'zh';
  const fb = registries[other]?.get(slug);
  if (fb) return { doc: fb, fallback: true };
  return null;
}

export function getArticleList(locale: string): DocMeta[] {
  const other = locale === 'zh' ? 'en' : 'zh';
  const primaryMap = registries[locale] ?? new Map<string, DocMeta>();
  const fallbackMap = registries[other] ?? new Map<string, DocMeta>();

  const merged = new Map<string, DocMeta>();
  for (const [slug, doc] of fallbackMap) merged.set(slug, doc);
  for (const [slug, doc] of primaryMap) merged.set(slug, doc);

  return [...merged.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export const allSlugs: ReadonlySet<string> = new Set(Object.values(registries).flatMap((reg) => [...reg.keys()]));
