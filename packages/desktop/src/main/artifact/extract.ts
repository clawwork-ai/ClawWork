import { createHash } from 'crypto';

const LANG_EXT: Record<string, string> = {
  typescript: 'ts',
  javascript: 'js',
  python: 'py',
  rust: 'rs',
  go: 'go',
  java: 'java',
  css: 'css',
  html: 'html',
  json: 'json',
  yaml: 'yml',
  yml: 'yml',
  toml: 'toml',
  sql: 'sql',
  sh: 'sh',
  bash: 'sh',
  shell: 'sh',
  ruby: 'rb',
  tsx: 'tsx',
  jsx: 'jsx',
  markdown: 'md',
  md: 'md',
};

export interface ExtractedImage {
  src: string;
  alt: string;
  isRemote: boolean;
}

export interface ExtractedCodeBlock {
  language: string;
  content: string;
  fileName: string;
  lineCount: number;
}

export function extractImagesFromMarkdown(content: string): ExtractedImage[] {
  return [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map(([, alt, src]) => ({
    src,
    alt,
    isRemote: /^https?:\/\//.test(src),
  }));
}

export function extractCodeBlocksFromMarkdown(content: string): ExtractedCodeBlock[] {
  return [...content.matchAll(/^```(\S*)\n([\s\S]*?)\n```/gm)]
    .map(([, lang, body]) => {
      const lineCount = body.split('\n').length;
      const hasDot = lang.includes('.');
      if (lineCount <= 10 && !hasDot) return null;
      const fileName = hasDot
        ? lang
        : `snippet-${createHash('sha1').update(body).digest('hex').slice(0, 6)}.${LANG_EXT[lang.toLowerCase()] ?? 'txt'}`;
      return { language: lang, content: body, fileName, lineCount };
    })
    .filter((b): b is ExtractedCodeBlock => b !== null);
}
